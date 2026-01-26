package com.example.demo.domain.outfit.service;

import com.example.demo.domain.outfit.dto.OutfitRequest;
import com.example.demo.domain.outfit.dto.OutfitResponse;
import com.example.demo.domain.outfit.entity.Outfit;
import com.example.demo.domain.outfit.repository.OutfitRepository;
import com.example.demo.domain.clothes.repository.ClothesRepository;
import com.example.demo.domain.clothes.entity.Clothes;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OutfitService {

    private final OutfitRepository outfitRepository;
    private final ClothesRepository clothesRepository;

    @Transactional
    public Long saveOutfit(OutfitRequest request) {
        Long topId = request.getTopId();
        if (topId == null) {
            throw new IllegalArgumentException("Top ID cannot be null");
        }

        Long bottomId = request.getBottomId();
        if (bottomId == null) {
            throw new IllegalArgumentException("Bottom ID cannot be null");
        }

        Clothes top = clothesRepository.findById(topId)
                .orElseThrow(() -> new IllegalArgumentException("Top not found"));
        Clothes bottom = clothesRepository.findById(bottomId)
                .orElseThrow(() -> new IllegalArgumentException("Bottom not found"));
        Long outerId = request.getOuterId();
        Clothes outer = outerId != null ? clothesRepository.findById(outerId)
                .orElseThrow(() -> new IllegalArgumentException("Outer not found")) : null;

        Outfit outfit = Outfit.builder()
                .name(request.getName())
                .top(top)
                .bottom(bottom)
                .outer(outer)
                .previewUrl(request.getPreviewUrl())
                .build();

        @SuppressWarnings("null")
        Outfit saved = outfitRepository.save(outfit);
        return saved.getId();
    }

    public List<OutfitResponse> getMyOutfits() {
        return outfitRepository.findAll().stream()
                .map(o -> OutfitResponse.builder()
                        .id(o.getId())
                        .name(o.getName())
                        .topId(o.getTop().getId())
                        .bottomId(o.getBottom().getId())
                        .outerId(o.getOuter() != null ? o.getOuter().getId() : null)
                        .previewUrl(o.getPreviewUrl())
                        .createdAt(o.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteOutfit(long id) {
        outfitRepository.deleteById(id);
    }
}