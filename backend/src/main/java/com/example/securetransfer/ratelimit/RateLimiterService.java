package com.example.securetransfer.ratelimit;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Service
public class RateLimiterService {
  private final Cache<String, Bucket> buckets = Caffeine.newBuilder()
      .expireAfterAccess(30, TimeUnit.MINUTES).build();

  private final long loginPerMinute, loginBurst;
  private final long transferPerMinute, transferBurst;

  public RateLimiterService(
      @Value("${ratelimit.login.perMinute}") long loginPerMinute,
      @Value("${ratelimit.login.burst}") long loginBurst,
      @Value("${ratelimit.transfer.perMinute}") long transferPerMinute,
      @Value("${ratelimit.transfer.burst}") long transferBurst) {
    this.loginPerMinute = loginPerMinute;
    this.loginBurst = loginBurst;
    this.transferPerMinute = transferPerMinute;
    this.transferBurst = transferBurst;
  }

  private Bucket newBucket(long perMinute, long burst){
    Bandwidth limit = Bandwidth.classic(burst, Refill.greedy(perMinute, Duration.ofMinutes(1)));
    return Bucket.builder().addLimit(limit).build();
  }

  private Bucket resolve(String key, long perMinute, long burst){
    return buckets.asMap().computeIfAbsent(key, k -> newBucket(perMinute, burst));
  }

  public boolean tryLogin(String ip){
    return resolve("login:"+ip, loginPerMinute, loginBurst).tryConsume(1);
  }

  public boolean tryTransfer(String username){
    return resolve("transfer:"+username, transferPerMinute, transferBurst).tryConsume(1);
  }
}
