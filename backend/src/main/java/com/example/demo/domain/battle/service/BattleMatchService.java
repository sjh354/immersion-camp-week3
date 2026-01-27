package com.example.demo.domain.battle.service;

import com.example.demo.domain.battle.dto.RedisBattleSession;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.member.repository.MemberRepository;
import com.example.demo.domain.outfit.entity.Outfit;
import com.example.demo.domain.outfit.repository.OutfitRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class BattleMatchService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MemberRepository memberRepository;
    private final OutfitRepository outfitRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private static final String MATCH_QUEUE = "battle:match_queue_v2";

    @Transactional(readOnly = true)
    public void startMatching(Long memberId) {
        if (memberId == null) {
            throw new IllegalArgumentException("Member ID cannot be null");
        }
        String lockKey = "battle:lock:" + memberId;
        Boolean lockAcquired = redisTemplate.opsForValue().setIfAbsent(lockKey, "1", Duration.ofSeconds(5));
        if (lockAcquired == null || !lockAcquired) {
            log.info("battle.match.locked memberId={}", memberId);
            return;
        }
        Object existingSession = redisTemplate.opsForValue().get("battle:playing:" + memberId);
        if (existingSession != null) {
            log.info("battle.match.alreadyPlaying memberId={} sessionId={}", memberId, existingSession);
            redisTemplate.delete(lockKey);
            return;
        }

        try {
            // 1. 내 정보와 덱(코디) 정보 가져오기
            Member me = memberRepository.findById(memberId)
                    .orElseThrow(() -> new IllegalArgumentException("Member not found with id: " + memberId));

        if (me.getMainOutfitId1() == null || me.getMainOutfitId2() == null) {
            throw new IllegalStateException("배틀 덱(1, 2라운드 코디)이 설정되지 않았습니다.");
        }

        Outfit outfit1 = outfitRepository.findById(me.getMainOutfitId1())
                .orElseThrow(() -> new IllegalArgumentException("Outfit 1 not found"));
            Outfit outfit2 = outfitRepository.findById(me.getMainOutfitId2())
                    .orElseThrow(() -> new IllegalArgumentException("Outfit 2 not found"));

        // 중복 대기열 방지: 내 기존 엔트리 제거
            java.util.List<Object> queueSnapshot = redisTemplate.opsForList().range(MATCH_QUEUE, 0, -1);
            if (queueSnapshot != null) {
                String prefixV2 = memberId + "|#|";
                String prefixV1 = memberId + ":";
                for (Object obj : queueSnapshot) {
                    String info = (String) obj;
                    if (info.startsWith(prefixV2) || info.startsWith(prefixV1)) {
                        redisTemplate.opsForList().remove(MATCH_QUEUE, 0, info);
                    }
                }
            }

        // 2. 대기열에서 상대방 한 명 꺼내기 (원자적 연산)
            String opponentInfo = null;
            Long queueSize = redisTemplate.opsForList().size(MATCH_QUEUE);
            int attempts = queueSize == null ? 0 : queueSize.intValue();
            while (attempts > 0) {
                String candidate = (String) redisTemplate.opsForList().leftPop(MATCH_QUEUE);
                if (candidate == null) {
                    break;
                }
                String[] parts = candidate.split("\\|#\\|");
                if (parts.length < 6) {
                    log.info("battle.match.skip.invalidPayload memberId={} payload={}", memberId, candidate);
                    attempts--;
                    continue;
                }
                Long candidateId = Long.parseLong(parts[0]);
                Object candidateSession = redisTemplate.opsForValue().get("battle:playing:" + candidateId);
                if (candidateId.equals(memberId)) {
                    redisTemplate.opsForList().rightPush(MATCH_QUEUE, java.util.Objects.requireNonNull(candidate));
                    log.info("battle.match.selfPop memberId={} requeued=true", memberId);
                    attempts--;
                    continue;
                }
                if (candidateSession != null) {
                    redisTemplate.opsForList().rightPush(MATCH_QUEUE, java.util.Objects.requireNonNull(candidate));
                    log.info("battle.match.opponentBusy memberId={} opponentId={} sessionId={}", memberId, candidateId, candidateSession);
                    attempts--;
                    continue;
                }
                opponentInfo = candidate;
                break;
            }
            log.info("battle.match.start memberId={} queuePop={}", memberId, opponentInfo != null);

            if (opponentInfo != null) {
                // 3. [매칭 성공] 세션 생성 로직 실행
                // Format: "ID|#|Nickname|#|Outfit1ID|#|Preview1|#|Outfit2ID|#|Preview2"
                String[] parts = opponentInfo.split("\\|#\\|");
                Long opponentId = Long.parseLong(parts[0]);
                String opponentLockKey = "battle:lock:" + opponentId;
                Boolean opponentLock = redisTemplate.opsForValue().setIfAbsent(opponentLockKey, "1", Duration.ofSeconds(5));
                if (opponentLock == null || !opponentLock) {
                    redisTemplate.opsForList().rightPush(MATCH_QUEUE, java.util.Objects.requireNonNull(opponentInfo));
                    log.info("battle.match.opponentLocked memberId={} opponentId={}", memberId, opponentId);
                    return;
                }

                try {
                    Object opponentPlaying = redisTemplate.opsForValue().get("battle:playing:" + opponentId);
                    if (opponentPlaying != null) {
                        redisTemplate.opsForList().rightPush(MATCH_QUEUE, java.util.Objects.requireNonNull(opponentInfo));
                        log.info("battle.match.opponentAlreadyPlaying memberId={} opponentId={} sessionId={}", memberId, opponentId, opponentPlaying);
                        return;
                    }

                    Boolean myPlaying = redisTemplate.opsForValue().setIfAbsent("battle:playing:" + memberId, "PENDING");
                    Boolean opponentPlayingSet = redisTemplate.opsForValue().setIfAbsent("battle:playing:" + opponentId, "PENDING");
                    if (myPlaying == null || opponentPlayingSet == null || !myPlaying || !opponentPlayingSet) {
                        redisTemplate.delete("battle:playing:" + memberId);
                        redisTemplate.delete("battle:playing:" + opponentId);
                        redisTemplate.opsForList().rightPush(MATCH_QUEUE, java.util.Objects.requireNonNull(opponentInfo));
                        log.info("battle.match.playingConflict memberId={} opponentId={}", memberId, opponentId);
                        return;
                    }

                    String opponentNickname = parts[1];
                    Long opponentOutfit1Id = Long.parseLong(parts[2]);
                    String opponentPreview1Url = parts[3];
                    Long opponentOutfit2Id = Long.parseLong(parts[4]);
                    String opponentPreview2Url = parts[5];

                    Long sessionId = System.currentTimeMillis(); // 유니크한 세션 ID 생성

                    RedisBattleSession session = RedisBattleSession.builder()
                    .sessionId(sessionId)
                    .hostId(opponentId)
                    .hostNickname(opponentNickname)
                    .hostOutfit1Id(opponentOutfit1Id)
                    .hostPreview1Url(opponentPreview1Url)
                    .hostOutfit2Id(opponentOutfit2Id)
                    .hostPreview2Url(opponentPreview2Url)
                    .guestId(me.getId())
                    .guestNickname(me.getNickname())
                    .guestOutfit1Id(outfit1.getId())
                    .guestPreview1Url(outfit1.getPreviewUrl())
                    .guestOutfit2Id(outfit2.getId())
                    .guestPreview2Url(outfit2.getPreviewUrl())
                    .status("WAITING_SPECTATORS")
                    .spectatorCount(0)
                    .currentRound(1) // 라운드 초기화
                    .hostVoteCountRound1(0).guestVoteCountRound1(0)
                    .round2VoteSuccessCount(0).round2VoteFailCount(0)
                    .build();

                    // 4. Redis Hash에 저장 및 활성 목록 추가 (Fields로 풀어서 저장)
                    java.util.Map<String, Object> sessionMap = objectMapper.convertValue(session, new com.fasterxml.jackson.core.type.TypeReference<java.util.Map<String, Object>>() {});
                    redisTemplate.opsForHash().putAll("battle:session:" + sessionId, sessionMap);
                    redisTemplate.opsForSet().add("battle:active_list", sessionId.toString());

                    // 5. 웹소켓으로 두 유저에게 알림
                    messagingTemplate.convertAndSend("/topic/match/" + me.getId(), "MATCHED:" + sessionId);
                    messagingTemplate.convertAndSend("/topic/match/" + opponentId, "MATCHED:" + sessionId);

                    // 6. 플레이 중 상태 저장 (재접속/새로고침 시 확인용)
                    redisTemplate.opsForValue().set("battle:playing:" + me.getId(), sessionId.toString());
                    redisTemplate.opsForValue().set("battle:playing:" + opponentId, sessionId.toString());
                    log.info("battle.match.success sessionId={} host={} guest={}", sessionId, opponentId, me.getId());
                } finally {
                    redisTemplate.delete(opponentLockKey);
                }

            } else {
                // 4. [대기] 대기열에 내 정보 등록 (ID|#|Nickname|#|Outfit1ID|#|Preview1|#|Outfit2ID|#|Preview2)
                String myInfo = String.format("%d|#|%s|#|%d|#|%s|#|%d|#|%s",
                        me.getId(), me.getNickname(),
                        outfit1.getId(), outfit1.getPreviewUrl(),
                        outfit2.getId(), outfit2.getPreviewUrl());
                redisTemplate.opsForList().rightPush(MATCH_QUEUE, java.util.Objects.requireNonNull(myInfo));
                Long queueSizeAfter = redisTemplate.opsForList().size(MATCH_QUEUE);
                log.info("battle.match.enqueued memberId={} queueSize={}", memberId, queueSizeAfter);
            }
        } finally {
            redisTemplate.delete(lockKey);
        }
    }

    // 6. 매칭 취소
    public void cancelMatching(Long memberId) {
        // 대기열 전체 스캔 (성능상 한계가 있지만 데모용으로는 충분)
        java.util.List<Object> queue = redisTemplate.opsForList().range(MATCH_QUEUE, 0, -1);
        if (queue != null) {
            String prefixV2 = memberId + "|#|";
            String prefixV1 = memberId + ":";
            for (Object obj : queue) {
                String info = (String) obj;
                if (info.startsWith(prefixV2) || info.startsWith(prefixV1)) {
                    redisTemplate.opsForList().remove(MATCH_QUEUE, 1, info);
                    Long queueSize = redisTemplate.opsForList().size(MATCH_QUEUE);
                    log.info("battle.match.cancelled memberId={} queueSize={}", memberId, queueSize);
                    return; // 하나만 삭제하고 종료
                }
            }
        }
        log.info("battle.match.cancel.noop memberId={}", memberId);
    }

    // 7. 매칭 상태 확인
    public java.util.Map<String, String> getMatchStatus(Long memberId) {
        // 1. 대기열 확인
        java.util.List<Object> queue = redisTemplate.opsForList().range(MATCH_QUEUE, 0, -1);
        boolean isWaiting = false;

        if (queue != null) {
            String prefixV2 = memberId + "|#|";
            String prefixV1 = memberId + ":";
            for (Object obj : queue) {
                String info = (String) obj;
                if (info.startsWith(prefixV2) || info.startsWith(prefixV1)) {
                    isWaiting = true;
                    break;
                }
            }
        }

        if (isWaiting) {
            log.info("battle.match.status memberId={} status=WAITING", memberId);
            return java.util.Map.of("status", "WAITING");
        } 
        
        // 2. 진행 중인 게임 확인 (MATCHED)
        Object playingSessionId = redisTemplate.opsForValue().get("battle:playing:" + memberId);
        if (playingSessionId != null) {
            log.info("battle.match.status memberId={} status=MATCHED sessionId={}", memberId, playingSessionId);
            return java.util.Map.of("status", "MATCHED", "sessionId", playingSessionId.toString());
        }

        log.info("battle.match.status memberId={} status=NONE", memberId);
        return java.util.Map.of("status", "NONE");
    }
}
