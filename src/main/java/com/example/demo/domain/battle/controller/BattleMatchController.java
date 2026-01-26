package com.example.demo.domain.battle.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.domain.battle.service.BattleMatchService;
import com.example.demo.domain.battle.dto.MatchRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/battle/match")
@RequiredArgsConstructor
public class BattleMatchController {

    private final BattleMatchService battleMatchService;
    private final com.example.demo.domain.member.repository.MemberRepository memberRepository;

    @PostMapping("/start")
    public ResponseEntity<String> startMatch(
            @AuthenticationPrincipal String email, // 시큐리티에서 유저 정보 추출
            @RequestBody MatchRequest request) {

        com.example.demo.domain.member.entity.Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일을 가진 회원이 존재하지 않습니다: " + email));

        battleMatchService.startMatching(member.getId(), request.getOutfitAId());
        return ResponseEntity.ok("매칭 대기 시작");
    }
}