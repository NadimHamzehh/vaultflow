// src/main/java/com/example/securetransfer/notifications/UserNotificationRepository.java
package com.example.securetransfer.notifications;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserNotificationRepository extends JpaRepository<UserNotification, Long> {
  Page<UserNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
  long countByUserIdAndReadAtIsNull(Long userId);
}
