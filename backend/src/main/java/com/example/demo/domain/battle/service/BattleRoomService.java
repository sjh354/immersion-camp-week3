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

        // 2. 남은 시간 계산 (단순화: 이미 클라이언트가 타이머 동기화 중이면 0으로 줘도 됨)
        long remaining = 0L; 
        
        // 3. 안전한 형변환 헬퍼 (Redis Hash 값은 Integer 또는 String일 수 있음)
        
        return BattleRoomResponse.builder()
                .sessionId(sessionId)
                .hostId(getLong(data, "hostId"))
                .guestId(getLong(data, "guestId"))
                .hostNickname(getString(data, "hostNickname"))
                .guestNickname(getString(data, "guestNickname"))
                .hostMent(getString(data, "hostMent"))
                .guestMent(getString(data, "guestMent"))
                
                .hostOutfit1Id(getLong(data, "hostOutfit1Id"))
                .hostPreview1Url(getString(data, "hostPreview1Url"))
                .hostOutfit2Id(getLong(data, "hostOutfit2Id"))
                .hostPreview2Url(getString(data, "hostPreview2Url"))

                .guestOutfit1Id(getLong(data, "guestOutfit1Id"))
                .guestPreview1Url(getString(data, "guestPreview1Url"))
                .guestOutfit2Id(getLong(data, "guestOutfit2Id"))
                .guestPreview2Url(getString(data, "guestPreview2Url"))

                .currentRound(getInt(data, "currentRound", 1))
                .round1WinnerId(getLong(data, "round1WinnerId"))
                
                .hostVoteCountRound1(getInt(data, "hostVoteCountRound1", 0))
                .guestVoteCountRound1(getInt(data, "guestVoteCountRound1", 0))
                .round2VoteSuccessCount(getInt(data, "round2VoteSuccessCount", 0))
                .round2VoteFailCount(getInt(data, "round2VoteFailCount", 0))

                .spectatorCount(getInt(data, "spectatorCount", 0))
                .status(getString(data, "status"))
                .remainingSeconds(remaining)
                .build();
    }

    private Long getLong(Map<Object, Object> data, String key) {
        Object val = data.get(key);
        if (val == null) return null;
        return Long.valueOf(val.toString());
    }

    private String getString(Map<Object, Object> data, String key) {
        Object val = data.get(key);
        return val != null ? val.toString() : null;
    }

    private int getInt(Map<Object, Object> data, String key, int defaultValue) {
        Object val = data.get(key);
        if (val == null) return defaultValue;
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }
}
