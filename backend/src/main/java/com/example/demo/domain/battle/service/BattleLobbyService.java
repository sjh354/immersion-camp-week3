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
        System.out.println("Lobby: Fetching active sessions from battle:active_list");
        // 1. 활성화된 세션 ID 목록 가져오기
        Set<Object> activeSessionIds = redisTemplate.opsForSet().members("battle:active_list");
        if (activeSessionIds == null || activeSessionIds.isEmpty()) {
            System.out.println("Lobby: No active sessions found.");
            return Collections.emptyList();
        }
        System.out.println("Lobby: Found " + activeSessionIds.size() + " active session IDs: " + activeSessionIds);

        return activeSessionIds.stream()
                .map(id -> {
                    String key = "battle:session:" + id;
                    // Redis Hash에서 데이터 추출
                    Map<Object, Object> data = redisTemplate.opsForHash().entries(key);
                    System.out.println("Lobby: Data for session " + id + ": " + data);

                    // 데이터가 불완전하면 null 반환 후 필터링 가능 (여기서는 그대로 진행)
                    if (data.isEmpty()) {
                         System.out.println("Lobby: Data is empty for session " + id);
                         return null;
                    }

                    String status = (String) data.get("status");
                    if (status == null || "FINISHED".equals(status)) {
                        return null;
                    }

                    return BattleLobbyResponse.builder()
                            .sessionId(Long.valueOf(id.toString()))
                            .hostNickname((String) data.get("hostNickname"))
                            .guestNickname((String) data.get("guestNickname"))
                            .hostPreviewUrl((String) data.get("hostPreview1Url")) // Corrected key
                            .guestPreviewUrl((String) data.get("guestPreview1Url")) // Corrected key
                            .hostVoteCount(getInt(data.get("hostVoteCountRound1"))) // Corrected key
                            .guestVoteCount(getInt(data.get("guestVoteCountRound1"))) // Corrected key
                            .status(status)
                            .remainingSeconds(calculateRemainingTime(data))
                            .build();
                })
                .filter(java.util.Objects::nonNull) // null 제외
                .sorted((a, b) -> Long.compare(b.getSessionId(), a.getSessionId()))
                .collect(Collectors.toList());
    }

    private Integer getInt(Object val) {
        if (val == null) return 0;
        try {
            return Integer.parseInt(val.toString());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private Long calculateRemainingTime(Map<Object, Object> data) {
        if (!"VOTING".equals(data.get("status")))
            return 90L; // 시작 전이면 90초 표시
        // 타이머 로직과 연동하여 남은 시간 계산 (실제로는 TimerService에서 브로드캐스팅하는 값을 주로 사용)
        return 0L;
    }
}
