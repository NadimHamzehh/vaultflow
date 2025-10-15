package com.example.securetransfer.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterDtos {
  public static class RegisterRequest {
    @NotBlank @Size(min=3, max=32) public String username;
    @NotBlank @Size(min=6, max=64) public String password;
    @Pattern(regexp="^\\d{1,10}(\\.\\d{1,2})?$", message="Invalid initialDeposit")
    public String initialDeposit; // optional
  }
  public static class RegisterResponse {
    public String message;
    public RegisterResponse(String m){ this.message=m; }
  }
}
