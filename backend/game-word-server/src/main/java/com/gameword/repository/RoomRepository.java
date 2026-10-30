package com.gameword.repository;

import com.gameword.model.Room;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {
    Optional<Room> findByCode(String code);

    boolean existsByCode(String code);

    // SELECT ... FOR UPDATE: tuan tu hoa moi thao tac thay doi trong cung mot phong
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Room r WHERE r.code = :code")
    Optional<Room> findByCodeForUpdate(@Param("code") String code);

    @Query("SELECT r FROM Room r WHERE r.status <> 'CLOSED' AND r.id IN "
        + "(SELECT m.roomId FROM RoomMember m WHERE m.userId = :userId) ORDER BY r.updatedAt DESC")
    List<Room> findOpenRoomsOfUser(@Param("userId") Long userId);
}
