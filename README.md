# 패션 배틀 게임 (immersion-camp-week3)

플레이어가 코디로 배틀을 벌이고, 관전자가 실시간 투표로 승패를 결정하는 풀스택 웹 앱입니다. 1라운드 투표 후 승자가 2라운드(애프터) 멘트를 제출하고, 관전자 투표로 성공/실패 결과를 확정합니다. 백엔드는 Spring Boot, 프론트는 Next.js, 실시간은 WebSocket(STOMP/SockJS) 기반입니다.

## 기능 소개

배틀 흐름
- 플레이어 매칭 후 세션 생성(레디스 큐)
- 1라운드: 두 코디 중 투표 진행
- 2라운드(애프터): 1라운드 승자 멘트에 대해 성공/실패 투표
- 결과 화면에서 승/패 및 애프터 결과 표시

실시간 기능
- 배틀 세션별 실시간 투표/채팅/타이머 동기화
- 로비(배틀 목록) 실시간 갱신

코디/옷장
- 코디 선택 및 라운드 순서(1·2라운드) 지정
- S3 프리뷰 이미지 기반 코디 표시

인증/보안
- Google OAuth2 로그인
- JWT 기반 인증 API

## 기술 스택

Backend
- Java 17, Spring Boot 3
- Spring Web, WebSocket(STOMP/SockJS), Spring Security + OAuth2
- Spring Data JPA(MariaDB), Spring Data Redis
- JWT(jjwt), AWS SDK(S3)

Frontend
- Next.js 15(App Router), React 18, TypeScript
- Tailwind CSS + Radix UI + MUI
- STOMP over SockJS로 실시간 배틀 업데이트

Infra / Dev
- Docker Compose(backend, frontend, mariadb, redis, nginx, cloudflared)

## 주요 라우트(요약)

배틀
- `/battle/select` 코디 선택 및 덱 순서 지정
- `/battle/waiting` 매칭 대기
- `/battle/message` 1라운드 멘트 제출
- `/battle/game/[sessionId]` 배틀 진행(채팅/투표/타이머)
- `/after` 2라운드 멘트 제출(승자)
- `/result` 최종 결과
- `/battle/vote` 진행 중 배틀 목록
- `/battle/vote/[sessionId]` 관전/투표 상세

기타
- `/landing`, `/community`, `/dressup`, `/profile`, `/login`

## 참고

- 배틀 상태는 Redis(`battle:session:*`)에 저장
- 타이머는 서버에서 구동 후 WebSocket으로 브로드캐스트
- 매칭은 Redis 리스트 큐(`battle:match_queue_v2`) 사용
