package com.example.demo.domain.battle.service;

import com.example.demo.domain.battle.dto.RedisBattleSession;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.member.repository.MemberRepository;
import com.example.demo.domain.outfit.entity.Outfit;
import com.example.demo.domain.outfit.repository.OutfitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BattleMatchService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MemberRepository memberRepository;
    private final OutfitRepository outfitRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final String MATCH_QUEUE = "battle:match_queue";

    @Transactional(readOnly = true)
    public void startMatching(Long memberId, Long outfitAId) {
        if (memberId == null) {
            throw new IllegalArgumentException("Member ID cannot be null");
        }
        if (outfitAId == null) {
            throw new IllegalArgumentException("Outfit ID cannot be null");
        }
        // 1. 내 정보와 코디 정보 가져오기
        Member me = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found with id: " + memberId));
        Outfit myOutfit = outfitRepository.findById(outfitAId)
                .orElseThrow(() -> new IllegalArgumentException("Outfit not found with id: " + outfitAId));

        // 2. 대기열에서 상대방 한 명 꺼내기 (원자적 연산)
        String opponentInfo = (String) redisTemplate.opsForList().leftPop(MATCH_QUEUE);

        if (opponentInfo != null) {
            // 3. [매칭 성공] 세션 생성 로직 실행
            String[] parts = opponentInfo.split(":"); // "ID:Nickname:OutfitID:PreviewUrl" 형식 가정
            Long opponentId = Long.parseLong(parts[0]);
            String opponentNickname = parts[1];
            Long opponentOutfitId = Long.parseLong(parts[2]);
            String opponentPreviewUrl = parts[3];

            Long sessionId = System.currentTimeMillis(); // 유니크한 세션 ID 생성

            RedisBattleSession session = RedisBattleSession.builder()
                    .sessionId(sessionId)
                    .hostId(opponentId) // 먼저 기다린 사람을 Host로 설정
                    .hostNickname(opponentNickname)
                    .hostOutfitId(opponentOutfitId)
                    .hostPreviewUrl(opponentPreviewUrl)
                    .guestId(me.getId())
                    .guestNickname(me.getNickname())
                    .guestOutfitId(myOutfit.getId())
                    .guestPreviewUrl(myOutfit.getPreviewUrl())
                    .status("WAITING_SPECTATORS") // 관전자를 기다리는 상태
                    .spectatorCount(0)
                    .build();

            // 4. Redis Hash에 저장 및 활성 목록 추가
            redisTemplate.<String, Object>opsForHash().put("battle:session:" + sessionId, "data",
                    java.util.Objects.requireNonNull(session));
            redisTemplate.opsForSet().add("battle:active_list", sessionId.toString());

            // 5. 웹소켓으로 두 유저에게 알림 (개별 큐 사용)
            messagingTemplate.convertAndSend("/topic/match/" + me.getId(), "MATCHED:" + sessionId);
            messagingTemplate.convertAndSend("/topic/match/" + opponentId, "MATCHED:" + sessionId);

        } else {
            // 4. [대기] 대기열에 내 정보 등록 (ID:닉네임:코디ID:이미지URL)
            String myInfo = String.format("%d:%s:%d:%s",
                    me.getId(), me.getNickname(), myOutfit.getId(), myOutfit.getPreviewUrl());
            redisTemplate.opsForList().rightPush(MATCH_QUEUE, java.util.Objects.requireNonNull(myInfo));
        }
    }
}