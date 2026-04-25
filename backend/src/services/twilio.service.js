import twilio from 'twilio';
import { AppError } from '../middleware/errorHandler.js';

const shouldBypassSms = () => process.env.SKIP_SMS === 'true';

export const sendSmsOtp = async (phoneNumber, otp) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error(' Twilio credentials not configured');
      if (shouldBypassSms()) {
        console.warn(' Dev Mode: Twilio credentials missing. Simulating SMS send.');
        console.log(` [DEV VERIFICATION] OTP for ${phoneNumber}: ${otp}`);
        return { success: true, messageId: 'dev-mock-id', timestamp: new Date() };
      }
      throw new AppError('Twilio credentials not configured', 500);
    }

    if (!process.env.TWILIO_PHONE_NUMBER) {
      console.error(' TWILIO_PHONE_NUMBER not configured');
      if (shouldBypassSms()) {
        console.warn(' Dev Mode: Twilio credentials missing. Simulating SMS send.');
        console.log(` [DEV VERIFICATION] OTP for ${phoneNumber}: ${otp}`);
        return { success: true, messageId: 'dev-mock-id', timestamp: new Date() };
      }
      throw new AppError('Twilio phone number not configured', 500);
    }

    console.log(`📱 Sending SMS OTP to: ${phoneNumber}`);
    
    // In development mode, we can optionally bypass real SMS to save credits/avoid errors
    // or if the credentials are palpably "placeholder"
     if (process.env.NODE_ENV === 'development' &&
       (process.env.TWILIO_ACCOUNT_SID?.includes('placeholder') || shouldBypassSms())) {
        console.warn(' Dev Mode: Skipping actual Twilio SMS send.');
        console.log(` [DEV VERIFICATION] OTP for ${phoneNumber}: ${otp}`);
        return { success: true, messageId: 'dev-mock-id', timestamp: new Date() };
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    const message = await client.messages.create({
      body: `Your LocalSkillHub verification code is: ${otp}. This code expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(` SMS sent successfully. Message SID: ${message.sid}`);
    
    return {
      success: true,
      messageId: message.sid,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error(' Twilio SMS Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Error Status:', error.status);
    
    // Provide specific error messages for common Twilio errors
    let userMessage = 'Failed to send SMS OTP';
    
    if (error.code === 21211) {
      userMessage = 'Invalid phone number format. Please use international format (e.g., +12025551234)';
    } else if (error.code === 21214) {
      userMessage = 'Invalid phone number. The number does not appear to be a valid phone number.';
    } else if (error.code === 21608) {
      userMessage = 'Twilio trial account can only send to verified numbers. Verify this number in Twilio console first.';
    } else if (error.code === 21408) {
      userMessage = 'SMS destination is not enabled for your Twilio account/region. Enable international permissions in Twilio console.';
    } else if (error.code === 21606) {
      userMessage = 'Twilio cannot send from this number to the destination country/number type. Use a compatible sender number.';
    } else if (error.code === 21610) {
      userMessage = 'This destination has opted out of receiving SMS (STOP).';
    } else if (error.code === 30007) {
      userMessage = 'Message blocked by carrier filtering. Try a different destination number or message template.';
    } else if (error.code === 30008) {
      userMessage = 'Unknown delivery error from carrier. Please try again.';
    } else if (error.code === 20429) {
      userMessage = 'Twilio API rate limit reached. Please wait a moment and try again.';
    } else if (error.code === 63038) {
      userMessage = 'Twilio account exceeded daily SMS limit (24-hour rolling window). Wait for reset or request a limit increase from Twilio Support.';
    } else if (error.code === 20003) {
      userMessage = 'Twilio service temporarily unavailable. Please try again.';
    } else if (error.message?.includes('account')) {
      userMessage = 'Twilio account issue. Please check service status.';
    }

    // Explicit bypass only: never silently succeed on Twilio failures unless requested.
    if (shouldBypassSms()) {
      console.warn(' Dev Mode: Twilio API failed. Simulating successful SMS send.');
      console.log(` [DEV VERIFICATION] OTP for ${phoneNumber}: ${otp}`);
      return { success: true, messageId: 'dev-fallback-id', timestamp: new Date() };
    }

    const codeSuffix = error.code ? ` (Twilio code: ${error.code})` : '';
    throw new AppError(`${userMessage}${codeSuffix}`, error.status || 500);
  }
};

export default { sendSmsOtp };
