package com.example.demo.domain.auth.controller;

import com.example.demo.domain.auth.service.RefreshTokenService;
import com.example.demo.global.util.JwtTokenProvider;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    private final com.example.demo.domain.auth.service.GoogleAuthService googleAuthService;
    private final com.example.demo.domain.member.repository.MemberRepository memberRepository;

    // 1. 구글 로그인 (클라이언트가 보낸 구글 AccessToken 검증 후 자체 JWT 발급)
    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> request) {
        String googleAccessToken = request.get("accessToken");
        if (googleAccessToken == null || googleAccessToken.isBlank()) {
            return ResponseEntity.badRequest().body("Missing accessToken");
        }
        com.fasterxml.jackson.databind.JsonNode userInfo = googleAuthService.getUserInfo(googleAccessToken);

        String email = userInfo.get("email").asText();
        String providerId = userInfo.get("sub").asText();

        // 사용자 조회 또는 가입
        boolean isNewMember = false;
        if (memberRepository.findByEmail(email).isEmpty()) {
             memberRepository.save(java.util.Objects.requireNonNull(com.example.demo.domain.member.entity.Member.builder()
                    .email(email)
                    .nickname("Temporary_Name") // 최초 가입 시 임시 닉네임
                    .provider(com.example.demo.domain.member.entity.AuthProvider.GOOGLE)
                    .providerId(providerId)
                    .build()));
            isNewMember = true;
        }

        // 자체 토큰 발급
        String accessToken = jwtTokenProvider.createAccessToken(email);
        String refreshToken = jwtTokenProvider.createRefreshToken(email);

        // Redis에 Refresh Token 저장
        refreshTokenService.saveRefreshToken(email, refreshToken);

        return ResponseEntity.ok(Map.of(
            "accessToken", accessToken,
            "refreshToken", refreshToken,
            "isNewMember", isNewMember
        ));
    }

    // 2. 토큰 갱신 (Access Token 만료 시 Refresh Token으로 재발급)
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        
        if (refreshToken == null || !jwtTokenProvider.validateToken(refreshToken)) {
            return ResponseEntity.badRequest().body("Invalid Refresh Token");
        }

        String email = jwtTokenProvider.getEmail(refreshToken);
        String storedRefreshToken = refreshTokenService.getRefreshToken(email);

        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            return ResponseEntity.badRequest().body("Refresh Token not found or mismatch");
        }

        // 새로운 Access Token 발급
        String newAccessToken = jwtTokenProvider.createAccessToken(email);

        // (선택사항) Refresh Token Rotation을 원하면 여기서 Refresh Token도 새로 발급하고 저장할 수 있음

        return ResponseEntity.ok(Map.of("accessToken", newAccessToken));
    }

    // 3. 로그아웃 (Refresh Token 삭제)
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken != null && jwtTokenProvider.validateToken(refreshToken)) {
            String email = jwtTokenProvider.getEmail(refreshToken);
            refreshTokenService.deleteRefreshToken(email);
        }
        return ResponseEntity.ok("Logged out successfully");
    }
}
