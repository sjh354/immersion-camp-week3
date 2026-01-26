package com.example.demo.domain.battle.listener;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import java.util.List;
import com.example.demo.domain.battle.service.BattleChatService;
import com.example.demo.domain.battle.service.BattleTimerService;

@Component
@RequiredArgsConstructor
public class WebSocketEventListener {
    private final RedisTemplate<String, Object> redisTemplate;
    private final BattleTimerService timerService;
    private final BattleChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleSubscription(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = headerAccessor.getDestination(); // 예: /topic/battle/123

        if (destination != null && destination.startsWith("/topic/battle/")) {
            Long sessionId = Long.parseLong(destination.replace("/topic/battle/", ""));
            String sessionKey = "battle:session:" + sessionId;

            // 1. 관전자 수 증가 및 상태 확인
            Long count = redisTemplate.opsForHash().increment(sessionKey, "spectatorCount", 1);

            // 2. 채팅 히스토리 전송 (새로 들어온 사람에게만)
            List<Object> history = chatService.getChatHistory(sessionId);
            if (history != null) {
                messagingTemplate.convertAndSend("/topic/battle/" + sessionId + "/history", history);
            }

            // 3. 3명이 되는 순간 타이머 시작 (상태가 WAITING_SPECTATORS일 때만)
            if (count >= 3) {
                String status = (String) redisTemplate.opsForHash().get(sessionKey, "status");
                if ("WAITING_SPECTATORS".equals(status)) {
                    timerService.startBattleTimer(sessionId);
                }
            }
        }
    }
}