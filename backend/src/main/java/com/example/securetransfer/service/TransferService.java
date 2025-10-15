package com.example.securetransfer.service;

import com.example.securetransfer.domain.Account;
import com.example.securetransfer.domain.Txn;
import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.TxnRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class TransferService {
  private final AccountRepository accounts;
  private final TxnRepository txns;

  public TransferService(AccountRepository a, TxnRepository t){ this.accounts=a; this.txns=t; }

  @Transactional
  public void transfer(String senderAcc, String recipientAcc, BigDecimal amount){
    if (senderAcc.equals(recipientAcc)) throw new IllegalArgumentException("Cannot transfer to same account");
    if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("Amount must be positive");

    // Lock both accounts in a deterministic order
    var first = senderAcc.compareTo(recipientAcc) < 0 ? senderAcc : recipientAcc;
    var second = senderAcc.compareTo(recipientAcc) < 0 ? recipientAcc : senderAcc;

    Account a1 = accounts.findWithLockingByAccountNumber(first)
        .orElseThrow(() -> new IllegalArgumentException("Account not found: "+first));
    Account a2 = accounts.findWithLockingByAccountNumber(second)
        .orElseThrow(() -> new IllegalArgumentException("Account not found: "+second));

    Account sender = senderAcc.equals(a1.getAccountNumber()) ? a1 : a2;
    Account recipient = recipientAcc.equals(a1.getAccountNumber()) ? a1 : a2;

    if (sender.getBalance().compareTo(amount) < 0) throw new IllegalStateException("Insufficient funds");

    sender.setBalance(sender.getBalance().subtract(amount));
    recipient.setBalance(recipient.getBalance().add(amount));

    accounts.save(sender);
    accounts.save(recipient);

    Txn t = new Txn();
    t.setSenderAccount(senderAcc);
    t.setRecipientAccount(recipientAcc);
    t.setAmount(amount);
    txns.save(t);
  }
}
