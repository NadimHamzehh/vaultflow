package com.example.securetransfer.repo;

import com.example.securetransfer.domain.Txn;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.time.OffsetDateTime;
public interface TxnRepository extends JpaRepository<Txn, Long> {

  // Existing – used for account/transaction history display
  List<Txn> findBySenderAccountOrRecipientAccountOrderByCreatedAtDesc(String sender, String recipient);

  // ----- Added: reporting for statements (monthly ranges, etc.)
  List<Txn> findByCreatedAtBetweenOrderByCreatedAtAsc(Instant start, Instant end);
  List<Txn> findByCreatedAtBetweenOrderByCreatedAtAsc(OffsetDateTime start, OffsetDateTime end);
  // ----- Added: guardrails / velocity controls
  @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Txn t WHERE t.senderAccount = :sender AND t.createdAt >= :since")
  BigDecimal sumOutgoingSince(@Param("sender") String sender, @Param("since") Instant since);

  @Query("SELECT COUNT(t) FROM Txn t WHERE t.senderAccount = :sender AND t.createdAt >= :since")
  long countOutgoingSince(@Param("sender") String sender, @Param("since") Instant since);
}
