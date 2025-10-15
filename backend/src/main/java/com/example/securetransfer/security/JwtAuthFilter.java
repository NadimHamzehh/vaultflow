
package com.example.securetransfer.security;

import com.example.securetransfer.repo.UserRepository;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.Arrays;
import java.util.stream.Collectors;

public class JwtAuthFilter extends OncePerRequestFilter {
  private final JwtService jwtService;
  private final UserRepository userRepository;

  public JwtAuthFilter(JwtService jwtService, UserRepository userRepository){
    this.jwtService = jwtService; this.userRepository = userRepository;
  }

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (StringUtils.hasText(header) && header.startsWith("Bearer ")) {
      String token = header.substring(7);
      try {
        String username = jwtService.extractUsername(token);
        var user = userRepository.findByUsername(username).orElse(null);
        if (user != null) {
          var auth = new UsernamePasswordAuthenticationToken(
            username, null,
            Arrays.stream(user.getRoles().split(","))
                  .map(String::trim)
                  .filter(s -> !s.isEmpty())
                  .map(r -> new SimpleGrantedAuthority("ROLE_"+r))
                  .collect(Collectors.toList())
          );
          SecurityContextHolder.getContext().setAuthentication(auth);
        }
      } catch (Exception ignored) {}
    }
    chain.doFilter(request, response);
  }
}
