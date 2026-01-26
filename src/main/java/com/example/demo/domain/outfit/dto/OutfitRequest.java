package com.example.demo.domain.outfit.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class OutfitRequest {
    private String name;
    private Long topId;
    private Long bottomId;
    private Long outerId;
    private String previewUrl;
}