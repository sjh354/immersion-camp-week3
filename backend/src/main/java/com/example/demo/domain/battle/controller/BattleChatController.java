package com.example.demo.domain.battle.controller;

import com.example.demo.domain.battle.service.BattleChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class BattleChatController {

    private final BattleChatService battleChatService;

    @GetMapping("/{sessionId}")
    public ResponseEntity<List<Object>> getChatHistory(
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        
        // Redis List는 이미 최신 50개만 유지되므로 전체 반환
        // page/size 파라미터는 프론트엔드 호환성을 위해 유지하되 로직에서는 무시
        return ResponseEntity.ok(battleChatService.getChatHistory(sessionId));
    }
}
