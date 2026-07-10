require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  PORT = 3000,
  ALLOWED_ORIGINS = '',
} = process.env;
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error(
    'Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID. Copy .env.example to .env and fill it in.'
  );
  process.exit(1);
}
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
// --- Middleware ---
const allowedOrigins = ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : '*',
    methods: ['POST', 'GET'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // handles standard HTML <form> posts
// Very small in-memory rate limiter (per IP) to avoid spam/abuse.
// For production, replace with a proper store like Redis.
const rateLimitWindowMs = 60 * 1000;
const rateLimitMax = 5;
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip;
  const now = Date.now();
l it in
;

 const record = hits.get(ip) || { count: 0, start: now };
  if (now - record.start > rateLimitWindowMs) {
    record.count = 0;
    record.start = now;
  }
  record.count += 1;
  hits.set(ip, record);
  if (record.count > rateLimitMax) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try aga
}
next(); }
// --- Helpers ---
// Escape special characters for Telegram MarkdownV2
function escapeMarkdownV2(text = '') {
  return String(text).replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, '\\$&');
}
// Build a readable Telegram message from an arbitrary form-data object
function buildMessage(fields) {
  const lines = ['*New Form Submission*', ''];
  for (const [key, value] of Object.entries(fields)) {
    const label = escapeMarkdownV2(key);
    const val = escapeMarkdownV2(
      Array.isArray(value) ? value.join(', ') : String(value ?? '')
    );
    lines.push(`*${label}:* ${val}`);
  }
  return lines.join('\n');
}
async function sendToTelegram(text) {
  const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
      parse_mode: 'MarkdownV2',
}), });
const data = await res.json();
in late

   if (!data.ok) {
    throw new Error(data.description || 'Telegram API error');
}
  return data;
}
// --- Routes ---
// Health check
app.get('/health', (req, res) => res.json({ ok: true }));
// Main endpoint your HTML <form> or fetch() call should POST to
app.post('/api/submit', rateLimit, async (req, res) => {
  try {
    const fields = req.body;
    if (!fields || Object.keys(fields).length === 0) {
      return res.status(400).json({ ok: false, error: 'No form data received.' });
}
    // Basic honeypot spam-check example (add a hidden "website" field in your form)
    if (fields.website) {
      // Silently accept but don't actually send — likely a bot
      return res.json({ ok: true });
    }
    const message = buildMessage(fields);
    await sendToTelegram(message);
    res.json({ ok: true, message: 'Sent to Telegram successfully.' });
  } catch (err) {
    console.error('Error sending to Telegram:', err.message);
    res.status(500).json({ ok: false, error: 'Failed to send message to Telegram.' });
  }
});
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
