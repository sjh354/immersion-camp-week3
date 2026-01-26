package com.example.demo.domain.battle.controller;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import lombok.RequiredArgsConstructor;
import com.example.demo.domain.battle.service.BattleChatService;
import com.example.demo.domain.battle.service.BattleVoteService;
import com.example.demo.domain.battle.dto.BattleMessage;

@Controller
@RequiredArgsConstructor
public class BattleMessageController {

    private final SimpMessagingTemplate messagingTemplate;
    private final BattleChatService chatService;
    private final BattleVoteService voteService;
    private final RedisTemplate<String, Object> redisTemplate;

    // 1. 실시간 채팅 처리
    @MessageMapping("/battle/{sessionId}/chat")
    public void sendMessage(@DestinationVariable Long sessionId, BattleMessage message) {
        message.setType(BattleMessage.MessageType.CHAT);

        // Redis에 채팅 내역 저장 (나중에 들어온 사람을 위해)
        chatService.saveMessage(sessionId, message);

        // 해당 방의 모든 유저에게 메시지 전송
        messagingTemplate.convertAndSend("/topic/battle/" + sessionId, message);
    }

    // 2. 실시간 투표 처리
    @MessageMapping("/battle/{sessionId}/vote")
    @SuppressWarnings("null")
    public void processVote(@DestinationVariable Long sessionId, BattleMessage message) {
        // 투표 실행 및 성공 여부 확인
        boolean success = voteService.vote(sessionId, message.getSenderId(), Long.parseLong(message.getContent()));

        if (success) {
            String sessionKey = "battle:session:" + sessionId;
            Integer hostVotesObj = (Integer) redisTemplate.opsForHash().get(sessionKey, "hostVoteCount");
            int hostVotes = hostVotesObj != null ? hostVotesObj : 0;
            Integer guestVotesObj = (Integer) redisTemplate.opsForHash().get(sessionKey, "guestVoteCount");
            int guestVotes = guestVotesObj != null ? guestVotesObj : 0;

            // 업데이트된 점수를 포함하여 브로드캐스팅
            BattleMessage voteUpdate = BattleMessage.builder()
                    .type(BattleMessage.MessageType.VOTE)
                    .sessionId(sessionId)
                    .hostVoteCount(hostVotes)
                    .guestVoteCount(guestVotes)
                    .build();

            messagingTemplate.convertAndSend("/topic/battle/" + sessionId, voteUpdate);
            // 로비(전체 목록) 화면에도 점수 업데이트 전송
            messagingTemplate.convertAndSend("/topic/battle/lobby", voteUpdate);
        }
    }
}