package com.example.demo.domain.member.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import com.example.demo.global.common.BaseTimeEntity;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    private String password; // 소셜 로그인 시 null 허용

    @Column(nullable = false)
    private String nickname;

    @Enumerated(EnumType.STRING)
    private AuthProvider provider;

    private String providerId;
    private String picture;

    private int winCount = 0;
    private int lossCount = 0;

    // Member 클래스 내부에 추가
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    // 배틀 덱 (Round 1, 2) 코디 ID 저장
    private Long mainOutfitId1;
    private Long mainOutfitId2;

    public void updateBattleDeck(Long outfit1, Long outfit2) {
        this.mainOutfitId1 = outfit1;
        this.mainOutfitId2 = outfit2;
    }

    @Builder
    public Member(String email, String nickname, AuthProvider provider, String providerId, String picture) {
        this.email = email;
        this.nickname = nickname;
        this.provider = provider;
        this.providerId = providerId;
        this.picture = picture;
    }

    public void incrementWinCount() {
        this.winCount++;
    }

    public void incrementLossCount() {
        this.lossCount++;
    }
}