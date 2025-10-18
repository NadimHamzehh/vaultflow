// src/main/java/com/example/securetransfer/service/TransferGuardService.java
package com.example.securetransfer.service;

import java.math.BigDecimal;

/**
 * Optional guardrails for transfers (daily/weekly limits, velocity, cool-off, etc.).
 * If no bean implements this interface, TransferController simply skips these checks.
 */
public interface TransferGuardService {

  /**
   * Throw an IllegalArgumentException (or a custom runtime exception) if the transfer
   * should be blocked due to policy/limits/velocity/cool-off rules.
   *
   * @param userId         current user id (sender)
   * @param senderAccount  sender account number
   * @param recipientAccount recipient account number
   * @param amount         transfer amount
   */
  void validateTransfer(Long userId, String senderAccount, String recipientAccount, BigDecimal amount);
}
