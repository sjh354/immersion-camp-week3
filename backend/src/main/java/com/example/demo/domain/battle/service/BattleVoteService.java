package com.example.demo.domain.battle.service;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.NonNull;

@Service
@RequiredArgsConstructor
public class BattleVoteService {
    private final RedisTemplate<String, Object> redisTemplate;

    public boolean vote(Long sessionId, Long voterId, String voteContent) {
        String sessionKey = "battle:session:" + sessionId;

        // 1. 현재 라운드 확인
        Object currentRoundObj = redisTemplate.opsForHash().get(sessionKey, "currentRound");
        int currentRound = 1;
        if (currentRoundObj != null) {
            try {
                currentRound = Integer.parseInt(currentRoundObj.toString());
            } catch (NumberFormatException e) {
                // ignore
            }
        }

        // 2. 투표 기록 키 (User별 투표 내역 저장)
        String voteRecordKey = "battle:vote_record:" + sessionId + ":" + currentRound;
        Object oldVoteObj = redisTemplate.opsForHash().get(voteRecordKey, voterId.toString());
        String oldVoteContent = oldVoteObj != null ? oldVoteObj.toString() : null;

        String newVoteField = determineVoteField(sessionKey, voteContent, currentRound);
        if (newVoteField == null) return false; // 유효하지 않은 투표

        if (oldVoteContent == null) {
            // [신규 투표]
            redisTemplate.opsForHash().increment(sessionKey, newVoteField, 1);
            redisTemplate.opsForHash().put(voteRecordKey, voterId.toString(), voteContent);
            return true;
        } else {
            // [투표 변경]
            if (oldVoteContent.equals(voteContent)) {
                return false; // 이미 같은 곳에 투표함
            }

            String oldVoteField = determineVoteField(sessionKey, oldVoteContent, currentRound);
            if (oldVoteField != null) {
                redisTemplate.opsForHash().increment(sessionKey, oldVoteField, -1); // 기존 표 철회
            }
            redisTemplate.opsForHash().increment(sessionKey, newVoteField, 1); // 새 표 행사
            redisTemplate.opsForHash().put(voteRecordKey, voterId.toString(), voteContent);
            return true;
        }
    }

    private String determineVoteField(@NonNull String sessionKey, String voteContent, int currentRound) {
        if (currentRound == 2) {
            // 2라운드: SUCCESS / FAIL
            if ("SUCCESS".equalsIgnoreCase(voteContent)) return "round2VoteSuccessCount";
            if ("FAIL".equalsIgnoreCase(voteContent)) return "round2VoteFailCount";
            return null;
        }

        // 1라운드: Member ID
        try {
            Long votedMemberId = Long.parseLong(voteContent);
            Object hostIdObj = redisTemplate.opsForHash().get(sessionKey, "hostId");
            Object guestIdObj = redisTemplate.opsForHash().get(sessionKey, "guestId");

            if (hostIdObj == null || guestIdObj == null) return null;

            Long hostId = Long.valueOf(hostIdObj.toString());
            Long guestId = Long.valueOf(guestIdObj.toString());

            if (votedMemberId.equals(hostId)) return "hostVoteCountRound1";
            if (votedMemberId.equals(guestId)) return "guestVoteCountRound1";

        } catch (NumberFormatException e) {
            return null;
        }
        return null;
    }
}