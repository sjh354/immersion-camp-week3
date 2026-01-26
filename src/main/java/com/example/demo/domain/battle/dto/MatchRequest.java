package com.example.demo.domain.battle.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MatchRequest {
    private Long outfitAId; // 배틀용 코디
    private Long outfitBId; // 애프터용 코디 (현재 로직에선 보관용)
}