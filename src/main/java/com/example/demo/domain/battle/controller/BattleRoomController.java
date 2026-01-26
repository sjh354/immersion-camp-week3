package com.example.demo.domain.battle.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import com.example.demo.domain.battle.service.BattleRoomService;
import com.example.demo.domain.battle.dto.BattleRoomResponse;

@RestController
@RequestMapping("/api/v1/battle")
@RequiredArgsConstructor
public class BattleRoomController {

    private final BattleRoomService battleRoomService;

    @GetMapping("/{sessionId}")
    public ResponseEntity<BattleRoomResponse> enterBattleRoom(@PathVariable Long sessionId) {
        // 방의 초기 스냅샷 데이터를 반환
        return ResponseEntity.ok(battleRoomService.getBattleRoomSnapshot(sessionId));
    }
}