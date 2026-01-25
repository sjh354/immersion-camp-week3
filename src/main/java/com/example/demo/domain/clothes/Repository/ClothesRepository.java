package com.example.demo.domain.clothes.repository;

import com.example.demo.domain.clothes.entity.Category;
import com.example.demo.domain.clothes.entity.Clothes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClothesRepository extends JpaRepository<Clothes, Long> {

    // 1. 카테고리별 의상 목록 조회 (페이징 지원)
    // 리턴 타입을 List -> Page로 바꾸고, 파라미터에 Pageable을 추가합니다.
    Page<Clothes> findByCategory(Category category, Pageable pageable);

    // 2. 의상 이름 검색 + 카테고리 필터링 (페이징 지원)
    // Containing을 붙이면 SQL의 LIKE %keyword% 효과가 납니다.
    Page<Clothes> findByNameContainingAndCategory(String name, Category category, Pageable pageable);
}