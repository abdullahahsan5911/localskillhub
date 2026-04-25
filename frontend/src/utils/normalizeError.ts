export function normalizeError(err: any): string {
  if (!err) return 'An unknown error occurred.';

  // Axios / API style
  const code = err?.response?.data?.code || err?.code;
  const apiMessage = err?.response?.data?.message;
  const msg = apiMessage || err?.message || String(err);

  if (code === 'EMAIL_NOT_VERIFIED') return 'Your email is not verified. Please check your inbox for the verification code.';
  if (code === 'ACCOUNT_BANNED') return 'Your account has been banned. Please contact support@localskillhub.com.';
  if (code === 'ACCOUNT_SUSPENDED') return 'Your account is suspended. Please try again later or contact support@localskillhub.com.';

  // Common developer-facing messages -> friendly
  if (/illegal arguments/i.test(msg) || /argument.*undefined/i.test(msg)) {
    return 'Invalid input. Please check your fields and try again.';
  }
  if (/credentials?/i.test(msg)) return 'Login failed. Please check your email and password.';
  if (/weak password/i.test(msg) || /password.*weak/i.test(msg)) return 'Your password is too weak. Choose a stronger password.';
  if (/network/i.test(msg)) return 'Network error. Please check your connection and try again.';

  // If the message looks like a technical dump (contains colons and braces) and is long, fallback to a generic message
  if (msg && /[:\{\}]/.test(msg) && msg.length > 80) return 'An unexpected error occurred. Please try again.';

  return String(msg);
}

export default normalizeError;
