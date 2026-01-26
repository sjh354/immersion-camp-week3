package com.example.demo.domain.outfit.entity;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import com.example.demo.global.common.BaseTimeEntity;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.clothes.entity.Clothes;
import java.util.Objects;

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
    @JoinColumn(name = "outer_id")
    private Clothes outer;

    private String name;
    private String previewUrl; // 캔버스 캡처 이미지

    @Builder // 생성 시 top, bottom은 필수, outer는 선택
    public Outfit(Member member, Clothes top, Clothes bottom, Clothes outer, String name, String previewUrl) {
        this.member = member;
        this.top = Objects.requireNonNull(top, "Top must not be null");
        this.bottom = Objects.requireNonNull(bottom, "Bottom must not be null");
        this.outer = outer; // Nullable
        this.name = name;
        this.previewUrl = previewUrl;
    }
}