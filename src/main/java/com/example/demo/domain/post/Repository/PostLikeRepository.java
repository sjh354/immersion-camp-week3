package com.example.demo.domain.post.Repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.demo.domain.post.entity.PostLike;

// 좋아요 중복 체크
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByPostIdAndMemberId(Long postId, Long memberId);
}