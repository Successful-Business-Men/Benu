// Shared helpers for the QR pack pipeline. Used by:
//   /api/subscribe   (new signups)
//   /api/resend-qr   (re-issues for existing subscribers whose original
//                     PDF baked in a URL that turned out to be unreachable
//                     for customers, e.g. an auth-walled Vercel preview)

const crypto = require("crypto");
const { Resend } = require("resend");
const QRCode = require("qrcode");
const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");

const TABLE_COUNT = 20;

const TEMPLATE_LABELS = {
  "purr":     "Counter",
  "sprout":   "Market",
  "chain":    "Storefront",
  "boutique": "Boutique",
  "shack":    "Shack",
};

function makeSlug() {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789"; // ambiguous chars removed
  // crypto.randomBytes over Math.random(): the slug is a public identifier,
  // not a secret, but a CSPRNG costs nothing and removes any predictability.
  const bytes = crypto.randomBytes(8);
  let s = "r-";
  for (let i = 0; i < 8; i++) {
    s += alphabet[bytes[i] % alphabet.length];
  }
  return s;
}

// The owner secret. Long, hex, CSPRNG-backed — meant to be unguessable and
// to live only in the welcome email / kitchen link / owner's localStorage.
function makeToken() {
  return crypto.randomBytes(18).toString("hex");
}

// The most reliable source of a URL that works for customers is the URL
// the owner is using right now — they just loaded the page from it, so
// at minimum it serves HTML. VERCEL_URL points at a per-deployment alias
// that often requires Vercel auth (fatal for QR codes scanned by phones
// that don't have a Vercel session), so we don't use it as a fallback.
function baseUrl(req) {
  if (process.env.BASE_URL) return process.env.BASE_URL.replace(/\/+$/, "");
  const headers = (req && req.headers) || {};
  const host = headers["x-forwarded-host"] || headers.host;
  if (host) {
    const proto = String(headers["x-forwarded-proto"] || "https").split(",")[0].trim();
    return `${proto}://${host}`;
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

function buildUrls(origin, slug, tableCount = TABLE_COUNT, token = "") {
  const menuUrls = [];
  for (let t = 1; t <= tableCount; t++) {
    // Customer-facing — no token. Anyone may scan a table and order.
    menuUrls.push(`${origin}/menu.html?r=${slug}&t=${t}`);
  }
  // The kitchen link carries the owner token (&k=) so staff can read the
  // queue and advance tickets; without it the orders API rejects mutations.
  const k = token ? `&k=${encodeURIComponent(token)}` : "";
  return {
    menuUrls,
    menuPreviewUrl: `${origin}/menu.html?r=${slug}`,
    kdsUrl:         `${origin}/kitchen.html?r=${slug}${k}`,
  };
}

async function buildQrPdf(menuUrls, slug) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]); // US Letter
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const reg  = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText("Better Menu — Table QR Codes", { x: 36, y: 752, size: 16, font: bold });
  page.drawText(`Restaurant ID: ${slug}`, { x: 36, y: 734, size: 9, font: reg, color: rgb(0.45, 0.45, 0.45) });
  page.drawText("Cut along the grid and place one card on each table.", {
    x: 36, y: 720, size: 9, font: reg, color: rgb(0.45, 0.45, 0.45),
  });

  const cols = 4;
  const rows = 5;
  const marginX = 36;
  const gridTop = 700;
  const gridBottom = 36;
  const cellW = (612 - marginX * 2) / cols;
  const cellH = (gridTop - gridBottom) / rows;

  for (let i = 0; i < menuUrls.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellX = marginX + col * cellW;
    const cellY = gridTop - (row + 1) * cellH;

    const png = await QRCode.toBuffer(menuUrls[i], { type: "png", margin: 1, width: 320 });
    const img = await pdf.embedPng(png);
    const qrSize = Math.min(cellW, cellH) - 32;
    const qrX = cellX + (cellW - qrSize) / 2;
    const qrY = cellY + (cellH - qrSize) / 2 + 8;
    page.drawImage(img, { x: qrX, y: qrY, width: qrSize, height: qrSize });

    const label = `Table ${i + 1}`;
    const labelWidth = bold.widthOfTextAtSize(label, 11);
    page.drawText(label, { x: cellX + (cellW - labelWidth) / 2, y: cellY + 10, size: 11, font: bold });
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}

function section(num, title, body) {
  return `
    <tr><td style="padding:24px 0 8px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="width:32px;vertical-align:top;">
            <div style="width:26px;height:26px;border-radius:999px;background:#1a1a1a;color:#FBF7EE;font-size:13px;font-weight:600;text-align:center;line-height:26px;">${num}</div>
          </td>
          <td style="padding-left:14px;">
            <div style="font-family:Georgia,serif;font-size:18px;line-height:1.25;color:#1a1a1a;margin-bottom:6px;">${title}</div>
            <div style="font-size:14px;line-height:1.55;color:#1a1a1a;">${body}</div>
          </td>
        </tr>
      </table>
    </td></tr>`;
}

function linkRow(url) {
  return `<a href="${url}" style="display:inline-block;margin-top:6px;font-size:13px;color:#1a1a1a;word-break:break-all;text-decoration:underline;">${url}</a>`;
}

function emailHtml({ menuPreviewUrl, kdsUrl, slug, origin, isResend }) {
  const heading = isResend ? "Fresh setup." : "You're in.";
  const lead = isResend
    ? "Here's your Better Menu pack regenerated against the URL you used to request it. Toss the old PDF."
    : "Your Better Menu is live. Three things to keep handy:";
  return `<!doctype html>
<html><body style="margin:0;background:#FBF7EE;padding:32px 16px;font-family:-apple-system,system-ui,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:18px;padding:32px;border-collapse:collapse;">
    <tr><td>
      <h1 style="font-family:Georgia,serif;font-size:28px;margin:0 0 10px;line-height:1.15;">${heading}</h1>
      <p style="font-size:15px;line-height:1.6;margin:0 0 8px;color:#4b5563;">${lead}</p>
    </td></tr>
    ${section(
      "1",
      "Table QR codes",
      `<p style="margin:0;">Attached as a printable PDF — 20 codes, one per table. Cut, place, customers scan to order.</p>`
    )}
    ${section(
      "2",
      "Menu preview",
      `<p style="margin:0;">What your customers see when they scan. Open it to confirm everything looks right.</p>
       ${linkRow(menuPreviewUrl)}`
    )}
    ${section(
      "3",
      "Kitchen Display",
      `<p style="margin:0;">Open this on a tablet in your kitchen — orders from any table appear here in real time.</p>
       ${linkRow(kdsUrl)}`
    )}
    <tr><td style="padding-top:28px;">
      <hr style="border:0;border-top:1px solid #eee;margin:0 0 14px;"/>
      <p style="font-size:11px;color:#9ca3af;margin:0;line-height:1.5;">
        Restaurant ID: <span style="color:#4b5563;">${slug}</span><br/>
        QR codes point to: <span style="color:#4b5563;">${origin}</span>
      </p>
    </td></tr>
  </table>
</body></html>`;
}

async function sendQrPack({ to, slug, origin, isResend, token }) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_FROM = process.env.RESEND_FROM_EMAIL || "Better Menu <onboarding@resend.dev>";
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");

  const { menuUrls, menuPreviewUrl, kdsUrl } = buildUrls(origin, slug, TABLE_COUNT, token);
  const pdfBuffer = await buildQrPdf(menuUrls, slug);

  const resend = new Resend(RESEND_API_KEY);
  const subject = isResend
    ? "Your Better Menu setup (fresh copy)"
    : "Your Better Menu is ready";
  const result = await resend.emails.send({
    from: RESEND_FROM,
    to,
    subject,
    html: emailHtml({ menuPreviewUrl, kdsUrl, slug, origin, isResend }),
    attachments: [
      { filename: `better-menu-qr-${slug}.pdf`, content: pdfBuffer.toString("base64") },
    ],
  });
  if (result.error) throw new Error(result.error.message || "Resend rejected the email.");
  return { menuPreviewUrl, kdsUrl, origin };
}

module.exports = {
  TABLE_COUNT,
  TEMPLATE_LABELS,
  makeSlug,
  makeToken,
  baseUrl,
  buildUrls,
  buildQrPdf,
  emailHtml,
  sendQrPack,
};
