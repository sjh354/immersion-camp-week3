package com.example.demo.domain.battle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BattleRoomResponse {
    private Long sessionId;

    // 플레이어 정보 및 코디
    private String hostNickname;
    private String guestNickname;
    private String hostPreviewUrl;
    private String guestPreviewUrl;

    // 실시간 상태
    private int hostVoteCount;
    private int guestVoteCount;
    private int spectatorCount;
    private String status;
    private Long remainingSeconds; // 계산된 남은 시간
}