package com.example.demo.domain.chat.entity;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import com.example.demo.global.common.BaseTimeEntity;
import com.example.demo.domain.member.entity.Member;
import com.example.demo.domain.battle.entity.BattleSession;
import lombok.Builder;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private BattleSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private Member sender; // 시스템 메시지일 경우 null이 될 수 있음

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    private MessageType type;

    @Builder
    public ChatMessage(BattleSession session, Member sender, String content, MessageType type) {
        this.session = session;
        this.sender = sender;
        this.content = content;
        this.type = type;
    }
}