package com.example.demo.domain.battle.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BattleMessage {

    public enum MessageType {
        CHAT, // 실시간 채팅
        VOTE, // 투표 업데이트 알림
        START, // 배틀 시작 (타이머 작동)
        END, // 배틀 종료 (결과 발표)
        INFO // 입장/퇴장 등 시스템 메시지
    }

    private MessageType type;
    private Long sessionId;
    private Long senderId;
    private String senderNickname;
    private String content; // 채팅 내용 또는 시스템 메시지

    // 실시간 점수 정보 (VOTE 타입일 때 사용)
    private int hostVoteCount;
    private int guestVoteCount;

    // 남은 시간 (타이머 동기화용)
    private Long remainingSeconds;
}