package com.example.demo.domain.member.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import java.util.Collections;
import java.util.Map;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import com.example.demo.domain.member.repository.MemberRepository;
import com.example.demo.domain.member.entity.AuthProvider;
import com.example.demo.domain.member.entity.Member;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    private final MemberRepository memberRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();

        String email = (String) attributes.get("email");
        String providerId = (String) attributes.get("sub");

        // 기존 회원이 아니면 자동 가입 (Provider: GOOGLE)
        memberRepository.findByEmail(email)
                .orElseGet(() -> memberRepository.save(Member.builder()
                        .email(email)
                        .nickname("Temporary_Name") // 최초 가입 시 임시 닉네임
                        .provider(AuthProvider.GOOGLE)
                        .providerId(providerId)
                        .build()));

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                attributes,
                "sub");
    }
}