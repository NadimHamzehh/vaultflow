// src/main/java/com/example/securetransfer/notifications/UserNotification.java
package com.example.securetransfer.notifications;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "user_notifications", indexes = {
    @Index(name="ux_user_unread_created", columnList = "userId, readAt, createdAt DESC")
})
public class UserNotification {

  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private Long userId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 40)
  private NotificationType type;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private NotificationSeverity severity = NotificationSeverity.INFO;

  @Column(nullable = false, length = 160)
  private String title;

  @Column(nullable = false, length = 4000)
  private String body;

  @Column(columnDefinition = "TEXT")
  private String metaJson;

  private String ip;
  private String device;

  @Column(nullable = false)
  private OffsetDateTime createdAt = OffsetDateTime.now();

  private OffsetDateTime readAt;
  private OffsetDateTime emailedAt;

  // -------- getters / setters ----------
  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }

  public Long getUserId() { return userId; }
  public void setUserId(Long userId) { this.userId = userId; }

  public NotificationType getType() { return type; }
  public void setType(NotificationType type) { this.type = type; }

  public NotificationSeverity getSeverity() { return severity; }
  public void setSeverity(NotificationSeverity severity) { this.severity = severity; }

  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }

  public String getBody() { return body; }
  public void setBody(String body) { this.body = body; }

  public String getMetaJson() { return metaJson; }
  public void setMetaJson(String metaJson) { this.metaJson = metaJson; }

  public String getIp() { return ip; }
  public void setIp(String ip) { this.ip = ip; }

  public String getDevice() { return device; }
  public void setDevice(String device) { this.device = device; }

  public OffsetDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

  public OffsetDateTime getReadAt() { return readAt; }
  public void setReadAt(OffsetDateTime readAt) { this.readAt = readAt; }

  public OffsetDateTime getEmailedAt() { return emailedAt; }
  public void setEmailedAt(OffsetDateTime emailedAt) { this.emailedAt = emailedAt; }
}
