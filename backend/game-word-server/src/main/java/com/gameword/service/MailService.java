package com.gameword.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    // JavaMailSender chi duoc tao khi co spring.mail.host; thieu cau hinh thi bao loi khi gui, khong lam hong luc khoi dong
    private final ObjectProvider<JavaMailSender> mailSender;

    @Value("${spring.mail.host:}")
    private String host;

    @Value("${app.mail.from:}")
    private String from;

    public MailService(ObjectProvider<JavaMailSender> mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPasswordResetLink(String to, String username, String link, long validMinutes) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || host.isBlank()) {
            throw new RuntimeException("Email service not configured");
        }
        SimpleMailMessage message = new SimpleMailMessage();
        if (!from.isBlank()) {
            message.setFrom(from);
        }
        message.setTo(to);
        message.setSubject("Game Đoán Chữ - Đặt lại mật khẩu");
        message.setText("Xin chào " + username + ",\n\n"
            + "Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản Game Đoán Chữ.\n"
            + "Mở link sau để đặt mật khẩu mới (hiệu lực " + validMinutes + " phút, chỉ dùng được 1 lần):\n\n"
            + link + "\n\n"
            + "Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu hiện tại vẫn giữ nguyên.\n");
        try {
            sender.send(message);
        } catch (MailException ex) {
            log.error("Gui email dat lai mat khau that bai", ex);
            throw new RuntimeException("Email sending failed");
        }
    }
}
