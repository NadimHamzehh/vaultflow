package com.example.securetransfer.auth;

import jakarta.validation.constraints.NotBlank;

public class AuthDtos {
  public static class LoginRequest {
    @NotBlank public String username;
    @NotBlank public String password;
  }
  public static class LoginResponse {
    public String token;
    public LoginResponse(String token){ this.token = token; }
  }
}
