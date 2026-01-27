package com.example.demo.domain.battle.controller;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.ResponseEntity;
import lombok.RequiredArgsConstructor;
import java.util.List;
import com.example.demo.domain.battle.service.BattleLobbyService;
import com.example.demo.domain.battle.dto.BattleLobbyResponse;

@RestController
@RequestMapping("/api/v1/battle/lobby")
@RequiredArgsConstructor
public class BattleLobbyController {

    private final BattleLobbyService lobbyService;

    @GetMapping
    public ResponseEntity<List<BattleLobbyResponse>> getLobby() {
        return ResponseEntity.ok(lobbyService.getAllActiveBattles());
    }
}