package com.example.demo.domain.outfit.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import com.example.demo.global.common.BaseTimeEntity;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.clothes.entity.Clothes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Outfit extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "top_id")
    private Clothes top;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bottom_id")
    private Clothes bottom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shoes_id")
    private Clothes shoes;

    private String name;
    private String previewUrl; // 캔버스 캡처 이미지

    @Builder // 생성 시 shoes가 없으면 생략 가능
    public Outfit(Member member, Clothes top, Clothes bottom, Clothes shoes, String name, String previewUrl) {
        this.member = member;
        this.top = top;
        this.bottom = bottom;
        this.shoes = shoes;
        this.name = name;
        this.previewUrl = previewUrl;
    }
}