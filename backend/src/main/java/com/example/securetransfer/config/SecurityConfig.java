// src/main/java/com/example/securetransfer/config/SecurityConfig.java
package com.example.securetransfer.config;

import com.example.securetransfer.repo.UserRepository;
import com.example.securetransfer.security.JwtAuthFilter;
import com.example.securetransfer.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Value("${vaultflow.cors.allowed-origins:http://localhost:4200}")
  private String allowedOrigins;

  @Bean
  PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

  @Bean
  UserDetailsService userDetailsService(UserRepository users) {
    return username -> users.findByUsername(username)
      .map(u -> org.springframework.security.core.userdetails.User
        .withUsername(u.getUsername())
        .password(u.getPassword())
        .roles("USER")
        .build())
      .orElseThrow(() -> new UsernameNotFoundException("User not found"));
  }

  @Bean
  AuthenticationManager authenticationManager(UserDetailsService uds, PasswordEncoder enc) {
    var provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(uds);
    provider.setPasswordEncoder(enc);
    return new ProviderManager(provider);
  }

  @Bean
  JwtAuthFilter jwtAuthFilter(JwtService jwtService, UserRepository users) {
    return new JwtAuthFilter(jwtService, users);
  }

  @Bean
  CorsConfigurationSource corsConfigurationSource() {
    var cfg = new CorsConfiguration();
    List<String> origins = Arrays.stream(allowedOrigins.split(","))
      .map(String::trim)
      .filter(s -> !s.isBlank())
      .collect(Collectors.toList());
    cfg.setAllowedOrigins(origins);
    cfg.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    cfg.setAllowedHeaders(List.of(
      "Authorization",
      "Content-Type",
      "X-Idempotency-Key"
    ));
    cfg.setExposedHeaders(List.of("Authorization"));
    cfg.setAllowCredentials(true);

    var src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/**", cfg);
    return src;
  }

  /** Health endpoint (no auth, highest priority). */
  @Bean @Order(0)
  SecurityFilterChain actuatorChain(HttpSecurity http) throws Exception {
    return http
      .securityMatcher("/actuator/health")
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
      .build();
  }

  /** API security (JWT, stateless). */
  @Bean @Order(1)
  SecurityFilterChain apiChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter) throws Exception {
    return http
      .securityMatcher("/api/**")
      .csrf(csrf -> csrf.disable())
      .cors(Customizer.withDefaults())
      .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
      .authorizeHttpRequests(auth -> auth
        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

        // Public auth endpoints
        .requestMatchers(HttpMethod.POST,
          "/api/auth/login",
          "/api/auth/register",
          "/api/auth/2fa/**"
        ).permitAll()

        // ✅ Public dev/test email endpoints (so you can hit them in the browser)
        .requestMatchers("/api/dev/**").permitAll()

        // Admin area
        .requestMatchers("/api/admin/**").hasRole("ADMIN")

        // Everything else requires a valid access token
        .anyRequest().hasAnyRole("USER","ADMIN")
      )
      .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
      .build();
  }
}
