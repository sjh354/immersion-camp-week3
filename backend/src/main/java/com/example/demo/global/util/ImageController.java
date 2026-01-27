package com.example.demo.global.util;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.HashMap;
import java.util.Map;
import java.io.IOException;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/images")
@RequiredArgsConstructor
public class ImageController {

    private final S3UploadService s3UploadService;

    // 프론트엔드에서 코디 화면 캡처본을 보낼 때 사용하는 API
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> upload(@RequestPart("file") MultipartFile file) throws IOException {
        String url = s3UploadService.upload(file);

        Map<String, String> response = new HashMap<>();
        response.put("imageUrl", url);

        return ResponseEntity.ok(response);
    }
}