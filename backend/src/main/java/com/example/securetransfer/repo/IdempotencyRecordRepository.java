package com.example.securetransfer.repo;

import com.example.securetransfer.domain.IdempotencyRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IdempotencyRecordRepository extends JpaRepository<IdempotencyRecord, Long> {
  Optional<IdempotencyRecord> findByUserIdAndIdemKey(Long userId, String idemKey);
}
