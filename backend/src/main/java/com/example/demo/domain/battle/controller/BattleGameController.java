package com.example.demo.domain.battle.controller;

import com.example.demo.domain.battle.service.BattleGameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/battle")
@RequiredArgsConstructor
public class BattleGameController {

    private final BattleGameService battleGameService;
    private final com.example.demo.domain.member.repository.MemberRepository memberRepository;

    // 1. 라운드 2 시작
    @PostMapping("/{sessionId}/round2")
    public ResponseEntity<String> startRound2(@PathVariable Long sessionId) {
        battleGameService.transitionToRound2(sessionId);
        return ResponseEntity.ok("라운드 2가 시작되었습니다.");
    }

    // 2. 게임 종료 및 결과 처리
    @PostMapping("/{sessionId}/end")
    public ResponseEntity<String> endGame(@PathVariable Long sessionId) {
        battleGameService.endGame(sessionId);
        return ResponseEntity.ok("배틀이 종료되었습니다.");
    }

    // 3. 멘트 제출
    @PostMapping("/round/submit")
    public ResponseEntity<Void> submitMent(
            @org.springframework.security.core.annotation.AuthenticationPrincipal String email,
            @RequestBody MentRequest request) {
        
        com.example.demo.domain.member.entity.Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        battleGameService.submitMent(request.getSessionId(), member.getId(), request.getMent());
        return ResponseEntity.ok().build();
    }

    @lombok.Getter
    @lombok.NoArgsConstructor
    public static class MentRequest {
        private Long sessionId;
        private int roundNum;
        private String ment;
    }

    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<String> handleException(RuntimeException e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}
