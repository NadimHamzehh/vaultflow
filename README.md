# VaultFlow — Secure Funds Transfer (Angular + Spring Boot)

A secure demo app for authenticated funds transfers. Users log in, view balance, and transfer funds to valid recipients. Backend enforces stateless JWT auth, BCrypt password hashing, validated DTOs, and atomic debit/credit in a single transaction. Includes optional 2FA, rate limiting, and basic admin views.

## Live Demo
- **Frontend (Render)**: https://<your-fe>.onrender.com
- **Backend API (Render)**: https://<your-be>.onrender.com
- **Database (Supabase)**: PostgreSQL (connection via env vars)

## Sample Credentials
Users:
- ibc1@gmail.com / `Ibc123!` — ACCT NB : ACCT230975 — balance 1000.00
- ibc2@gmail.com / `Ibc321!` — ACCT NB : ACCT683143 — balance 500.00
Admin:
- admin@gmail.com / `admin123` — Acct NB: admin#

## Tech Stack
- **Frontend**: Angular 20, Material, Http Interceptor, Route Guards
- **Backend**: Spring Boot 3 (Web, Security, Validation, Data JPA, Actuator), JJWT
- **DB**: PostgreSQL (Supabase)
- **Extras**: Bucket4J (rate limit), Caffeine, optional TOTP 2FA , FAQ Chatbot , CSV/PDF/OCR download , Change Password , Admin Panel , Charts , Transaction History . 

## API Endpoints
- `POST /api/auth/login` → `{ token }`
- `GET  /api/me/account` → `{ username, accountNumber, balance }`
- `GET  /api/me/transactions` → `[ { id, senderAccount, recipientAccount, amount, createdAt }, ... ]`
- `POST /api/transfers` → `{ recipientAccountNumber, amount }` (JWT required)
- `GET  /actuator/health` → health

## Security Notes
- Passwords stored BCrypt-hashed.
- JWT (HS256) with issuer + expiration; stateless; Authorization: Bearer.
- CSRF disabled for API (stateless); CORS restricted to FE origin via env.
- Transfer is atomic with pessimistic locks and server-side validation.

## Local Dev
```bash
# Backend
cd backend
./mvnw spring-boot:run

# Frontend
cd frontend
npm ci
npm run start

#testing procedure
-register a new user, log in, note your account number/balance on Overview
-click the “?” support bubble and ask “when do you close” and “how do I transfer money” 
-log in as ibc1@gmail.com and transfer money to ibc2@gmail.com (ACCT nb should be retrieved inside the account ) 
-check transaction history of both . (can be downloaded as CSV , PDF    )
-check the "account" page .
-go to "Security" to enable 2FA by scanning the QR code in Google Authenticator and confirming the 6-digit code, sign out and sign back in to experience the OTP flow 
-open "Account" to change password, sign out, and sign in again to verify; 
-optionally confirm backend health at GET /actuator/health.
-Finally , u can log into the admin account and check the different charts and transfer money as an admin to any account with the amount of money needed . 
#(Personalized emails will be sent to users when enabling 2FA and changing password for extra security , in case they are not received , they are definitely fetched but might be blocked by gmail rules and regulations (no verified domain))
#(note that due to using free render plan , changing passwords and 2fa enabling might load for too long , but it still saves and works perfectly regardless !)
