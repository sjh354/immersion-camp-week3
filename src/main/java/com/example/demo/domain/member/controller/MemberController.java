package com.example.demo.domain.member.controller;

import com.example.demo.domain.member.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import com.example.demo.domain.member.dto.MemberNicknameRequest;
import com.example.demo.domain.member.dto.MemberResponse;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    // 1. 닉네임 중복 체크 (기존과 동일)
    @GetMapping("/check")
    public ResponseEntity<Boolean> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(memberService.isNicknameAvailable(nickname));
    }

    // 2. 최초 닉네임 설정 (DTO 사용)
    @PostMapping("/onboarding")
    public ResponseEntity<String> setNickname(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody MemberNicknameRequest request) { // @Valid로 유효성 검사 수행
        memberService.updateNickname(email, request.getNickname());
        return ResponseEntity.ok("닉네임 설정이 완료되었습니다.");
    }

    // 3. 내 프로필 정보 조회
    @GetMapping("/me")
    public ResponseEntity<MemberResponse> getMyProfile(@AuthenticationPrincipal String email) {
        return ResponseEntity.ok(memberService.getMemberProfile(email));
    }
}