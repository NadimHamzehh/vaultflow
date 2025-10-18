package com.example.securetransfer.repo;

import com.example.securetransfer.domain.RecipientSeen;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RecipientSeenRepository extends JpaRepository<RecipientSeen, Long> {
  Optional<RecipientSeen> findByUserIdAndRecipientAccount(Long userId, String recipientAccount);
}
