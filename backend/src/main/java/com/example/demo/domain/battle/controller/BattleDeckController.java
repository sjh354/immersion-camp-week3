package com.example.demo.domain.battle.controller;

import com.example.demo.domain.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/battle/deck")
@RequiredArgsConstructor
public class BattleDeckController {

    private final MemberService memberService;

    // 배틀 덱 조회
    @GetMapping
    public ResponseEntity<Map<String, Long>> getBattleDeck(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(memberService.getBattleDeck(email));
    }

    // 배틀 덱 설정 (1, 2라운드 코디 선택)
    @PutMapping
    public ResponseEntity<String> updateBattleDeck(
            @AuthenticationPrincipal String email,
            @RequestBody Map<String, Long> request) {
        
        Long outfit1Id = request.get("outfit1Id");
        Long outfit2Id = request.get("outfit2Id");

        memberService.updateBattleDeck(email, outfit1Id, outfit2Id);
        return ResponseEntity.ok("배틀 덱이 설정되었습니다.");
    }
}
