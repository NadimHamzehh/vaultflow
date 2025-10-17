package com.example.securetransfer.web;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

public class SecurityUtil {
    public static Optional<String> currentUsername() {
        Authentication a = SecurityContextHolder.getContext().getAuthentication();
        if (a == null || a.getPrincipal() == null) return Optional.empty();
        return Optional.of(String.valueOf(a.getPrincipal()));
    }
}
