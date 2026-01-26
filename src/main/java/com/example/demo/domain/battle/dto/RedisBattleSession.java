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

    // 선택한 코디 정보 (미리보기 URL 포함)
    private Long hostOutfitId;
    private Long guestOutfitId;
    private String hostPreviewUrl;
    private String guestPreviewUrl;

    // 실시간 상태 데이터
    private int hostVoteCount;
    private int guestVoteCount;
    private int spectatorCount; // 관전자 수 (3명 이상 시 타이머 시작)

    private String status; // WAITING_SPECTATORS, VOTING, FINISHED
    private Long startTime; // 배틀 시작 타임스탬프
}