package com.example.demo.domain.clothes.controller;

import com.example.demo.domain.clothes.dto.ClothesResponse;
import com.example.demo.domain.clothes.entity.Category;
import com.example.demo.domain.clothes.service.ClothesService;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.io.IOException;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/v1/clothes")
@RequiredArgsConstructor
public class ClothesController {

    private final ClothesService clothesService;

    // 의상 등록 API (추가됨)
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ClothesResponse> addClothes(
            @RequestPart("image") MultipartFile image,
            @RequestParam("name") String name,
            @RequestParam("category") Category category) throws IOException {

        return ResponseEntity.ok(clothesService.saveClothes(image, name, category));
    }

    @GetMapping("/categories")
    public ResponseEntity<Map<String, List<String>>> getCategories() {
        return ResponseEntity.ok(Map.of("categories", clothesService.getCategories()));
    }

    @GetMapping
    public ResponseEntity<Page<ClothesResponse>> getClothes(
            @RequestParam(required = false) Category category, // 필수 파라미터가 아니게 설정
            @org.springframework.lang.NonNull Pageable pageable) {
        return ResponseEntity.ok(clothesService.getClothesList(category, pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ClothesResponse>> searchClothes(
            @RequestParam String keyword,
            @RequestParam(required = false) Category category,
            @org.springframework.lang.NonNull Pageable pageable) {
        return ResponseEntity.ok(clothesService.searchClothes(keyword, category, pageable));
    }
}