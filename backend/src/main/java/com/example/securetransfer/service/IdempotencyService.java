// src/main/java/com/example/securetransfer/service/IdempotencyService.java
package com.example.securetransfer.service;

import java.util.Map;

/**
 * Optional idempotency store for transfer requests.
 * If no bean implements this interface, TransferController proceeds without dedupe.
 */
public interface IdempotencyService {

  /**
   * Return a previously materialized response for the given key, or null if not found.
   */
  Map<String, Object> lookup(String key);

  /**
   * Store the materialized response for this key.
   */
  void remember(String key, Map<String, Object> response);
}
