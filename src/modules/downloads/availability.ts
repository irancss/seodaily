import { downloadConfig, otpSecret } from "./config";
import { smsProvider } from "./sms";

/** Downloads need the switch, the OTP secret and a working SMS setup; otherwise they stay closed. */
export function downloadsAvailable() {
  return downloadConfig().enabled && Boolean(otpSecret()) && Boolean(smsProvider().provider);
}
