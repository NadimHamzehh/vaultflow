package com.example.securetransfer.transfer;

import com.example.securetransfer.domain.RecipientSeen;
import com.example.securetransfer.repo.RecipientSeenRepository;
import com.example.securetransfer.repo.TxnRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;

@Service
public class TransferGuardService {

  // ---- tweak safely here ----
  private static final BigDecimal DAILY_LIMIT  = new BigDecimal("5000.00");
  private static final BigDecimal WEEKLY_LIMIT = new BigDecimal("20000.00");
  private static final Duration  VELOCITY_WINDOW = Duration.ofMinutes(5);
  private static final int       VELOCITY_MAX    = 5;
  private static final Duration  COOL_OFF        = Duration.ofHours(24);
  // ---------------------------

  private final TxnRepository txns;
  private final RecipientSeenRepository seenRepo;

  public TransferGuardService(TxnRepository txns, RecipientSeenRepository seenRepo) {
    this.txns = txns;
    this.seenRepo = seenRepo;
  }

  public void enforceLimits(String senderAccount, Long userId, String recipientAccount, BigDecimal amount) {
    // Daily
    var daySum = txns.sumOutgoingSince(senderAccount, Instant.now().minus(Duration.ofDays(1)));
    if (daySum.add(amount).compareTo(DAILY_LIMIT) > 0) {
      throw new IllegalStateException("Daily transfer limit exceeded");
    }
    // Weekly
    var weekSum = txns.sumOutgoingSince(senderAccount, Instant.now().minus(Duration.ofDays(7)));
    if (weekSum.add(amount).compareTo(WEEKLY_LIMIT) > 0) {
      throw new IllegalStateException("Weekly transfer limit exceeded");
    }
    // Velocity
    var recentCount = txns.countOutgoingSince(senderAccount, Instant.now().minus(VELOCITY_WINDOW));
    if (recentCount >= VELOCITY_MAX) {
      throw new IllegalStateException("Too many transfers in a short time. Please wait a moment.");
    }
    // Cool-off for new recipient
    var seen = seenRepo.findByUserIdAndRecipientAccount(userId, recipientAccount)
        .orElseGet(() -> {
          // first time we see this recipient for this user — record and block
          var rec = new RecipientSeen(userId, recipientAccount);
          seenRepo.save(rec);
          return rec;
        });
    if (Duration.between(seen.getFirstSeenAt(), Instant.now()).compareTo(COOL_OFF) < 0) {
      throw new IllegalStateException("New recipient is in cool-off period. Try again later.");
    }
  }
}
