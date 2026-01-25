package com.example.demo.domain.clothes.service;

import com.example.demo.domain.clothes.dto.ClothesResponse;
import com.example.demo.domain.clothes.entity.Category;
import com.example.demo.domain.clothes.repository.ClothesRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClothesService {

    private final ClothesRepository clothesRepository;

    // 1. 카테고리 목록 조회
    public List<String> getCategories() {
        return Arrays.stream(Category.values())
                .map(Enum::name)
                .collect(Collectors.toList());
    }

    // 2. 의상 목록 조회 (페이징 처리)
    public Page<ClothesResponse> getClothesList(Category category, Pageable pageable) {
        // 1. 카테고리가 없으면 전체 조회 (findAll)
        if (category == null) {
            return clothesRepository.findAll(pageable)
                    .map(ClothesResponse::new);
        }

        // 2. 카테고리가 있으면 기존처럼 필터링 조회
        return clothesRepository.findByCategory(category, pageable)
                .map(ClothesResponse::new);
    }

    // 3. 의상 검색
    public Page<ClothesResponse> searchClothes(String keyword, Category category, Pageable pageable) {
        return clothesRepository.findByNameContainingAndCategory(keyword, category, pageable)
                .map(ClothesResponse::new);
    }
}