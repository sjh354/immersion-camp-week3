package com.example.demo.domain.battle.service;

import com.example.demo.domain.battle.dto.BattleMessage;
import com.example.demo.domain.battle.dto.BattleRoomResponse;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import org.springframework.context.annotation.Lazy;

@Service
@RequiredArgsConstructor
public class BattleGameService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final MemberRepository memberRepository;
    private final BattleRoomService battleRoomService;
    @Lazy
    private final BattleTimerService battleTimerService;

    // 1. 라운드 2 시작 (1라운드 결과 정산 및 승자 결정 -> 승자/패자 DB 업데이트)
    @Transactional
    public void transitionToRound2(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;

        Integer hostVotes1 = getInt(sessionKey, "hostVoteCountRound1");
        Integer guestVotes1 = getInt(sessionKey, "guestVoteCountRound1");
        int hVotes = hostVotes1 != null ? hostVotes1 : 0;
        int gVotes = guestVotes1 != null ? guestVotes1 : 0;

        Long hostId = getLong(sessionKey, "hostId");
        Long guestId = getLong(sessionKey, "guestId");
        
        if (hostId == null || guestId == null) {
            // 방이 만료되었거나 데이터 오류
            throw new IllegalStateException("배틀 정보를 찾을 수 없습니다.");
        }

        Long r1WinnerId;
        Long r1LoserId;
        String winReason;

        if (hVotes == gVotes) {
            // 1라운드 무승부 -> 세션 종료
            BattleMessage message = BattleMessage.builder()
                    .type(BattleMessage.MessageType.END)
                    .sessionId(sessionId)
                    .content("DRAW_ROUND_1")
                    .currentRound(1)
                    .build();

            messagingTemplate.convertAndSend("/topic/battle/" + sessionId, message);

            // Redis 정리 (endGame과 동일한 정리 로직)
            redisTemplate.opsForHash().put(sessionKey, "status", "END");
            redisTemplate.opsForSet().remove("battle:active_list", sessionId.toString());
            redisTemplate.delete("battle:playing:" + hostId);
            redisTemplate.delete("battle:playing:" + guestId);
            redisTemplate.expire(sessionKey, java.time.Duration.ofHours(1));
            return;
        }

        if (hVotes > gVotes) { // 무승부는 위에서 처리했으므로 >
            r1WinnerId = hostId;
            r1LoserId = guestId;
            winReason = "HOST_WON_ROUND_1";
        } else {
            r1WinnerId = guestId;
            r1LoserId = hostId;
            winReason = "GUEST_WON_ROUND_1";
        }

        // DB 업데이트: 승자는 +1승, 패자는 +1패 (1라운드 종료 시점에 즉시 반영)
        Member winner = memberRepository.findById(r1WinnerId).orElseThrow();
        Member loser = memberRepository.findById(r1LoserId).orElseThrow();
        winner.incrementWinCount();
        loser.incrementLossCount();

        // Redis 상태 업데이트
        redisTemplate.opsForHash().put(sessionKey, "currentRound", 2);
        redisTemplate.opsForHash().put(sessionKey, "round1WinnerId", r1WinnerId);

        // 라운드 변경 및 승자 알림 전송
        BattleMessage message = BattleMessage.builder()
                .type(BattleMessage.MessageType.ROUND_CHANGE)
                .sessionId(sessionId)
                .content(winReason)
                .currentRound(2)
                .round1WinnerId(r1WinnerId)
                .build();

        messagingTemplate.convertAndSend("/topic/battle/" + sessionId, message);
    }

    // 2. 게임 종료 및 결과 처리 (2라운드 심사 결과 정산)
    @Transactional
    public void endGame(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;
        System.out.println("[BattleGameService] endGame called for session: " + sessionId);

        Long r1WinnerId = getLong(sessionKey, "round1WinnerId");
        Long hostId = getLong(sessionKey, "hostId");
        Long guestId = getLong(sessionKey, "guestId");
        
        System.out.println("[BattleGameService] IDs - Winner: " + r1WinnerId + ", Host: " + hostId + ", Guest: " + guestId);

        if (r1WinnerId == null || hostId == null || guestId == null) {
            System.out.println("[BattleGameService] Missing IDs, aborting endGame.");
            return; 
        }

        Long r1LoserId = r1WinnerId.equals(hostId) ? guestId : hostId;

        Integer successVotes = getInt(sessionKey, "round2VoteSuccessCount");
        Integer failVotes = getInt(sessionKey, "round2VoteFailCount");
        int sVotes = successVotes != null ? successVotes : 0;
        int fVotes = failVotes != null ? failVotes : 0;
        
        System.out.println("[BattleGameService] Votes - Success: " + sVotes + ", Fail: " + fVotes);
        
        String r2Result = (sVotes >= fVotes) ? "SUCCESS" : "FAIL";

        // ... (Skipped DB updates) ...

        BattleMessage resultMessage = BattleMessage.builder()
                .type(BattleMessage.MessageType.END)
                .sessionId(sessionId)
                .content(r2Result)
                .round1WinnerId(r1WinnerId)
                .round2VoteSuccessCount(sVotes)
                .round2VoteFailCount(fVotes)
                .build();
        
        System.out.println("[BattleGameService] Sending END message.");
        messagingTemplate.convertAndSend("/topic/battle/" + sessionId, resultMessage);

        // Redis 상태 업데이트 (종료 상태 저장)
        redisTemplate.opsForHash().put(sessionKey, "status", "END");
        System.out.println("[BattleGameService] Redis status updated to END.");

        // Redis 정리
        redisTemplate.opsForSet().remove("battle:active_list", sessionId.toString());
        redisTemplate.delete("battle:playing:" + hostId);
        redisTemplate.delete("battle:playing:" + guestId);
        redisTemplate.expire(sessionKey, java.time.Duration.ofHours(1));
    }

    // 3. 멘트 제출 처리
    public void submitMent(Long sessionId, Long memberId, String ment) {
        String sessionKey = "battle:session:" + sessionId;
        
        // Redis에서 직접 조회 시 NPE 방지
        Long hostId = getLong(sessionKey, "hostId");
        Long guestId = getLong(sessionKey, "guestId");
        Long winnerId = getLong(sessionKey, "round1WinnerId");

        if (hostId == null || guestId == null) {
             throw new IllegalArgumentException("배틀 방 정보가 유효하지 않습니다.");
        }

        if (memberId.equals(hostId)) {
            redisTemplate.opsForHash().put(sessionKey, "hostMent", ment);
        } else if (memberId.equals(guestId)) {
            redisTemplate.opsForHash().put(sessionKey, "guestMent", ment);
        } else {
            throw new IllegalArgumentException("참가자가 아닙니다.");
        }

        BattleRoomResponse snapshot = battleRoomService.getBattleRoomSnapshot(sessionId);
        messagingTemplate.convertAndSend(
                "/topic/battle/" + sessionId,
                Map.of("type", "SESSION", "session", snapshot)
        );

        // Round2 timer starts only after round1 winner submits ment.
        if (winnerId != null && memberId.equals(winnerId)) {
            Object statusObj = redisTemplate.opsForHash().get(sessionKey, "status");
            String status = statusObj != null ? statusObj.toString() : null;
            if (!"VOTING_ROUND_2".equals(status) && !"END".equals(status)) {
                battleTimerService.startRound2Timer(sessionId);
            }
        }
    }

    private Long getLong(String key, String field) {
        Object val = redisTemplate.opsForHash().get(key, field);
        if (val == null) return null;
        try {
            return Long.valueOf(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private Integer getInt(String key, String field) {
        Object val = redisTemplate.opsForHash().get(key, field);
        if (val == null) return null;
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
