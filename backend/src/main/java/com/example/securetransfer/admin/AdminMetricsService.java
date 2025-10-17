package com.example.securetransfer.admin;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class AdminMetricsService {

    private final JdbcTemplate jdbc;

    public AdminMetricsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public AdminMetrics forRange(LocalDate from, LocalDate to) {
        // total transferred
        Double total = jdbc.queryForObject(
                "SELECT COALESCE(SUM(amount),0) FROM txns WHERE created_at::date BETWEEN ? AND ?",
                Double.class, Date.valueOf(from), Date.valueOf(to)
        );
        if (total == null) total = 0.0;

        // daily series init (one value per day of 'to' month)
        int days = to.getDayOfMonth();
        List<Double> series = new ArrayList<>(days);
        for (int i = 1; i <= days; i++) series.add(0.0);

        jdbc.query(
                """
                SELECT created_at::date AS d, COALESCE(SUM(amount),0) AS s
                FROM txns
                WHERE created_at::date BETWEEN ? AND ?
                GROUP BY d ORDER BY d
                """,
                rs -> {
                    LocalDate d = rs.getDate("d").toLocalDate();
                    double s = rs.getDouble("s");
                    int idx = d.getDayOfMonth() - 1;
                    if (idx >= 0 && idx < series.size()) series.set(idx, s);
                },
                Date.valueOf(from), Date.valueOf(to)
        );

        // new users (if users.created_at exists)
        Integer newUsers = 0;
        try {
            newUsers = jdbc.queryForObject(
                    "SELECT COUNT(*) FROM users WHERE created_at::date BETWEEN ? AND ?",
                    Integer.class, Date.valueOf(from), Date.valueOf(to)
            );
        } catch (Exception ignored) { /* column may not exist */ }
        if (newUsers == null) newUsers = 0;

        // unusual activity: days above 95th percentile of the series
        double p95 = percentile(series, 0.95);
        int unusual = 0;
        for (double v : series) if (v > p95) unusual++;

        return new AdminMetrics(total, newUsers, unusual, series);
    }

    private static double percentile(List<Double> values, double p) {
        ArrayList<Double> sorted = new ArrayList<>(values);
        sorted.sort(Double::compare);
        if (sorted.isEmpty()) return 0.0;
        int idx = (int) Math.floor(p * (sorted.size() - 1));
        idx = Math.max(0, Math.min(idx, sorted.size() - 1));
        return sorted.get(idx);
    }
}
