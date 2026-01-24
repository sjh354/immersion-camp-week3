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

    @Builder
    public Member(String email, String nickname, AuthProvider provider, String providerId, String picture) {
        this.email = email;
        this.nickname = nickname;
        this.provider = provider;
        this.providerId = providerId;
        this.picture = picture;
    }
}