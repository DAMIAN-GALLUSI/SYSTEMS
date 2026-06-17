import nodemailer from 'nodemailer';

type PasswordResetEmailInput = {
  to: string;
  fullName: string;
  resetLink: string;
};

const hasSmtpConfiguration = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
);

type MailTransportContext = {
  transporter: nodemailer.Transporter;
  previewMode: boolean;
};

let transportContextPromise: Promise<MailTransportContext> | null = null;

async function getTransportContext(): Promise<MailTransportContext> {
  if (hasSmtpConfiguration) {
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      previewMode: false,
    };
  }

  if (!transportContextPromise) {
    transportContextPromise = nodemailer.createTestAccount().then((account) => ({
      transporter: nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass,
        },
      }),
      previewMode: true,
    }));
  }

  return transportContextPromise;
}

export async function sendPasswordResetEmail({ to, fullName, resetLink }: PasswordResetEmailInput) {
  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@localhost';

  try {
    const { transporter, previewMode } = await getTransportContext();
    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject: 'Password reset instructions',
      text: [
        `Hello ${fullName || 'there'},`,
        '',
        'We received a request to reset your password.',
        `Use this link to continue: ${resetLink}`,
        '',
        'If you did not request this, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #17342b;">
          <p>Hello ${fullName || 'there'},</p>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetLink}" style="color: #117a4f; font-weight: 700;">Reset your password</a></p>
          <p>If the button does not work, copy and paste this link:</p>
          <p>${resetLink}</p>
          <p>If you did not request this, you can ignore this email.</p>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;

    if (previewMode) {
      console.warn(`[password-reset] Preview email generated for ${to}: ${resetLink}`);
    }

    return {
      delivered: true,
      fallback: previewMode,
      previewUrl,
    };
  } catch (error) {
    console.warn(`[password-reset] Email delivery failed for ${to}. Reset link: ${resetLink}`);
    return { delivered: false, fallback: true, previewUrl: undefined };
  }
}