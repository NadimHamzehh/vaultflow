package com.example.securetransfer.security;

import org.springframework.stereotype.Service;

import dev.samstevens.totp.code.CodeGenerator;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.code.HashingAlgorithm;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.secret.SecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import dev.samstevens.totp.time.TimeProvider;
import dev.samstevens.totp.qr.QrData;
import dev.samstevens.totp.qr.QrGenerator;
import dev.samstevens.totp.qr.ZxingPngQrGenerator;
import dev.samstevens.totp.exceptions.QrGenerationException;

import java.util.Base64;

@Service
public class TotpService {

    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final TimeProvider timeProvider = new SystemTimeProvider();
    private final CodeGenerator codeGenerator = new DefaultCodeGenerator(); // 6 digits, SHA1 default
    private final CodeVerifier verifier = new DefaultCodeVerifier(codeGenerator, timeProvider);
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();

    /** Create a new Base32 secret to store for the user. */
    public String generateSecret() {
        return secretGenerator.generate();
    }

    /** Validate a TOTP code against the user's secret. */
    public boolean verifyCode(String secret, String code) {
        if (secret == null || secret.isBlank() || code == null || code.isBlank()) return false;
        return verifier.isValidCode(secret, code.trim());
    }

    /** Return a data: URI for a PNG QR you can embed directly in <img src="..."> */
    public String qrDataUri(String issuer, String accountName, String secret) {
        QrData data = new QrData.Builder()
                .label(accountName)
                .secret(secret)
                .issuer(issuer)
                .algorithm(HashingAlgorithm.SHA1)
                .digits(6)
                .period(30)
                .build();
        try {
            byte[] png = qrGenerator.generate(data);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(png);
        } catch (QrGenerationException e) {
            throw new IllegalStateException("Failed to generate TOTP QR", e);
        }
    }
}
