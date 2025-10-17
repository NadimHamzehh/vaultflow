package com.example.securetransfer.web;

import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.UserRepository;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Admin-only API.
 * Endpoints:
 *  - GET /api/admin/accounts?page=0&size=10
 *  - GET /api/admin/metrics?from=YYYY-MM-DD&to=YYYY-MM-DD
 *
 * Make sure SecurityConfig has:
 *   .requestMatchers("/api/admin/**").hasRole("ADMIN")
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

  // ----- DTOs -----

  public record AccountSummary(Long userId, String username, String accountNumber, String balance) {}

  public record AdminMetricsDto(
      double totalTransferred,
      int newUsers,
      int unusualDays,
      List<Double> dailyTransfers
  ) {}

  // ----- Deps -----

  private final UserRepository users;
  private final AccountRepository accounts;
  private final JdbcTemplate jdbc;

  public AdminController(UserRepository users, AccountRepository accounts, JdbcTemplate jdbc) {
    this.users = users;
    this.accounts = accounts;
    this.jdbc = jdbc;
  }

  // ===== Accounts (paged) =====
  @GetMapping("/accounts")
  public Page<AccountSummary> list(@RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "10") int size) {
    var pr = PageRequest.of(page, size, Sort.by("id").ascending());
    var pageEntities = accounts.findAll(pr);

    List<AccountSummary> mapped = pageEntities.getContent().stream().map(acc ->
        new AccountSummary(
            acc.getUser().getId(),
            acc.getUser().getUsername(),
            acc.getAccountNumber(),
            // ensure consistent string for BigDecimal balance
            (acc.getBalance() != null ? acc.getBalance() : BigDecimal.ZERO).toPlainString()
        )
    ).toList();

    return new PageImpl<>(mapped, pr, pageEntities.getTotalElements());
  }

  // ===== Metrics for admin dashboard =====
  /**
   * Example:
   *   GET /api/admin/metrics?from=2025-10-01&to=2025-10-31
   * Notes:
   *   - 'from' and 'to' are inclusive.
   */
  @GetMapping("/metrics")
  public AdminMetricsDto metrics(
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
  ) {
    if (from == null || to == null || to.isBefore(from)) {
      // basic guard; client should pass a valid month range
      return new AdminMetricsDto(0.0, 0, 0, List.of());
    }

    // total transferred in range (txns.created_at assumed timestamptz)
    Double total = jdbc.queryForObject(
        "SELECT COALESCE(SUM(amount), 0) " +
            "FROM txns " +
            "WHERE created_at::date BETWEEN ? AND ?",
        Double.class, Date.valueOf(from), Date.valueOf(to)
    );
    if (total == null) total = 0.0;

    // Build a zero-filled series covering every day in [from..to]
    int days = (int) ChronoUnit.DAYS.between(from, to) + 1; // inclusive
    List<Double> series = new ArrayList<>(Collections.nCopies(days, 0.0));

    // fill daily sums
    jdbc.query(
        "SELECT created_at::date AS d, COALESCE(SUM(amount),0) AS s " +
            "FROM txns " +
            "WHERE created_at::date BETWEEN ? AND ? " +
            "GROUP BY d ORDER BY d",
        rs -> {
          LocalDate d = rs.getDate("d").toLocalDate();
          double s = rs.getDouble("s");
          int idx = (int) ChronoUnit.DAYS.between(from, d);
          if (idx >= 0 && idx < series.size()) series.set(idx, s);
        },
        Date.valueOf(from), Date.valueOf(to)
    );

    // count of new users; tolerate missing 'created_at' column
    Integer newUsers = 0;
    try {
      newUsers = jdbc.queryForObject(
          "SELECT COUNT(*) FROM users WHERE created_at::date BETWEEN ? AND ?",
          Integer.class, Date.valueOf(from), Date.valueOf(to)
      );
    } catch (Exception ignore) {
      // If 'users.created_at' doesn't exist, return 0 without failing the endpoint.
      newUsers = 0;
    }
    if (newUsers == null) newUsers = 0;

    // simple “unusual activity”: number of days above 95th percentile
    double p95 = percentile(series, 0.95);
    int unusualDays = 0;
    for (double v : series) if (v > p95) unusualDays++;

    return new AdminMetricsDto(total, newUsers, unusualDays, series);
  }

  // ----- helpers -----

  private static double percentile(List<Double> values, double p) {
    if (values == null || values.isEmpty()) return 0.0;
    List<Double> sorted = new ArrayList<>(values);
    sorted.sort(Double::compareTo);
    int idx = (int) Math.floor(p * (sorted.size() - 1));
    idx = Math.max(0, Math.min(idx, sorted.size() - 1));
    return sorted.get(idx);
  }
}
