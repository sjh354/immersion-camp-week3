package com.example.demo.domain.clothes.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.example.demo.domain.clothes.entity.Clothes;
import com.example.demo.domain.clothes.entity.Category;

public interface ClothesRepository extends JpaRepository<Clothes, Long> {
    // 카테고리별(상의, 하의 등) 의상 목록 조회
    List<Clothes> findByCategory(Category category);
}