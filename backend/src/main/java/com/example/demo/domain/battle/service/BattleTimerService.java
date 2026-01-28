package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import com.example.demo.domain.battle.dto.BattleMessage;
@Service
public class BattleTimerService {
    private static final int ROUND_DURATION_SECONDS = 60;

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;
    private final BattleGameService gameService;

    public BattleTimerService(RedisTemplate<String, Object> redisTemplate,
                              SimpMessagingTemplate messagingTemplate,
                              @org.springframework.context.annotation.Lazy BattleGameService gameService) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
        this.gameService = gameService;
    }

    @Async
    @SuppressWarnings("null")
    public void startBattleTimer(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;
        
        // Timer Start Broadcast
        BattleMessage startMsg = BattleMessage.builder()
                .type(BattleMessage.MessageType.START)
                .sessionId(sessionId)
                .content("배틀이 시작되었습니다!")
                .remainingSeconds((long) ROUND_DURATION_SECONDS)
                .build();
        messagingTemplate.convertAndSend("/topic/battle/" + sessionId, startMsg);

        // Round 1
        redisTemplate.opsForHash().put(sessionKey, "status", "VOTING_ROUND_1");
        setRoundEndTime(sessionKey, ROUND_DURATION_SECONDS);
        runTimer(sessionId, ROUND_DURATION_SECONDS); 

        // Round 2 전환
        gameService.transitionToRound2(sessionId);
        redisTemplate.opsForHash().put(sessionKey, "status", "WAITING_MENT");
    }

    @Async
    @SuppressWarnings("null")
    public void startRound2Timer(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;
        redisTemplate.opsForHash().put(sessionKey, "status", "VOTING_ROUND_2");
        setRoundEndTime(sessionKey, ROUND_DURATION_SECONDS);
        runTimer(sessionId, ROUND_DURATION_SECONDS);
        gameService.endGame(sessionId);
    }

    private void setRoundEndTime(String sessionKey, int durationSeconds) {
        long endTime = System.currentTimeMillis() + (durationSeconds * 1000L);
        redisTemplate.opsForHash().put(sessionKey, "roundEndTime", String.valueOf(endTime));
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
