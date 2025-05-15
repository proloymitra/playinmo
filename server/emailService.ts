import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid mail service
const mailService = new MailService();

// Check if SendGrid API key is available
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.warn('SENDGRID_API_KEY not found. Email functionality will not work.');
}

/**
 * Generate a 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Generate a random string for OTP validation
 */
export function generateSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get OTP expiry time (10 minutes from now)
 */
export function getOTPExpiry(): Date {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 10); // 10 minutes expiry
  return expiryTime;
}

/**
 * Send OTP email for admin CMS login
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('SendGrid API key missing');
      return false;
    }

    const msg = {
      to: email,
      from: 'noreply@playinmo.com', // Replace with your verified sender
      subject: 'Your PlayinMO CMS Login Code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6d28d9; text-align: center; margin-top: 20px;">PlayinMO CMS</h1>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2>Your Login Verification Code</h2>
            <p>Please use the following code to login to the PlayinMO CMS:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this code, please ignore this email or contact support.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px;">
            &copy; 2025 PlayinMO. All rights reserved.
          </div>
        </div>
      `,
    };

    await mailService.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}