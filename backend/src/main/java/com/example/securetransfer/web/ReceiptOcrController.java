package com.example.securetransfer.web;

import javax.imageio.ImageIO; // ✅ correct import for Spring Boot + Java 17+
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptOcrController {

  @PostMapping(value="/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('USER','ADMIN')")
  public ResponseEntity<?> ocr(@RequestParam("file") MultipartFile file) {
    try (InputStream in = file.getInputStream()) {
      BufferedImage img = ImageIO.read(in);
      if (img == null)
        return ResponseEntity.badRequest().body(Map.of("error", "Unsupported image"));

      Tesseract t = new Tesseract();
      t.setLanguage("eng");
      String text = t.doOCR(img);

      String merchant = firstMatch(text, "(?im)^(?:merchant|store|shop)[:\\s]+(.+)$");
      if (merchant == null) merchant = firstNonEmptyLine(text);

      String amountStr = lastMatch(text, "(?i)\\$?\\s*(\\d{1,5}[\\.,]\\d{2})");
      BigDecimal amount = amountStr != null
          ? new BigDecimal(amountStr.replace(",", ".").replace("$", "").trim())
          : null;

      LocalDate date = tryDate(text);

      return ResponseEntity.ok(Map.of(
          "merchant", merchant,
          "amount", amount,
          "date", date != null ? date.toString() : null,
          "raw", text
      ));
    } catch (UnsatisfiedLinkError | NoClassDefFoundError e) {
      return ResponseEntity.status(503).body(Map.of(
          "error", "OCR engine not available. Install Tesseract.",
          "details", e.getClass().getSimpleName()
      ));
    } catch (TesseractException te) {
      return ResponseEntity.badRequest().body(Map.of("error", "OCR failed", "details", te.getMessage()));
    } catch (Exception e) {
      return ResponseEntity.internalServerError().body(Map.of("error", "Server error", "details", e.getMessage()));
    }
  }

  private static String firstMatch(String text, String regex) {
    Matcher m = Pattern.compile(regex).matcher(text);
    return m.find() ? m.group(1).trim() : null;
  }

  private static String lastMatch(String text, String regex) {
    Matcher m = Pattern.compile(regex).matcher(text);
    String last = null;
    while (m.find()) last = m.group(1);
    return last != null ? last.trim() : null;
  }

  private static String firstNonEmptyLine(String text) {
    for (String ln : text.split("\\R")) {
      if (ln != null && !ln.isBlank() && ln.length() > 2) return ln.trim();
    }
    return null;
  }

  private static LocalDate tryDate(String text) {
    String[] patterns = {
        "(?<!\\d)(\\d{4}-\\d{2}-\\d{2})(?!\\d)",
        "(?<!\\d)(\\d{2}/\\d{2}/\\d{4})(?!\\d)",
        "(?<!\\d)(\\d{2}-\\d{2}-\\d{4})(?!\\d)"
    };
    DateTimeFormatter[] fmts = {
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy")
    };
    for (int i = 0; i < patterns.length; i++) {
      Matcher m = Pattern.compile(patterns[i]).matcher(text);
      if (m.find()) {
        try { return LocalDate.parse(m.group(1), fmts[i]); } catch (Exception ignored) {}
      }
    }
    return null;
  }
}
