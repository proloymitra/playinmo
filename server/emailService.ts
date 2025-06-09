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

/**
 * Send welcome email to new users
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.error('SENDGRID_API_KEY not configured');
    return false;
  }

  try {
    const msg = {
      to: email,
      from: 'welcome@playinmo.com',
      subject: 'Welcome to PlayinMO - Your Web Gaming Adventure Begins!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <div style="padding: 40px 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">
              Welcome to Playin<span style="color: #ffd700;">MO</span>!
            </h1>
            <p style="font-size: 18px; margin: 20px 0;">Your web gaming destination for AI-powered games</p>
          </div>
          
          <div style="background: white; color: #333; padding: 40px 30px;">
            <h2 style="color: #667eea; margin-top: 0;">Hi ${username}!</h2>
            
            <p>Thank you for joining PlayinMO! We're excited to have you as part of our gaming community.</p>
            
            <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #667eea; margin-top: 0;">What's waiting for you:</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>🎮 Hundreds of browser games - no downloads needed</li>
                <li>🏆 Achievement system to track your gaming progress</li>
                <li>🎁 Rewards shop with exclusive items</li>
                <li>🏅 Leaderboards to compete with other players</li>
                <li>💬 Community chat to connect with fellow gamers</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://playinmo.com" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        font-weight: bold;
                        display: inline-block;">
                Start Playing Now
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h4 style="color: #856404; margin: 0 0 10px 0;">🎯 Pro Tip:</h4>
              <p style="margin: 0; color: #856404;">
                Complete achievements to earn points and unlock exclusive rewards in our shop!
              </p>
            </div>
            
            <p>If you have any questions or need help getting started, feel free to reach out to our support team.</p>
            
            <p>Happy gaming!</p>
            <p><strong>The PlayinMO Team</strong></p>
          </div>
          
          <div style="background: #2c3e50; padding: 20px 30px; text-align: center; font-size: 12px;">
            <p style="margin: 0; color: #bdc3c7;">
              You're receiving this email because you created an account at PlayinMO.
            </p>
            <p style="margin: 10px 0 0 0; color: #bdc3c7;">
              PlayinMO - Your Web Gaming Destination
            </p>
            
            <!-- Email tracking pixel -->
            <img src="https://playinmo.com/api/email/track-open?email=${encodeURIComponent(email)}" 
                 width="1" height="1" style="display: none;" alt="">
          </div>
        </div>
      `,
    };

    await mailService.send(msg);
    console.log('Welcome email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}