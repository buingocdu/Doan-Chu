package com.gameword.repository;

import com.gameword.model.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findTop50ByRoomIdOrderByIdDesc(Long roomId);

    List<ChatMessage> findByRoomIdAndIdGreaterThanOrderByIdAsc(Long roomId, Long afterId);

    // Hoi thoai rieng giua 2 nguoi, moi nhat truoc (dao lai o service)
    @Query("SELECT m FROM ChatMessage m WHERE m.roomId IS NULL AND "
        + "((m.senderId = :a AND m.recipientId = :b) OR (m.senderId = :b AND m.recipientId = :a)) ORDER BY m.id DESC")
    List<ChatMessage> findConversation(@Param("a") Long a, @Param("b") Long b, Pageable pageable);

    @Query("SELECT m FROM ChatMessage m WHERE m.roomId IS NULL AND m.id > :afterId AND "
        + "((m.senderId = :a AND m.recipientId = :b) OR (m.senderId = :b AND m.recipientId = :a)) ORDER BY m.id ASC")
    List<ChatMessage> findConversationAfter(@Param("a") Long a, @Param("b") Long b, @Param("afterId") Long afterId);

    long countByRecipientIdAndReadAtIsNull(Long recipientId);

    // [senderId, so tin chua doc] gui toi recipient
    @Query("SELECT m.senderId, COUNT(m) FROM ChatMessage m WHERE m.recipientId = :recipientId AND m.readAt IS NULL "
        + "GROUP BY m.senderId")
    List<Object[]> countUnreadBySender(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("UPDATE ChatMessage m SET m.readAt = :now WHERE m.recipientId = :recipientId AND m.senderId = :senderId "
        + "AND m.readAt IS NULL")
    int markRead(@Param("recipientId") Long recipientId, @Param("senderId") Long senderId, @Param("now") LocalDateTime now);
}
