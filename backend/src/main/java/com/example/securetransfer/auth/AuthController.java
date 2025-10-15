package com.example.securetransfer.auth;

import com.example.securetransfer.domain.Account;
import com.example.securetransfer.domain.User;
import com.example.securetransfer.repo.AccountRepository;
import com.example.securetransfer.repo.UserRepository;
import com.example.securetransfer.ratelimit.RateLimiterService;
import com.example.securetransfer.security.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Random;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthenticationManager authManager;
  private final JwtService jwtService;
  private final UserRepository users;
  private final AccountRepository accounts;
  private final PasswordEncoder encoder;
  private final RateLimiterService limiter;
  private final Random rnd = new Random();

  public AuthController(AuthenticationManager am, JwtService jwt, UserRepository users,
                        AccountRepository accounts, PasswordEncoder enc, RateLimiterService lim) {
    this.authManager = am; this.jwtService = jwt; this.users = users;
    this.accounts = accounts; this.encoder = enc; this.limiter = lim;
  }

  @PostMapping("/login")
  public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest req, HttpServletRequest http) {
    String ip = http.getRemoteAddr();
    if (!limiter.tryLogin(ip)) throw new IllegalArgumentException("Too many login attempts. Try later.");
    authManager.authenticate(new UsernamePasswordAuthenticationToken(req.username, req.password));
    var u = users.findByUsername(req.username).orElseThrow();
    return new AuthDtos.LoginResponse(jwtService.generate(u.getUsername(), u.getRoles()));
  }

  @PostMapping("/register")
  public RegisterDtos.RegisterResponse register(@Valid @RequestBody RegisterDtos.RegisterRequest req) {
    users.findByUsername(req.username).ifPresent(u -> { throw new IllegalArgumentException("Username taken"); });
    var u = new User();
    u.setUsername(req.username);
    u.setPassword(encoder.encode(req.password));
    u.setRoles("USER");
    users.save(u);

    var a = new Account();
    a.setUser(u);
    a.setAccountNumber("ACCT" + (100000 + rnd.nextInt(900000)));
    a.setBalance(new BigDecimal((req.initialDeposit==null || req.initialDeposit.isBlank()) ? "0.00" : req.initialDeposit));
    accounts.save(a);

    return new RegisterDtos.RegisterResponse("Registered. You can now log in.");
  }
}

