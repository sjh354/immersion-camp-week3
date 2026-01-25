package com.example.demo.domain.battle.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import com.example.demo.domain.battle.entity.BattleSession;
import org.springframework.data.jpa.repository.Query;

public interface BattleSessionRepository extends JpaRepository<BattleSession, Long> {
    // 특정 유저가 포함된 활성 배틀 세션 조회
    @Query("SELECT b FROM BattleSession b WHERE (b.host.id = :memberId OR b.guest.id = :memberId) AND b.status != 'FINISHED'")
    Optional<BattleSession> findActiveSessionByMemberId(Long memberId);
}