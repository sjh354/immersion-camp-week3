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
    private final BattleResultService resultService;

    @Async // 별도 스레드에서 실행
    @SuppressWarnings("null")
    public void startBattleTimer(Long sessionId) {
        String sessionKey = "battle:session:" + sessionId;
        redisTemplate.opsForHash().put(sessionKey, "status", "VOTING");

        for (int i = 90; i >= 0; i--) {
            try {
                // 1초마다 남은 시간 브로드캐스팅
                BattleMessage timeMsg = BattleMessage.builder()
                        .type(BattleMessage.MessageType.INFO)
                        .content("배틀 진행 중")
                        .remainingSeconds((long) i)
                        .build();
                messagingTemplate.convertAndSend("/topic/battle/" + sessionId, timeMsg);

                Thread.sleep(1000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        // 시간이 다 되면 결과 정산 호출
        resultService.processBattleResult(sessionId);
    }
}