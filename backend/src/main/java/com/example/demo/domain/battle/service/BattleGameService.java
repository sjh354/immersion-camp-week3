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

@Service
@RequiredArgsConstructor
public class BattleGameService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final MemberRepository memberRepository;
    private final BattleRoomService battleRoomService;

    // 1. 라운드 2 시작 (1라운드 결과 정산 및 승자 결정 -> 승자/패자 DB 업데이트)
    @Transactional
    public void transitionToRound2(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;

        Integer hostVotes1 = (Integer) redisTemplate.opsForHash().get(sessionKey, "hostVoteCountRound1");
        Integer guestVotes1 = (Integer) redisTemplate.opsForHash().get(sessionKey, "guestVoteCountRound1");
        int hVotes = hostVotes1 != null ? hostVotes1 : 0;
        int gVotes = guestVotes1 != null ? guestVotes1 : 0;

        Long hostId = Long.valueOf(redisTemplate.opsForHash().get(sessionKey, "hostId").toString());
        Long guestId = Long.valueOf(redisTemplate.opsForHash().get(sessionKey, "guestId").toString());

        Long r1WinnerId;
        Long r1LoserId;
        String winReason;

        if (hVotes >= gVotes) { // 동점시 Host 승리
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

        Long r1WinnerId = Long.valueOf(redisTemplate.opsForHash().get(sessionKey, "round1WinnerId").toString());
        Long hostId = Long.valueOf(redisTemplate.opsForHash().get(sessionKey, "hostId").toString());
        Long guestId = Long.valueOf(redisTemplate.opsForHash().get(sessionKey, "guestId").toString());
        Long r1LoserId = r1WinnerId.equals(hostId) ? guestId : hostId;

        Integer successVotes = (Integer) redisTemplate.opsForHash().get(sessionKey, "round2VoteSuccessCount");
        Integer failVotes = (Integer) redisTemplate.opsForHash().get(sessionKey, "round2VoteFailCount");
        int sVotes = successVotes != null ? successVotes : 0;
        int fVotes = failVotes != null ? failVotes : 0;

        String r2Result = (sVotes >= fVotes) ? "SUCCESS" : "FAIL";

        // DB 업데이트: 이미 1라운드 종료 시(round transition)에 반영되었으므로 여기서는 생략
        // Member winner = memberRepository.findById(r1WinnerId).orElseThrow();
        // Member loser = memberRepository.findById(r1LoserId).orElseThrow();

        // 2라운드 성공 보상 로직 등이 필요하면 여기에 추가
        // if ("SUCCESS".equals(r2Result)) { ... }
        
        // (선택) 2라운드 성공 여부에 따라 추가 보상? 일단 전적만 승/패 반영

        // 결과 전송
        BattleMessage resultMessage = BattleMessage.builder()
                .type(BattleMessage.MessageType.END)
                .sessionId(sessionId)
                .content(r2Result) // 2라운드 성공/실패 여부
                .round1WinnerId(r1WinnerId)
                .round2VoteSuccessCount(sVotes)
                .round2VoteFailCount(fVotes)
                .build();

        messagingTemplate.convertAndSend("/topic/battle/" + sessionId, resultMessage);

        // Redis 정리
        redisTemplate.opsForSet().remove("battle:active_list", sessionId.toString());
        redisTemplate.delete("battle:playing:" + hostId);
        redisTemplate.delete("battle:playing:" + guestId);
        redisTemplate.expire(sessionKey, java.time.Duration.ofHours(1));
    }

    // 3. 멘트 제출 처리
    public void submitMent(Long sessionId, Long memberId, String ment) {
        String sessionKey = "battle:session:" + sessionId;
        
        Long hostId = Long.valueOf(redisTemplate.opsForHash().get(sessionKey, "hostId").toString());
        Long guestId = Long.valueOf(redisTemplate.opsForHash().get(sessionKey, "guestId").toString());

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
    }
}
