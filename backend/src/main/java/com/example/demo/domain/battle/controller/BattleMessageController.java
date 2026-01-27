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
    private final com.example.demo.domain.member.repository.MemberRepository memberRepository;

    // 1. 실시간 채팅 처리
    @MessageMapping("/battle/{sessionId}/chat")
    public void sendMessage(@DestinationVariable Long sessionId, BattleMessage message, java.security.Principal principal) {
        if (principal != null) {
            String email = principal.getName();
            memberRepository.findByEmail(email).ifPresent(member -> {
                message.setSenderId(member.getId());
                message.setSenderNickname(member.getNickname());
            });
        }
        
        message.setType(BattleMessage.MessageType.CHAT);

        // Redis에 채팅 내역 저장 (나중에 들어온 사람을 위해)
        chatService.saveMessage(sessionId, message);

        // 해당 방의 모든 유저에게 메시지 전송
        messagingTemplate.convertAndSend("/topic/battle/" + sessionId, message);
    }

    // 2. 실시간 투표 처리
    @MessageMapping("/battle/{sessionId}/vote")
    @SuppressWarnings("null")
    public void processVote(@DestinationVariable Long sessionId, BattleMessage message, java.security.Principal principal) {
        System.out.println("Processing vote for session: " + sessionId + ", content: " + message.getContent());
        
        // Principal을 통해 투표자 ID 식별 (보안 강화)
        Long voterId = message.getSenderId(); // Fallback (or throw error if null)
        
        if (principal != null) {
            String email = principal.getName();
            System.out.println("Vote principal found: [" + email + "]");
            com.example.demo.domain.member.entity.Member member = memberRepository.findByEmail(email).orElse(null);
            if (member != null) {
                voterId = member.getId();
                System.out.println("Voter identified as ID: " + voterId + " (Email: " + email + ")");
            } else {
                System.out.println("Vote Error: Details - Principal=" + email + ", but findByEmail returned Empty.");
            }
        } else {
            System.out.println("Vote principal is NULL");
        }
        
        if (voterId == null) {
            System.out.println("Voter ID is null. Ignoring vote.");
            return; // 인증되지 않은 사용자의 투표 무시
        }

        // 투표 실행 및 성공 여부 확인 (Content를 String으로 전달)
        boolean success = voteService.vote(sessionId, voterId, message.getContent());
        System.out.println("Vote result success: " + success);

        if (success) {
            String sessionKey = "battle:session:" + sessionId;
            Integer currentRoundObj = (Integer) redisTemplate.opsForHash().get(sessionKey, "currentRound");
            int currentRound = currentRoundObj != null ? currentRoundObj : 1;

            Integer hostVotes1Obj = (Integer) redisTemplate.opsForHash().get(sessionKey, "hostVoteCountRound1");
            int hostVotes1 = hostVotes1Obj != null ? hostVotes1Obj : 0;
            Integer guestVotes1Obj = (Integer) redisTemplate.opsForHash().get(sessionKey, "guestVoteCountRound1");
            int guestVotes1 = guestVotes1Obj != null ? guestVotes1Obj : 0;

            Integer r2SuccessObj = (Integer) redisTemplate.opsForHash().get(sessionKey, "round2VoteSuccessCount");
            int r2Success = r2SuccessObj != null ? r2SuccessObj : 0;
            Integer r2FailObj = (Integer) redisTemplate.opsForHash().get(sessionKey, "round2VoteFailCount");
            int r2Fail = r2FailObj != null ? r2FailObj : 0;

            Object r1WinnerIdObj = redisTemplate.opsForHash().get(sessionKey, "round1WinnerId");
            Long r1WinnerId = r1WinnerIdObj != null ? Long.valueOf(r1WinnerIdObj.toString()) : null;

            // 업데이트된 점수를 포함하여 브로드캐스팅
            BattleMessage voteUpdate = BattleMessage.builder()
                    .type(BattleMessage.MessageType.VOTE)
                    .sessionId(sessionId)
                    .currentRound(currentRound)
                    .hostVoteCountRound1(hostVotes1)
                    .guestVoteCountRound1(guestVotes1)
                    .round2VoteSuccessCount(r2Success)
                    .round2VoteFailCount(r2Fail)
                    .round1WinnerId(r1WinnerId)
                    .build();

            messagingTemplate.convertAndSend("/topic/battle/" + sessionId, voteUpdate);
            // 로비(전체 목록) 화면에도 점수 업데이트 전송
            messagingTemplate.convertAndSend("/topic/battle/lobby", voteUpdate);
        }
    }
}