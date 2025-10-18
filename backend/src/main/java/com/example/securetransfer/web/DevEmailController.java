// src/main/java/com/example/securetransfer/web/DevEmailController.java
package com.example.securetransfer.web;

import com.example.securetransfer.notifications.SecurityMailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dev/email")
@CrossOrigin // optional; useful when calling from your frontend
public class DevEmailController {

  private static final Logger log = LoggerFactory.getLogger(DevEmailController.class);
  private final SecurityMailService mail;

  public DevEmailController(SecurityMailService mail) {
    this.mail = mail;
  }

  @GetMapping("/test")
  public String test(@RequestParam("to") String to) {
    log.info("DEV: sending test email to {}", to);
    mail.send(to, "VaultFlow test email", "If you got this, SMTP is working.");
    return "sent (check logs and inbox)";
  }
}
