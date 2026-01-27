FROM gradle:8.14.3-jdk17-alpine AS builder
WORKDIR /home/gradle/project

COPY . .

# 권한/CRLF 방지(있어도 안전)
RUN chmod +x gradlew || true

# wrapper를 쓰지 않고 gradle로 바로 빌드 (다운로드 없음)
RUN gradle --no-daemon clean bootJar

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=builder /home/gradle/project/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]

