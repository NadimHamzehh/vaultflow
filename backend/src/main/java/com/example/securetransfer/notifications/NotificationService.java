// src/main/java/com/example/securetransfer/notifications/NotificationService.java
package com.example.securetransfer.notifications;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Map;

@Service
public class NotificationService {

  private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

  private final UserNotificationRepository repo;
  private final SecurityMailService mail;
  private final ObjectMapper om;

  public NotificationService(UserNotificationRepository repo, SecurityMailService mail, ObjectMapper om) {
    this.repo = repo; this.mail = mail; this.om = om;
  }

  @Transactional(noRollbackFor = Exception.class)
  public UserNotification createAndMaybeEmail(
      Long userId, String userEmail, String userDisplay,
      NotificationType type, NotificationSeverity sev,
      String title, String body,
      Map<String, Object> meta, String ip, String device,
      boolean email) {

    UserNotification n = new UserNotification();
    n.setUserId(userId);
    n.setType(type != null ? type : NotificationType.NEW_LOGIN);
    n.setSeverity(sev != null ? sev : NotificationSeverity.INFO);
    n.setTitle((title == null || title.isBlank()) ? "Security update" : title);
    n.setBody((body == null || body.isBlank()) ? "There was an update on your account." : body);
    n.setIp(ip);
    n.setDevice(device);

    if (meta != null && !meta.isEmpty()) {
      try { n.setMetaJson(om.writeValueAsString(meta)); }
      catch (Exception ex) { log.debug("Meta JSON serialization failed: {}", ex.toString()); }
    }
    n.setCreatedAt(OffsetDateTime.now());

    try {
      repo.save(n);
    } catch (Exception ex) {
      log.warn("Failed saving UserNotification for user {}: {}", userId, ex.toString());
      // Keep going — we can still try to email even if we didn't persist
    }

    if (email && userEmail != null && !userEmail.isBlank()) {
      try {
        mail.send(userEmail, mail.subjectFor(type), mail.defaultBody(n, (userDisplay == null || userDisplay.isBlank()) ? "there" : userDisplay));
        n.setEmailedAt(OffsetDateTime.now());
        try { repo.save(n); } catch (Exception ex2) { log.debug("Failed updating emailedAt: {}", ex2.toString()); }
      } catch (Exception ex) {
        log.warn("Email send failed to {} (type {}): {}", userEmail, type, ex.toString());
      }
    }

    return n;
  }

  @Transactional(readOnly = true)
  public Page<UserNotification> list(Long userId, int page, int size) {
    return repo.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
  }

  @Transactional
  public void markRead(Long userId, Long id) {
    repo.findById(id).filter(n -> n.getUserId().equals(userId)).ifPresent(n -> {
      n.setReadAt(OffsetDateTime.now());
      repo.save(n);
    });
  }

  @Transactional
  public int markAllRead(Long userId) {
    var page = list(userId, 0, 500);
    int count = 0;
    for (var n : page.getContent()) {
      if (n.getReadAt() == null) { n.setReadAt(OffsetDateTime.now()); repo.save(n); count++; }
    }
    return count;
  }

  @Transactional(readOnly = true)
  public long unreadCount(Long userId) {
    return repo.countByUserIdAndReadAtIsNull(userId);
  }
}
