# SMTP Setup Guide for Password Recovery Emails

## Using Gmail (Recommended for Development & Production)

### Step 1: Enable 2-Factor Authentication on Gmail
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"

### Step 2: Create an App Password
1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Find "App passwords" (only appears if 2FA is enabled)
3. Select "Mail" and "Windows Computer" (or your device)
4. Google will generate a 16-character password

### Step 3: Update `.env` file
In `backend/.env`, fill in:
```
SMTP_USER=your-email@gmail.com
SMTP_PASS=the-16-char-app-password-from-step-2
```

Example:
```
SMTP_USER=john@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

### Step 4: Test It
Restart the backend server and try the password recovery flow:
1. Go to `/forgot-password`
2. Enter your email
3. Check your inbox for the reset link
4. The email will be from `your-email@gmail.com` (or your custom `MAIL_FROM` address)

## For Production Deployment

When you deploy online:
1. Use the same Gmail setup (it works worldwide)
2. OR switch to a service like SendGrid, Mailgun, or AWS SES
3. Update the `.env` variables on your production server with the correct credentials
4. The code doesn't change—only the `.env` values

## Alternative: SendGrid (Production-Ready)

If you want a professional email service:
1. Sign up at [sendgrid.com](https://sendgrid.com) (free tier available)
2. Create an API key
3. Update `.env`:
```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Troubleshooting

**"Email transport is not configured"** - Check that all 4 SMTP variables are filled in `.env`

**"Invalid credentials"** - Make sure you used the 16-char App Password from Gmail, not your regular password

**Emails not arriving** - Check the backend logs for the reset link preview URL
