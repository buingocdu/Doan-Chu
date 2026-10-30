package com.gameword.repository;

import com.gameword.model.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    // Thu tu vao phong: nguoi vao som nhat nhan quyen chu phong khi chu phong roi di
    List<RoomMember> findByRoomIdOrderByJoinedAtAscIdAsc(Long roomId);

    Optional<RoomMember> findByRoomIdAndUserId(Long roomId, Long userId);

    boolean existsByRoomIdAndUserId(Long roomId, Long userId);

    long countByRoomId(Long roomId);
}
