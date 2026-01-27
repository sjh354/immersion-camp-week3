package com.example.demo.global.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {
    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response, AuthenticationException authException) throws IOException {
        log.error("Unauthorized error: URL={}, Message={}", request.getRequestURI(), authException.getMessage());
        
        // request attribute에 저장된 예외가 있다면 함께 출력 (필터에서 설정했을 경우)
        Object exception = request.getAttribute("exception");
        if (exception != null) {
            log.error("Exception attribute: {}", exception);
        }

        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, authException.getMessage());
    }
}
