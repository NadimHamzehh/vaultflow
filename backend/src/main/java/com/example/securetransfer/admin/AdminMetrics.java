package com.example.securetransfer.admin;

import java.util.List;

/** DTO returned by /api/admin/metrics */
public record AdminMetrics(
        double totalTransferred,
        int newUsers,
        int unusualActivity,
        List<Double> dailyTransfers
) {}
