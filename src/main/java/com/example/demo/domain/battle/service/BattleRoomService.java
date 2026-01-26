package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import java.util.Map;
import com.example.demo.domain.battle.dto.BattleRoomResponse;

@Service
@RequiredArgsConstructor
public class BattleRoomService {

    private final RedisTemplate<String, Object> redisTemplate;

    public BattleRoomResponse getBattleRoomSnapshot(Long sessionId) {
        String key = "battle:session:" + sessionId;
        // 1. Redis에서 세션 데이터 맵(Map) 전체 가져오기
        Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

        if (data.isEmpty()) {
            throw new RuntimeException("존재하지 않는 배틀 방입니다.");
        }

        // 2. 남은 시간 계산 로직
        long remaining = 90L; // 기본값
        if ("VOTING".equals(data.get("status"))) {
            long startTime = Long.parseLong(data.get("startTime").toString());
            long currentTime = System.currentTimeMillis() / 1000;
            // 공식: $remaining = 90 - (currentTime - startTime)$
            remaining = Math.max(0, 90 - (currentTime - startTime));
        }

        return BattleRoomResponse.builder()
                .sessionId(sessionId)
                .hostNickname((String) data.get("hostNickname"))
                .guestNickname((String) data.get("guestNickname"))
                .hostPreviewUrl((String) data.get("hostPreviewUrl"))
                .guestPreviewUrl((String) data.get("guestPreviewUrl"))
                .hostVoteCount((Integer) data.get("hostVoteCount"))
                .guestVoteCount((Integer) data.get("guestVoteCount"))
                .spectatorCount((Integer) data.get("spectatorCount"))
                .status((String) data.get("status"))
                .remainingSeconds(remaining)
                .build();
    }
}
