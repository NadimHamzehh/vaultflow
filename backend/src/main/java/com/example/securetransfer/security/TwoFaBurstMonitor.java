// src/main/java/com/example/securetransfer/security/TwoFaBurstMonitor.java
package com.example.securetransfer.security;

import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** Sliding window monitor for failed 2FA attempts per user. */
@Component
public class TwoFaBurstMonitor {
  private final Map<Long, Deque<Long>> failures = new ConcurrentHashMap<>();
  private final int windowSeconds = 5 * 60; // 5 minutes
  private final int threshold = 5; // e.g., 5+ fails

  public boolean recordFailure(Long userId) {
    long now = Instant.now().getEpochSecond();
    Deque<Long> q = failures.computeIfAbsent(userId, k -> new ArrayDeque<>());
    q.addLast(now);
    // trim window
    while (!q.isEmpty() && (now - q.peekFirst()) > windowSeconds) q.removeFirst();
    return q.size() >= threshold;
  }
}
