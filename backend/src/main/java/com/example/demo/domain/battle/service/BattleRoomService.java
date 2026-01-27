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
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate; // Not strictly needed if logic moves to TimerService, but kept for consistency if needed.
    private final BattleTimerService battleTimerService; // New injection

    // 상수 정의
    private static final int REQUIRED_SPECTATORS_FOR_START = 2;

    public BattleRoomResponse getBattleRoomSnapshot(Long sessionId) {
        String key = "battle:session:" + sessionId;
        // 1. Redis에서 세션 데이터 맵(Map) 전체 가져오기
        Map<Object, Object> data = redisTemplate.opsForHash().entries(key);

        if (data.isEmpty()) {
            throw new RuntimeException("존재하지 않는 배틀 방입니다.");
        }

        // 2. 남은 시간 계산
        long remaining = 0L;
        String status = getString(data, "status");
        if ("VOTING_ROUND_1".equals(status) || "VOTING_ROUND_2".equals(status)) {
            String endTimeStr = getString(data, "roundEndTime");
            if (endTimeStr != null) {
                long endTime = Long.parseLong(endTimeStr);
                long now = System.currentTimeMillis();
                remaining = Math.max(0, (endTime - now) / 1000);
            }
        }
        
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
                .status(status)
                .remainingSeconds(remaining)
                .build();
    }

    public void enterSpectator(Long sessionId, com.example.demo.domain.member.entity.Member member) {
        String key = "battle:session:" + sessionId;

        // 1. 방 존재 확인
        if (Boolean.FALSE.equals(redisTemplate.hasKey(key))) {
            throw new RuntimeException("존재하지 않는 배틀 방입니다.");
        }

        // 2. 호스트/게스트 여부 확인 (관전자만 카운트)
        Long hostId = getLong(redisTemplate.opsForHash().entries(key), "hostId");
        Long guestId = getLong(redisTemplate.opsForHash().entries(key), "guestId");

        if (member.getId().equals(hostId) || member.getId().equals(guestId)) {
            // 호스트나 게스트는 관전자로 등록하지 않음
            return;
        }

        // 3. 관전자 목록(Set)에 추가 (중복 방지)
        String spectatorsKey = "battle:session:" + sessionId + ":spectators";
        redisTemplate.opsForSet().add(spectatorsKey, member.getId());

        // 4. 관전자 수 업데이트
        Long count = redisTemplate.opsForSet().size(spectatorsKey);
        redisTemplate.opsForHash().put(key, "spectatorCount", count.intValue());

        // 5. 3명 이상이고, 대기 중이면 타이머 시작
        String status = getString(redisTemplate.opsForHash().entries(key), "status");
        if (count >= REQUIRED_SPECTATORS_FOR_START && "WAITING_SPECTATORS".equals(status)) {
            // 더 이상의 중복 실행을 막기 위해 상태를 즉시 변경 (Optimistic checking)
            // 하지만 Service 내부에서 변경하는게 확실함. 여기서는 호출만.
            battleTimerService.startBattleTimer(sessionId);
        }
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
