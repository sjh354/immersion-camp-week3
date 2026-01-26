package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.List;
import java.time.Duration;
import java.util.Objects;
import com.example.demo.domain.battle.dto.BattleMessage;

@Service
@RequiredArgsConstructor
public class BattleChatService {
    private final RedisTemplate<String, Object> redisTemplate;
    private static final String CHAT_KEY_PREFIX = "battle:chat:";

    // 메시지 저장 (최근 50개 유지)
    public void saveMessage(Long sessionId, BattleMessage message) {
        String key = CHAT_KEY_PREFIX + sessionId;
        redisTemplate.opsForList().rightPush(key, Objects.requireNonNull(message));
        redisTemplate.opsForList().trim(key, -50, -1); // 최신 50개만 남김
        redisTemplate.expire(key, Objects.requireNonNull(Duration.ofMinutes(10))); // 10분 후 자동 삭제
    }

    // 이전 메시지 불러오기
    public List<Object> getChatHistory(Long sessionId) {
        return redisTemplate.opsForList().range(CHAT_KEY_PREFIX + sessionId, 0, -1);
    }
}