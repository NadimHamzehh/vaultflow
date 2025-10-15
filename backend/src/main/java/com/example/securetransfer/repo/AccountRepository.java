package com.example.securetransfer.repo;

import com.example.securetransfer.domain.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
  Optional<Account> findByAccountNumber(String accNo);
  Optional<Account> findByUserId(Long userId);

  @Lock(LockModeType.PESSIMISTIC_WRITE)
  Optional<Account> findWithLockingByAccountNumber(String accNo);
}
