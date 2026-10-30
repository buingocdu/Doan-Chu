package com.gameword.repository;

import com.gameword.model.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    // Quan he giua 2 nguoi theo ca hai chieu (chi ton tai toi da 1 dong)
    @Query("SELECT f FROM Friendship f WHERE (f.requesterId = :a AND f.addresseeId = :b) "
        + "OR (f.requesterId = :b AND f.addresseeId = :a)")
    Optional<Friendship> findBetween(@Param("a") Long a, @Param("b") Long b);

    @Query("SELECT f FROM Friendship f WHERE f.requesterId = :userId OR f.addresseeId = :userId ORDER BY f.id DESC")
    List<Friendship> findAllOf(@Param("userId") Long userId);

    long countByAddresseeIdAndStatus(Long addresseeId, String status);

    long countByRequesterIdAndStatus(Long requesterId, String status);
}
