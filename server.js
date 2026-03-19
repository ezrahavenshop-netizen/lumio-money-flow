import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

const OTP_EMAIL = process.env.OTP_RECIPIENT_EMAIL || "crissimon44@gmail.com";
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_PASS) {
  console.warn("⚠️  GMAIL_USER or GMAIL_APP_PASSWORD is not set — OTP emails will fail.");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_PASS,
  },
});

// POST /api/otp/send
app.post("/api/otp/send", async (req, res) => {
  try {
    if (!GMAIL_USER || !GMAIL_PASS) {
      return res.status(500).json({ error: "Email service not configured. GMAIL_USER and GMAIL_APP_PASSWORD must be set." });
    }

    const recipientEmail = req.body.email || OTP_EMAIL;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();

    // Invalidate any existing unused OTPs for this email
    await supabase
      .from("transfer_otps")
      .update({ used: true })
      .eq("email", recipientEmail)
      .eq("used", false);

    // Insert new OTP
    const { error: dbError } = await supabase.from("transfer_otps").insert({
      email: recipientEmail,
      otp,
      expires_at: expiresAt,
      used: false,
    });

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return res.status(500).json({ error: "Failed to store OTP", detail: dbError.message });
    }

    // Send via Gmail
    await transporter.sendMail({
      from: `"Lumio Bank" <${GMAIL_USER}>`,
      to: recipientEmail,
      subject: "Your Lumio Transfer Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: #0A1628; padding: 32px 40px;">
            <h1 style="font-family: Georgia, serif; color: #C9963A; margin: 0; font-size: 24px; letter-spacing: -0.5px;">Lumio</h1>
          </div>
          <div style="padding: 40px;">
            <h2 style="color: #1B3A6B; font-family: Georgia, serif; margin: 0 0 8px;">Transfer Verification</h2>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 32px;">Use the code below to verify your transfer. It expires in <strong>2 minutes</strong>.</p>
            <div style="background: #F7F8FA; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">One-Time Code</p>
              <p style="margin: 0; font-size: 40px; font-weight: 700; letter-spacing: 12px; color: #1B3A6B; font-family: 'Courier New', monospace;">${otp}</p>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">If you did not initiate this transfer, please contact Lumio support immediately.</p>
          </div>
        </div>
      `,
    });

    console.log(`OTP sent to ${recipientEmail}`);
    res.json({ success: true, email: recipientEmail });
  } catch (err) {
    console.error("OTP send error:", err.message);
    res.status(500).json({ error: "Failed to send email", detail: err.message });
  }
});

// POST /api/otp/verify
app.post("/api/otp/verify", async (req, res) => {
  try {
    const { otp, email } = req.body;
    if (!otp || otp.length !== 6) {
      return res.status(400).json({ error: "Invalid OTP format" });
    }

    const verifyEmail = email || OTP_EMAIL;
    const now = new Date().toISOString();

    // Find matching, unexpired, unused OTP
    const { data, error } = await supabase
      .from("transfer_otps")
      .select("id, expires_at")
      .eq("email", verifyEmail)
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

    // Mark as used
    await supabase
      .from("transfer_otps")
      .update({ used: true })
      .eq("id", data[0].id);

    res.json({ success: true });
  } catch (err) {
    console.error("OTP verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.API_PORT || 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API server running on port ${PORT}`);
});
