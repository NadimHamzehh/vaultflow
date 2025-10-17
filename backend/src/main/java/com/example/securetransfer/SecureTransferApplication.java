// src/main/java/com/example/securetransfer/SecureTransferApplication.java
package com.example.securetransfer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication
@ComponentScan(
    basePackages = "com.example.securetransfer",
    // Exclude everything under the legacy package to avoid bean clashes
    excludeFilters = @ComponentScan.Filter(
        type = FilterType.REGEX,
        pattern = "com\\.example\\.securetransfer\\.auth\\..*"
    )
)
public class SecureTransferApplication {
  public static void main(String[] args) {
    SpringApplication.run(SecureTransferApplication.class, args);
  }
}
