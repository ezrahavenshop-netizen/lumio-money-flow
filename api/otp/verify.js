import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const OTP_EMAIL = process.env.OTP_RECIPIENT_EMAIL || "crissimon44@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { otp } = req.body;
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ error: "Invalid OTP format" });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("transfer_otps")
      .select("id, expires_at")
      .eq("email", OTP_EMAIL)
      .eq("otp", otp)
      .eq("used", false)
      .gt("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Supabase query error:", error);
      return res.status(500).json({ error: "Verification failed" });
    }

    if (!data || data.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    await supabase
      .from("transfer_otps")
      .update({ used: true })
      .eq("id", data[0].id);

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
