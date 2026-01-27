package com.example.demo.domain.clothes.service;

import com.example.demo.global.util.S3UploadService;
import com.example.demo.domain.clothes.dto.ClothesResponse;
import com.example.demo.domain.clothes.entity.Category;
import com.example.demo.domain.clothes.entity.Clothes;
import com.example.demo.domain.clothes.repository.ClothesRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.io.IOException;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClothesService {

    private final ClothesRepository clothesRepository;
    private final S3UploadService s3UploadService;

    // 1. 카테고리 목록 조회
    public List<String> getCategories() {
        return Arrays.stream(Category.values())
                .map(Enum::name)
                .collect(Collectors.toList());
    }

    // 2. 의상 목록 조회 (페이징 처리)
    public Page<ClothesResponse> getClothesList(Category category,
            @org.springframework.lang.NonNull Pageable pageable) {
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
    public Page<ClothesResponse> searchClothes(String keyword, Category category,
            @org.springframework.lang.NonNull Pageable pageable) {
        // 카테고리가 없으면 전체 카테고리에서 검색
        if (category == null) {
            return clothesRepository.findByNameContaining(keyword, pageable)
                    .map(ClothesResponse::new);
        }
        // 카테고리가 있으면 해당 카테고리 내에서 검색
        return clothesRepository.findByNameContainingAndCategory(keyword, category, pageable)
                .map(ClothesResponse::new);
    }

    // 추가: 의상 등록 (S3 업로드 포함)
    @Transactional // 읽기 전용이 아니므로 별도로 붙여줍니다.
    public ClothesResponse saveClothes(MultipartFile image, String name, Category category) throws IOException {
        // 1. S3에 이미지 업로드 및 URL 획득 (카테고리별 폴더 저장)
        String imageUrl = s3UploadService.upload(image, category.name().toLowerCase());

        // 2. 엔티티 생성 및 저장
        Clothes clothes = Clothes.builder()
                .name(name)
                .category(category)
                .imageUrl(imageUrl)
                .build();

        @SuppressWarnings("null")
        Clothes saved = clothesRepository.save(clothes);

        // 3. 응답 DTO 반환
        return new ClothesResponse(saved);
    }
}
