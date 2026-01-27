package com.example.demo.domain.outfit.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.example.demo.domain.outfit.entity.Outfit;

public interface OutfitRepository extends JpaRepository<Outfit, Long> {
    // 특정 유저가 저장한 모든 코디 목록 조회
    List<Outfit> findByMemberId(Long memberId);
}