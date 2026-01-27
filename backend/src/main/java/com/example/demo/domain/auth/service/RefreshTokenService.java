package com.example.demo.domain.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RedisTemplate<String, String> redisTemplate;

    // Refresh Token 저장 (Key: RT:{email}, Value: token, TTL: 14일)
    public void saveRefreshToken(String email, String refreshToken) {
        redisTemplate.opsForValue().set("RT:" + email, refreshToken, 14, TimeUnit.DAYS);
    }

    // Refresh Token 조회
    public String getRefreshToken(String email) {
        return redisTemplate.opsForValue().get("RT:" + email);
    }

    // Refresh Token 삭제 (로그아웃 시)
    public void deleteRefreshToken(String email) {
        redisTemplate.delete("RT:" + email);
    }
}
