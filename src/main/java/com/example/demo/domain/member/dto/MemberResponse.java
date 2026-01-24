package com.example.demo.domain.member.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MemberResponse {
    private Long id;
    private String email;
    private String nickname;
    private int winCount;
    private int lossCount;
}