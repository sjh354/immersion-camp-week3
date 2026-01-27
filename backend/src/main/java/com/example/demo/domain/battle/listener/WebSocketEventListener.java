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

            // 2. 채팅 히스토리 전송 (새로 들어온 사람에게만)
            List<Object> history = chatService.getChatHistory(sessionId);
            if (history != null) {
                messagingTemplate.convertAndSend("/topic/battle/" + sessionId + "/history", history);
            }

            // NOTE: 관전자 수 카운트 및 타이머 시작은 BattleRoomService.enterSpectator()에서 perform 합니다.
            // 여기서는 웹소켓 연결만 처리하고, 중복 카운팅을 방지하기 위해 로직을 제거합니다.
        }
    }
}