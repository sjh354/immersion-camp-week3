package com.example.demo.domain.clothes.dto;

import com.example.demo.domain.clothes.entity.Clothes;
import com.example.demo.domain.clothes.entity.Category;
import lombok.Getter;

@Getter
public class ClothesResponse {
    private Long id;
    private String name;
    private Category category;
    private String imageUrl;
    private String brand;
    private String styleTags;
    private String sourceUrl;

    public ClothesResponse(Clothes clothes) {
        this.id = clothes.getId();
        this.name = clothes.getName();
        this.category = clothes.getCategory();
        this.imageUrl = clothes.getImageUrl();
        this.brand = clothes.getBrand();
        this.styleTags = clothes.getStyleTags();
        this.sourceUrl = clothes.getSourceUrl();
    }
}