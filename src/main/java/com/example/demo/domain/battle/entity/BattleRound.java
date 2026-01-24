package com.example.demo.domain.battle.entity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import com.example.demo.global.common.BaseTimeEntity;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BattleRound extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    private BattleSession session;

    private int roundNum; // 1 or 2

    @Column(columnDefinition = "TEXT")
    private String hostMent;
    @Column(columnDefinition = "TEXT")
    private String guestMent;

    @Column(columnDefinition = "TEXT")
    private String aiJudgement; // JSON 형식 분석 리포트

    private boolean isSuccess; // 2R 성공 여부
}