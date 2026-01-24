package com.example.demo.domain.battle.entity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import com.example.demo.global.common.BaseTimeEntity;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.outfit.entity.Outfit;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BattleSession extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member host;

    @ManyToOne(fetch = FetchType.LAZY)
    private Member guest;

    // 각자가 지참한 코디 2개씩
    @ManyToOne(fetch = FetchType.LAZY)
    private Outfit hostOutfitA;
    @ManyToOne(fetch = FetchType.LAZY)
    private Outfit hostOutfitB;

    @ManyToOne(fetch = FetchType.LAZY)
    private Outfit guestOutfitA;
    @ManyToOne(fetch = FetchType.LAZY)
    private Outfit guestOutfitB;

    @Enumerated(EnumType.STRING)
    private BattleStatus status;

    private int currentRound = 1;
    private Long winnerId; // 1R 승리자
}