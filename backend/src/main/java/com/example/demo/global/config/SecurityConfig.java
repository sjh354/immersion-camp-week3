package com.example.demo.global.config;

import com.example.demo.global.security.JwtAuthenticationFilter; // 필터 경로 확인
import com.example.demo.global.util.JwtTokenProvider; // Provider 경로 확인
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtTokenProvider jwtTokenProvider; // 1. JWT 프로바이더 주입 추가

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // 로그인, Swagger 문서는 모든 접근 허용
                        .requestMatchers(
                                "/",
                                "/error",
                                "/api/v1/auth/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/ws-battle/**")
                        .permitAll()
                        .anyRequest().authenticated())
                // 2. JWT 필터 추가: UsernamePasswordAuthenticationFilter 전에 실행되도록 설정
                .addFilterBefore(new JwtAuthenticationFilter(jwtTokenProvider),
                        UsernamePasswordAuthenticationFilter.class)
                .exceptionHandling(handler -> handler.authenticationEntryPoint(new com.example.demo.global.security.JwtAuthenticationEntryPoint()));

        return http.build();
    }
}
