package com.example.demo.domain.outfit.controller;

import com.example.demo.domain.outfit.dto.OutfitRequest;
import com.example.demo.domain.outfit.dto.OutfitResponse;
import com.example.demo.domain.outfit.service.OutfitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/outfits")
@RequiredArgsConstructor
public class OutfitController {

    private final OutfitService outfitService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveOutfit(@RequestBody OutfitRequest request) {
        Long id = outfitService.saveOutfit(request);
        return ResponseEntity.ok(Map.of(
                "id", id,
                "message", "코디가 성공적으로 저장되었습니다."));
    }

    @GetMapping
    public ResponseEntity<List<OutfitResponse>> getMyOutfits() {
        return ResponseEntity.ok(outfitService.getMyOutfits());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteOutfit(@PathVariable Long id) {
        outfitService.deleteOutfit(id);
        return ResponseEntity.ok(Map.of("message", "코디가 성공적으로 삭제되었습니다."));
    }
}