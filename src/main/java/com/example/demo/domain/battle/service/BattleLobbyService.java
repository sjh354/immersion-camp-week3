package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.example.demo.domain.battle.dto.BattleLobbyResponse;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BattleLobbyService {

    private final RedisTemplate<String, Object> redisTemplate;

    public List<BattleLobbyResponse> getAllActiveBattles() {
        // 1. 활성화된 세션 ID 목록 가져오기
        Set<Object> activeSessionIds = redisTemplate.opsForSet().members("battle:active_list");
        if (activeSessionIds == null)
            return Collections.emptyList();

        return activeSessionIds.stream()
                .map(id -> {
                    String key = "battle:session:" + id;
                    // Redis Hash에서 데이터 추출
                    Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

                    return BattleLobbyResponse.builder()
                            .sessionId(Long.valueOf(id.toString()))
                            .hostNickname((String) data.get("hostNickname"))
                            .guestNickname((String) data.get("guestNickname"))
                            .hostPreviewUrl((String) data.get("hostPreviewUrl"))
                            .guestPreviewUrl((String) data.get("guestPreviewUrl"))
                            .hostVoteCount((Integer) data.get("hostVoteCount"))
                            .guestVoteCount((Integer) data.get("guestVoteCount"))
                            .status((String) data.get("status"))
                            .remainingSeconds(calculateRemainingTime(data))
                            .build();
                })
                .collect(Collectors.toList());
    }

    private Long calculateRemainingTime(Map<Object, Object> data) {
        if (!"VOTING".equals(data.get("status")))
            return 90L; // 시작 전이면 90초 표시
        // 타이머 로직과 연동하여 남은 시간 계산 (실제로는 TimerService에서 브로드캐스팅하는 값을 주로 사용)
        return 0L;
    }
}