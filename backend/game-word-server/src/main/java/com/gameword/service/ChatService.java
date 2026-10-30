package com.gameword.service;

import com.gameword.dto.ChatMessageDto;
import com.gameword.model.ChatMessage;
import com.gameword.repository.ChatMessageRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

// Tin nhan phong va tin nhan rieng (chung bang chat_messages)
@Service
@Transactional
public class ChatService {

    private static final int PAGE_SIZE = 50;
    // Chong spam: toi da 1 tin moi khoang nay cho moi nguoi
    private static final Duration MIN_INTERVAL = Duration.ofMillis(700);

    private final ChatMessageRepository chatRepository;
    private final UserService userService;
    private final Map<Long, Instant> lastSentAt = new ConcurrentHashMap<>();

    public ChatService(ChatMessageRepository chatRepository, UserService userService) {
        this.chatRepository = chatRepository;
        this.userService = userService;
    }

    public ChatMessage roomSystem(Long roomId, String content) {
        return chatRepository.save(ChatMessage.builder()
            .roomId(roomId)
            .type(ChatMessage.SYSTEM)
            .content(truncate(content))
            .createdAt(LocalDateTime.now())
            .build());
    }

    public ChatMessage roomText(Long roomId, Long senderId, String content) {
        String text = cleanText(content);
        throttle(senderId);
        return chatRepository.save(ChatMessage.builder()
            .roomId(roomId)
            .senderId(senderId)
            .type(ChatMessage.TEXT)
            .content(text)
            .createdAt(LocalDateTime.now())
            .build());
    }

    // afterId null: 50 tin gan nhat; nguoc lai: cac tin moi hon afterId
    @Transactional(readOnly = true)
    public List<ChatMessageDto> roomMessages(Long roomId, Long afterId) {
        List<ChatMessage> messages;
        if (afterId == null) {
            messages = new ArrayList<>(chatRepository.findTop50ByRoomIdOrderByIdDesc(roomId));
            Collections.reverse(messages);
        } else {
            messages = chatRepository.findByRoomIdAndIdGreaterThanOrderByIdAsc(roomId, afterId);
        }
        return toDtos(messages);
    }

    // Kiem tra quyen (ban be) do FriendService/MessageController lam truoc khi goi
    public ChatMessageDto sendDirect(Long senderId, Long recipientId, String type, String content) {
        boolean isText = ChatMessage.TEXT.equals(type);
        String text = isText ? cleanText(content) : truncate(content);
        // Chi gioi han tin go tay; loi moi vao phong (bam nhieu ban lien tiep) khong bi chan
        if (isText) {
            throttle(senderId);
        }
        ChatMessage saved = chatRepository.save(ChatMessage.builder()
            .senderId(senderId)
            .recipientId(recipientId)
            .type(type)
            .content(text)
            .createdAt(LocalDateTime.now())
            .build());
        return toDtos(List.of(saved)).get(0);
    }

    // Lay hoi thoai va danh dau cac tin gui toi userId la da doc
    public List<ChatMessageDto> conversation(Long userId, Long otherId, Long afterId) {
        List<ChatMessage> messages;
        if (afterId == null) {
            messages = new ArrayList<>(chatRepository.findConversation(userId, otherId, PageRequest.of(0, PAGE_SIZE)));
            Collections.reverse(messages);
        } else {
            messages = chatRepository.findConversationAfter(userId, otherId, afterId);
        }
        chatRepository.markRead(userId, otherId, LocalDateTime.now());
        return toDtos(messages);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return chatRepository.countByRecipientIdAndReadAtIsNull(userId);
    }

    @Transactional(readOnly = true)
    public Map<Long, Long> unreadBySender(Long userId) {
        return chatRepository.countUnreadBySender(userId).stream()
            .collect(Collectors.toMap(row -> (Long) row[0], row -> (Long) row[1]));
    }

    public List<ChatMessageDto> toDtos(List<ChatMessage> messages) {
        Map<Long, String> names = userService.usernames(
            messages.stream().map(ChatMessage::getSenderId).collect(Collectors.toList()));
        return messages.stream().map(m -> ChatMessageDto.builder()
            .id(m.getId())
            .type(m.getType())
            .senderId(m.getSenderId())
            .senderName(m.getSenderId() == null ? null : names.get(m.getSenderId()))
            .recipientId(m.getRecipientId())
            .content(m.getContent())
            .createdAt(Times.epochMillis(m.getCreatedAt()))
            .build()).collect(Collectors.toList());
    }

    private String cleanText(String content) {
        String text = content == null ? "" : content.strip();
        if (text.isEmpty()) {
            throw new RuntimeException("Message is empty");
        }
        if (text.length() > ChatMessage.MAX_LENGTH) {
            throw new RuntimeException("Message too long");
        }
        return text;
    }

    private void throttle(Long senderId) {
        Instant now = Instant.now();
        Instant last = lastSentAt.get(senderId);
        if (last != null && last.plus(MIN_INTERVAL).isAfter(now)) {
            throw new RuntimeException("Sending too fast");
        }
        lastSentAt.put(senderId, now);
    }

    private static String truncate(String content) {
        return content.length() <= ChatMessage.MAX_LENGTH ? content : content.substring(0, ChatMessage.MAX_LENGTH);
    }
}
