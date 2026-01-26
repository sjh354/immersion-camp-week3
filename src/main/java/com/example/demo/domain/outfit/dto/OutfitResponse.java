package com.example.demo.domain.outfit.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class OutfitResponse {
    private Long id;
    private String name;
    private Long topId;
    private Long bottomId;
    private Long outerId;
    private String previewUrl;
    private LocalDateTime createdAt;
}