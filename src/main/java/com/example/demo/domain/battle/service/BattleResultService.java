package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

import com.example.demo.domain.battle.dto.BattleMessage;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.member.repository.MemberRepository;

@Service
@RequiredArgsConstructor
public class BattleResultService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MemberRepository memberRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public void processBattleResult(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;

        // 1. Redis에서 최종 데이터 조회
        Integer hostVotes = (Integer) redisTemplate.opsForHash().get(sessionKey, "hostVoteCount");
        Integer guestVotes = (Integer) redisTemplate.opsForHash().get(sessionKey, "guestVoteCount");

        if (hostVotes == null)
            hostVotes = 0;
        if (guestVotes == null)
            guestVotes = 0;
        Long hostId = Long.valueOf((String) redisTemplate.opsForHash().get(sessionKey, "hostId"));
        Long guestId = Long.valueOf((String) redisTemplate.opsForHash().get(sessionKey, "guestId"));

        String resultMessage;
        Long winnerId = null;
        Long loserId = null;

        // 2. 판정 로직 수정
        if (hostVotes > guestVotes) {
            winnerId = hostId;
            loserId = guestId;
            resultMessage = "호스트 승리!";
        } else if (guestVotes > hostVotes) {
            winnerId = guestId;
            loserId = hostId;
            resultMessage = "게스트 승리!";
        } else {
            // 무승부 케이스: winnerId와 loserId를 null로 유지
            resultMessage = "막상막하! 투표 결과 무승부입니다.";
        }

        // 3. 승패가 갈린 경우에만 DB 업데이트 실행
        if (winnerId != null && loserId != null) {
            updateMemberStats(winnerId, loserId);
        }

        // 4. 최종 결과 웹소켓 전송
        BattleMessage endMsg = BattleMessage.builder()
                .type(BattleMessage.MessageType.END)
                .content(resultMessage)
                .hostVoteCount(hostVotes)
                .guestVoteCount(guestVotes)
                .build();
        messagingTemplate.convertAndSend("/topic/battle/" + sessionId, java.util.Objects.requireNonNull(endMsg));

        // 5. Redis 데이터 삭제 (무승부여도 방은 닫아야 함)
        cleanupRedisData(sessionId);
    }

    private void updateMemberStats(long winnerId, long loserId) {
        //
        Member winner = memberRepository.findById(winnerId).orElseThrow();
        Member loser = memberRepository.findById(loserId).orElseThrow();

        winner.incrementWinCount(); // 승리 횟수 증가
        loser.incrementLossCount(); // 패배 횟수 증가
    }

    private void cleanupRedisData(Long sessionId) {
        // 배틀과 관련된 모든 Redis 키 삭제
        redisTemplate.delete("battle:session:" + sessionId);
        redisTemplate.delete("battle:voters:" + sessionId);
        redisTemplate.delete("battle:chat:" + sessionId);
        redisTemplate.opsForSet().remove("battle:active_list", sessionId.toString());
    }
}