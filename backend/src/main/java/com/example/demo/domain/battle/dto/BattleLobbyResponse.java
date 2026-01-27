package com.example.demo.domain.battle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BattleLobbyResponse {
    private Long sessionId;
    private String hostNickname;
    private String guestNickname;
    private String hostPreviewUrl;
    private String guestPreviewUrl;
    private int hostVoteCount;
    private int guestVoteCount;
    private String status; // WAITING_SPECTATORS, VOTING
    private Long remainingSeconds; // 90초부터 줄어드는 시간
}