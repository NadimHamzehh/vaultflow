package com.example.securetransfer.repo;

import com.example.securetransfer.model.UserTwoFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserTwoFactorRepository extends JpaRepository<UserTwoFactor, Long> {

  Optional<UserTwoFactor> findByUserId(Long userId);

  @Query("select u from UserTwoFactor u where u.userId = :userId and u.enabled = true")
  Optional<UserTwoFactor> findEnabledByUserId(Long userId);
}
