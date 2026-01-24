package com.example.demo.domain.member.repository;

import com.example.demo.domain.member.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {
    
    // 이메일로 회원 찾기 (로그인 및 JWT 검증용)
    Optional<Member> findByEmail(String email);

    // 닉네임이 이미 존재하는지 확인 (중복 체크용)
    boolean existsByNickname(String nickname);
}