package com.example.securetransfer.web;

import com.example.securetransfer.domain.Txn;
import com.example.securetransfer.repo.TxnRepository;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.List;

@RestController
@RequestMapping("/api/admin/statements")
@PreAuthorize("hasRole('ADMIN')")
public class AdminStatementController {

  private final TxnRepository txns;
  public AdminStatementController(TxnRepository txns) { this.txns = txns; }

  @GetMapping("/ping") public String ping() { return "statements-ok"; }

  // ===== CSV (two routes: path + query) =====

  @GetMapping(value = "/{year}/{month}.csv", produces = "text/csv")
  public ResponseEntity<byte[]> csvPath(@PathVariable int year, @PathVariable int month) {
    return csvInternal(year, month);
  }

  @GetMapping(value = "/csv", produces = "text/csv")
  public ResponseEntity<byte[]> csvQuery(@RequestParam int year, @RequestParam int month) {
    return csvInternal(year, month);
  }

  private ResponseEntity<byte[]> csvInternal(int year, int month) {
    if (!validYm(year, month)) {
      String err = "error,invalid year/month\n";
      return ResponseEntity.badRequest()
          .contentType(MediaType.valueOf("text/csv"))
          .body(err.getBytes(StandardCharsets.UTF_8));
    }
    Range range = monthRange(year, month);
    List<Txn> rows = txns.findByCreatedAtBetweenOrderByCreatedAtAsc(range.start, range.end);

    StringBuilder sb = new StringBuilder();
    sb.append("date,fromAccount,toAccount,amount,reference\n");
    for (Txn t : rows) {
      String date = t.getCreatedAt() == null ? "" : t.getCreatedAt().toString();
      String from = safe(t.getSenderAccount());
      String to   = safe(t.getRecipientAccount());
      String amt  = t.getAmount() == null ? "0.00"
                    : t.getAmount().setScale(2, RoundingMode.HALF_UP).toString();
      String ref  = String.valueOf(t.getId() == null ? "" : t.getId());
      sb.append(escapeCsv(date)).append(',')
        .append(escapeCsv(from)).append(',')
        .append(escapeCsv(to)).append(',')
        .append(escapeCsv(amt)).append(',')
        .append(escapeCsv(ref)).append('\n');
    }

    byte[] data = sb.toString().getBytes(StandardCharsets.UTF_8);
    String filename = "statement-%d-%02d.csv".formatted(year, month);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .contentType(MediaType.valueOf("text/csv"))
        .body(data);
  }

  // ===== PDF (two routes: POST body + GET query) =====

  public record PdfReq(int year, int month, String chartPngDataUrl) {}

  @PostMapping(value = "/pdf", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<byte[]> pdfPost(@RequestBody PdfReq req) {
    return pdfInternal(req.year, req.month, req.chartPngDataUrl);
  }

  @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
  public ResponseEntity<byte[]> pdfGet(@RequestParam int year,
                                       @RequestParam int month,
                                       @RequestParam(required = false) String chartPngDataUrl) {
    return pdfInternal(year, month, chartPngDataUrl);
  }

  private ResponseEntity<byte[]> pdfInternal(int year, int month, String chartPngDataUrl) {
    String filename = "statement-%d-%02d.pdf".formatted(year, month);
    if (!validYm(year, month)) {
      return okPdf(tinyPdf("Invalid period: " + year + "-" + String.format("%02d", month)), filename);
    }

    Range range = monthRange(year, month);
    List<Txn> rows = txns.findByCreatedAtBetweenOrderByCreatedAtAsc(range.start, range.end);

    try (PDDocument doc = new PDDocument()) {
      PDPage page = new PDPage(PDRectangle.LETTER);
      doc.addPage(page);

      var FONT_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
      var FONT_REG  = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

      try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
        float margin = 50;
        float width = page.getMediaBox().getWidth();
        float y = page.getMediaBox().getHeight() - margin;

        // Title
        cs.beginText(); cs.setFont(FONT_BOLD, 18); cs.newLineAtOffset(margin, y);
        cs.showText("VaultFlow — Monthly Statement"); cs.endText(); y -= 24;

        // Period
        cs.beginText(); cs.setFont(FONT_REG, 12); cs.newLineAtOffset(margin, y);
        cs.showText("Period: " + year + "-" + String.format("%02d", month)); cs.endText(); y -= 18;

        // Total
        var total = rows.stream()
            .map(t -> t.getAmount() == null ? java.math.BigDecimal.ZERO : t.getAmount())
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);
        cs.beginText(); cs.setFont(FONT_REG, 12); cs.newLineAtOffset(margin, y);
        cs.showText("Total transferred: $" + total); cs.endText(); y -= 20;

        // Optional chart
        if (chartPngDataUrl != null && chartPngDataUrl.startsWith("data:image")) {
          try {
            byte[] img = decodeDataUrl(chartPngDataUrl);
            PDImageXObject pdImg = PDImageXObject.createFromByteArray(doc, img, "chart");
            float imgWidth = width - 2 * margin;
            float ratio = imgWidth / pdImg.getWidth();
            float imgHeight = pdImg.getHeight() * ratio;
            float imgY = Math.max(200, y - imgHeight);
            cs.drawImage(pdImg, margin, imgY, imgWidth, imgHeight);
            y = imgY - 16;
          } catch (Exception ignore) {}
        }

        // Header
        cs.beginText(); cs.setFont(FONT_BOLD, 11); cs.newLineAtOffset(margin, y);
        cs.showText("Date          FromAcct     ToAcct       Amount       Ref");
        cs.endText(); y -= 14;

        // Rows (limit ~20)
        int count = 0;
        for (Txn t : rows) {
          if (count++ >= 20 || y < 60) break;
          String date = t.getCreatedAt() == null ? "" : t.getCreatedAt().toString();
          if (date.length() > 10) date = date.substring(0, 10);
          String from = safe(t.getSenderAccount());
          String to   = safe(t.getRecipientAccount());
          String amt  = t.getAmount() == null ? "0.00" : t.getAmount().setScale(2, RoundingMode.HALF_UP).toString();
          String ref  = String.valueOf(t.getId() == null ? "" : t.getId());

          String line = String.format("%-12s %-12s %-12s $%-10s %s", date, from, to, amt, trim(ref, 28));
          cs.beginText(); cs.setFont(FONT_REG, 10); cs.newLineAtOffset(margin, y);
          cs.showText(line); cs.endText(); y -= 12;
        }
      }

      ByteArrayOutputStream out = new ByteArrayOutputStream();
      doc.save(out);
      return okPdf(out.toByteArray(), filename);

    } catch (Exception e) {
      return okPdf(tinyPdf("Export error for " + year + "-" + String.format("%02d", month)), filename);
    }
  }

  // ===== helpers =====

  private static boolean validYm(int year, int month) {
    return year >= 2000 && year <= 2100 && month >= 1 && month <= 12;
  }

  private static ResponseEntity<byte[]> okPdf(byte[] pdf, String filename) {
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdf);
  }

  private static String safe(String s) { return s == null ? "" : s; }

  private static String escapeCsv(String s) {
    if (s == null) return "";
    boolean needQuote = s.contains(",") || s.contains("\"") || s.contains("\n");
    if (!needQuote) return s;
    return "\"" + s.replace("\"", "\"\"") + "\"";
  }

  private static String trim(String s, int max) {
    if (s == null) return "";
    return s.length() > max ? s.substring(0, max - 1) + "…" : s;
  }

  private static byte[] decodeDataUrl(String dataUrl) {
    int comma = dataUrl.indexOf(',');
    String b64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
    return Base64.getDecoder().decode(b64);
  }

  // Use OffsetDateTime to MATCH repository signature
  private record Range(OffsetDateTime start, OffsetDateTime end) {}

  private static Range monthRange(int year, int month) {
    // Start: first day 00:00:00Z
    OffsetDateTime start = OffsetDateTime.of(year, month, 1, 0, 0, 0, 0, ZoneOffset.UTC);
    // End (inclusive): last moment of the month
    OffsetDateTime endInclusive = start.plusMonths(1).minusNanos(1);
    return new Range(start, endInclusive);
  }

  /** Minimal single-line PDF (PDFBox 3). */
  private static byte[] tinyPdf(String msg) {
    try (PDDocument doc = new PDDocument()) {
      PDPage page = new PDPage(PDRectangle.LETTER);
      doc.addPage(page);
      var FONT_REG = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
      try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
        cs.beginText();
        cs.setFont(FONT_REG, 12);
        cs.newLineAtOffset(50, page.getMediaBox().getHeight() - 50);
        cs.showText(msg == null ? "" : msg);
        cs.endText();
      }
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      doc.save(out);
      return out.toByteArray();
    } catch (Exception e) {
      return new byte[0];
    }
  }
}
