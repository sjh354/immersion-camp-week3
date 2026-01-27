package com.example.demo.domain.battle.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BattleRoomResponse {
    private Long sessionId;

    // 플레이어 정보
    private Long hostId;
    private Long guestId;
    private String hostNickname;
    private String guestNickname;
    private String hostMent;
    private String guestMent;

    // 코디 정보 (Round 1 & 2)
    private Long hostOutfit1Id;
    private String hostPreview1Url;
    private Long hostOutfit2Id;
    private String hostPreview2Url;

    private Long guestOutfit1Id;
    private String guestPreview1Url;
    private Long guestOutfit2Id;
    private String guestPreview2Url;

    // 실시간 상태
    private int currentRound;
    private Long round1WinnerId;

    private int hostVoteCountRound1;
    private int guestVoteCountRound1;
    
    private int round2VoteSuccessCount;
    private int round2VoteFailCount;

    private int spectatorCount;
    private String status;
    private Long remainingSeconds;
}
