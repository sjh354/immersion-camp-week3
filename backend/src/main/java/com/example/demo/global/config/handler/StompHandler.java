package com.example.demo.global.config.handler;

import com.example.demo.global.util.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class StompHandler implements ChannelInterceptor {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String jwt = accessor.getFirstNativeHeader("Authorization");
            if (jwt != null && jwt.startsWith("Bearer ")) {
                jwt = jwt.substring(7); // Remove "Bearer " prefix
                if (jwtTokenProvider.validateToken(jwt)) {
                    Authentication authentication = jwtTokenProvider.getAuthentication(jwt);
                    accessor.setUser(authentication);
                    log.info("WebSocket Authenticated User: {}", authentication.getName());
                } else {
                    log.error("Invalid JWT Token in WebSocket Connection");
                    throw new IllegalArgumentException("Invalid JWT Token");
                }
            } else {
                 log.warn("No Authorization header found in WebSocket Connection");
                 throw new IllegalArgumentException("No Authorization header");
            }
        }
        return message;
    }
}
