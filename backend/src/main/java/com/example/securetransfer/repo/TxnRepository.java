package com.example.securetransfer.repo;

import com.example.securetransfer.domain.Txn;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TxnRepository extends JpaRepository<Txn,Long> {
  List<Txn> findBySenderAccountOrRecipientAccountOrderByCreatedAtDesc(String a, String b);
}
