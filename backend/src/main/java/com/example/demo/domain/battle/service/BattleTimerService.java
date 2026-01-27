package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.demo.domain.battle.dto.BattleMessage;

@Service
@RequiredArgsConstructor
public class BattleTimerService {
    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final BattleGameService gameService;

    @Async
    @SuppressWarnings("null")
    public void startBattleTimer(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;
        
        // Round 1
        redisTemplate.opsForHash().put(sessionKey, "status", "VOTING_ROUND_1");
        runTimer(sessionId, 60); // 60초 (예시)

        // Round 2 전환
        gameService.transitionToRound2(sessionId);
        redisTemplate.opsForHash().put(sessionKey, "status", "VOTING_ROUND_2");
        runTimer(sessionId, 60); // 60초

        // 종료
        gameService.endGame(sessionId);
    }

    private void runTimer(Long sessionId, int seconds) {
        for (int i = seconds; i >= 0; i--) {
            try {
                BattleMessage timeMsg = BattleMessage.builder()
                        .type(BattleMessage.MessageType.INFO)
                        .content("TIME_UPDATE")
                        .remainingSeconds((long) i)
                        .build();
                messagingTemplate.convertAndSend("/topic/battle/" + sessionId, timeMsg);
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }
}