package com.example.demo.domain.member.service;

import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.demo.domain.member.dto.MemberResponse;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private final MemberRepository memberRepository;

    // 1. 닉네임 중복 체크
    public boolean isNicknameAvailable(String nickname) {
        // DB에 해당 닉네임이 존재하지 않아야 사용 가능(true)
        return !memberRepository.existsByNickname(nickname);
    }

    // 2. 닉네임 업데이트 (온보딩)
    @Transactional
    public void updateNickname(String email, String nickname) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        // 닉네임 중복 재검증 (보안상 필요)
        if (!isNicknameAvailable(nickname)) {
            throw new IllegalStateException("이미 사용 중인 닉네임입니다.");
        }

        member.updateNickname(nickname); // Entity에 정의된 업데이트 메서드 호출
    }

    // 3. 내 프로필 정보 조회
    public MemberResponse getMemberProfile(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("해당 유저를 찾을 수 없습니다."));

        return MemberResponse.builder()
                .id(member.getId())
                .email(member.getEmail())
                .nickname(member.getNickname())
                .winCount(member.getWinCount())
                .lossCount(member.getLossCount())
                .build();
    }
}