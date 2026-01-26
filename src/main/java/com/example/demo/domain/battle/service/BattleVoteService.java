package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.NonNull;

@Service
@RequiredArgsConstructor
public class BattleVoteService {
    private final RedisTemplate<String, Object> redisTemplate;

    public boolean vote(Long sessionId, Long voterId, Long votedMemberId) {
        String voterSetKey = "battle:voters:" + sessionId;
        String sessionKey = "battle:session:" + sessionId;

        // 1. 해당 세션에서 이 유저가 이미 투표했는지 확인 (Set 활용)
        Long addedCount = redisTemplate.opsForSet().add(voterSetKey, voterId.toString());

        if (addedCount != null && addedCount > 0) {
            // 2. 처음 투표라면 Redis Hash에서 해당 플레이어의 점수 증가
            // RedisBattleSession 필드명에 맞춰 hostVoteCount 혹은 guestVoteCount 업데이트
            String voteField = determineVoteField(sessionKey, votedMemberId);
            if (voteField != null) {
                redisTemplate.opsForHash().increment(sessionKey, voteField, 1);
                return true;
            }
        }
        return false; // 이미 투표했거나 잘못된 요청
    }

    private String determineVoteField(@NonNull String sessionKey, Long votedMemberId) {
        // Redis에서 hostId와 guestId를 가져와 투표 대상이 누구인지 확인
        Object hostIdObj = redisTemplate.opsForHash().get(sessionKey, "hostId");
        Object guestIdObj = redisTemplate.opsForHash().get(sessionKey, "guestId");

        if (hostIdObj == null || guestIdObj == null) {
            return null;
        }

        Long hostId = Long.valueOf(hostIdObj.toString());
        Long guestId = Long.valueOf(guestIdObj.toString());

        if (votedMemberId.equals(hostId))
            return "hostVoteCount";
        if (votedMemberId.equals(guestId))
            return "guestVoteCount";
        return null;
    }
}