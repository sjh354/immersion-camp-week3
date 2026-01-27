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
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/battle/match")
@RequiredArgsConstructor
@Slf4j
public class BattleMatchController {

    private final BattleMatchService battleMatchService;
    private final com.example.demo.domain.member.repository.MemberRepository memberRepository;

    @PostMapping("/start")
    public ResponseEntity<String> startMatch(
            @AuthenticationPrincipal String email) { // RequestBody 제거

        log.info("battle.match.start email={}", email);
        com.example.demo.domain.member.entity.Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 이메일을 가진 회원이 존재하지 않습니다: " + email));

        // 덱을 사용하므로 request에서 코디 ID를 받지 않음
        battleMatchService.startMatching(member.getId());
        return ResponseEntity.ok("매칭 대기 시작");
    }

    // 2. 매칭 취소
    @PostMapping("/cancel")
    public ResponseEntity<String> cancelMatch(@AuthenticationPrincipal String email) {
        log.info("battle.match.cancel email={}", email);
        com.example.demo.domain.member.entity.Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        battleMatchService.cancelMatching(member.getId());
        return ResponseEntity.ok("매칭 대기 취소");
    }

    // 3. 매칭 상태 확인
    @org.springframework.web.bind.annotation.GetMapping("/status")
    public ResponseEntity<java.util.Map<String, String>> getMatchStatus(@AuthenticationPrincipal String email) {
        log.info("battle.match.status email={}", email);
        com.example.demo.domain.member.entity.Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        return ResponseEntity.ok(battleMatchService.getMatchStatus(member.getId()));
    }
}
