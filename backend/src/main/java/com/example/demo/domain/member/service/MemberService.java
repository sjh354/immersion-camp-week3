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

    // 4. 배틀 덱 업데이트
    @Transactional
    public void updateBattleDeck(String email, Long outfit1Id, Long outfit2Id) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        member.updateBattleDeck(outfit1Id, outfit2Id);
    }

    // 5. 배틀 덱 조회
    public java.util.Map<String, Long> getBattleDeck(String email) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음"));
        // TODO: Map.of는 null 값을 허용하지 않으므로, null일 경우 처리가 필요할 수 있습니다.
        // 여기서는 간단히 HashMap 사용
        java.util.Map<String, Long> deck = new java.util.HashMap<>();
        deck.put("outfit1Id", member.getMainOutfitId1());
        deck.put("outfit2Id", member.getMainOutfitId2());
        return deck;
    }
}