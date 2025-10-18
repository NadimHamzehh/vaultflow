// src/main/java/com/example/securetransfer/notifications/SecurityMailService.java
package com.example.securetransfer.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;

@Service
public class SecurityMailService {

  private static final Logger log = LoggerFactory.getLogger(SecurityMailService.class);

  private final JavaMailSender mail;

  @Value("${spring.mail.from:no-reply@vaultflow.local}")
  private String fromAddress;

  public SecurityMailService(JavaMailSender mail) {
    this.mail = mail;
  }

  public void send(String to, String subject, String body) {
    try {
      SimpleMailMessage msg = new SimpleMailMessage();
      msg.setFrom(fromAddress);
      msg.setTo(to);
      msg.setSubject(subject == null ? "(no subject)" : subject);
      msg.setText(body == null ? "" : body);
      mail.send(msg);
      log.info("Security email queued OK to {}", to);
    } catch (MailException ex) {
      log.warn("Security email send failed to {}: {}", to, ex.getMessage());
    } catch (Exception ex) {
      log.warn("Security email send unexpected error to {}: {}", to, ex.toString());
    }
  }

  public void sendForNotification(UserNotification n, String toEmail, String userDisplayName) {
    if (n == null || toEmail == null || toEmail.isBlank()) return;
    String subject = subjectFor(n.getType());
    String body = defaultBody(n, userDisplayName);
    send(toEmail, subject, body);
  }

  public String subjectFor(NotificationType type) {
    if (type == null) return "Security update";
    return switch (type) {
      case PASSWORD_CHANGED   -> "Your password was changed";
      case TWO_FA_TOGGLED    -> "Two-Factor Authentication setting changed";
      case NEW_LOGIN         -> "New login detected";
      case FAILED_2FA_BURST  -> "Multiple failed 2FA attempts detected";
    };
  }

  public String defaultBody(UserNotification n, String userDisplay) {
    String display = (userDisplay == null || userDisplay.isBlank()) ? "there" : userDisplay;
    OffsetDateTime when = (n != null && n.getCreatedAt() != null) ? n.getCreatedAt() : OffsetDateTime.now(ZoneOffset.UTC);
    String whenStr = when.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME);
    String line = (n != null && n.getBody() != null && !n.getBody().isBlank())
        ? n.getBody()
        : switch (n != null ? n.getType() : null) {
            case PASSWORD_CHANGED   -> "Your account password was recently changed.";
            case TWO_FA_TOGGLED    -> "Your Two-Factor Authentication setting was updated.";
            case NEW_LOGIN         -> "We noticed a successful sign-in to your account.";
            case FAILED_2FA_BURST  -> "We detected multiple failed 2FA attempts on your account.";
            default                -> "There has been a security-related update on your account.";
          };

    String ip     = n != null ? nullSafe(n.getIp())     : "-";
    String device = n != null ? nullSafe(n.getDevice()) : "-";

    return """
        Hi %s,

        %s

        IP: %s
        Device: %s
        Time: %s

        If this wasn't you, please secure your account immediately by changing your password
        and reviewing your 2FA settings.

        — VaultFlow Security
        """.formatted(display, line, ip, device, whenStr);
  }

  private String nullSafe(String s) { return (s == null || s.isBlank()) ? "-" : s; }
}
