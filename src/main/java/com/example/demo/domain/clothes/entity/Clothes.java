package com.example.demo.domain.clothes.entity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import com.example.demo.global.common.BaseTimeEntity;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Clothes extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Enumerated(EnumType.STRING)
    private Category category;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String styleTags; // AI 분석용 태그

    private String brand;
    private String sourceUrl;
}