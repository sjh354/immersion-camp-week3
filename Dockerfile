# 1. Build Stage
FROM gradle:8.5-jdk17 AS builder
WORKDIR /app
COPY . .
# 테스트 제외하고 빌드 (메모리 부족 방지 및 속도 향상)
RUN ./gradlew build -x test

# 2. Run Stage
FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app
COPY --from=builder /app/build/libs/*.jar app.jar

# 실행 시 프로파일 설정 (기본값: dev)
ENV SPRING_PROFILES_ACTIVE=dev

ENTRYPOINT ["java", "-jar", "app.jar"]
