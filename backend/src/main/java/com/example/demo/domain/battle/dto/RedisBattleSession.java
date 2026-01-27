package com.example.demo.domain.battle.dto;

import lombok.*;
import java.io.Serializable;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RedisBattleSession implements Serializable {
    private Long sessionId;

    // 플레이어 정보
    private Long hostId;
    private Long guestId;

    // 닉네임은 로비나 배틀 화면에서 바로 보여주기 위해 유지하는 것이 좋습니다.
    private String hostNickname;
    private String guestNickname;

    // 선택한 코디 정보 (미리보기 URL 포함) - Round 1, 2
    private Long hostOutfit1Id;
    private Long hostOutfit2Id;
    private String hostPreview1Url;
    private String hostPreview2Url;

    private Long guestOutfit1Id;
    private Long guestOutfit2Id;
    private String guestPreview1Url;
    private String guestPreview2Url;

    // 실시간 상태 데이터
    // Round 1 투표 (1vs1)
    private int hostVoteCountRound1;
    private int guestVoteCountRound1;

    // Round 2 투표 (승자 Solo 심사: Success vs Fail)
    private int round2VoteSuccessCount;
    private int round2VoteFailCount;

    private Long round1WinnerId; // 1라운드 승자 ID

    private int currentRound; // 1 or 2

    private int spectatorCount; // 관전자 수 (3명 이상 시 타이머 시작)

    private String status; // WAITING_SPECTATORS, VOTING_ROUND_1, TRANSITION, VOTING_ROUND_2, FINISHED
    private Long startTime; // 배틀 시작 타임스탬프
}