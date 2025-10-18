package com.example.securetransfer.transfer;

import com.example.securetransfer.domain.IdempotencyRecord;
import com.example.securetransfer.repo.IdempotencyRecordRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Service
public class IdempotencyService {
  private final IdempotencyRecordRepository repo;

  public IdempotencyService(IdempotencyRecordRepository repo) {
    this.repo = repo;
  }

  public static String requestHash(String senderAcc, String recipientAcc, String amount) {
    var raw = senderAcc + "|" + recipientAcc + "|" + amount;
    return DigestUtils.md5DigestAsHex(raw.getBytes(StandardCharsets.UTF_8));
  }

  public Optional<IdempotencyRecord> find(Long userId, String key) {
    return repo.findByUserIdAndIdemKey(userId, key);
  }

  public IdempotencyRecord reserve(Long userId, String key, String requestHash) {
    var rec = new IdempotencyRecord();
    rec.setUserId(userId);
    rec.setIdemKey(key);
    rec.setRequestHash(requestHash);
    return repo.save(rec);
  }

  public void attachTxn(IdempotencyRecord rec, Long txnId) {
    rec.setTxnId(txnId);
    repo.save(rec);
  }
}
