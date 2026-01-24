package com.example.demo.global.config;

import com.example.demo.global.util.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");

        String token = jwtTokenProvider.createToken(email);

        // 프론트엔드 리다이렉트 URL 설정 (예시: http://localhost:8080/?token=...)
        // 실제 운영 환경에서는 프론트엔드 URL로 변경해야 함
        String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:8080")
                .queryParam("token", token)
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}