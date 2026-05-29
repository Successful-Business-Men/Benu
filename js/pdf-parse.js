// Browser-side PDF text extraction using pdf.js, then heuristic item parsing.
// Loads pdf.js lazily so the page does not pay for it until the user uploads.
//
// Heuristic stack (best for digital, text-based PDFs):
//   1. Extract raw items with x/y positions from each page
//   2. Cluster items into rows with vertical tolerance (sub-pixel safe)
//   3. Detect column boundaries from horizontal gaps within rows
//   4. Parse each row: name on left, price on right; multiple prices = multiple items
//   5. Detect category headers (no-price lines between priced lines, often short / all-caps)
//   6. Attach descriptions (no-price lines immediately following a priced line)
//
// For image-based or weirdly-formatted PDFs, heuristics will miss things — a follow-up
// LLM extraction step on the raw lines would be the real fix.

window.BMPdfParse = (function () {
  const PDFJS_URL    = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
  const PDFJS_WORKER = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let loaded = null;
  function loadPdfJs() {
    if (loaded) return loaded;
    loaded = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = PDFJS_URL;
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        resolve(window.pdfjsLib);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return loaded;
  }

  // Cluster items into rows with vertical tolerance. PDFs sometimes have sub-pixel
  // y drift between glyphs that should belong to the same visual row.
  const Y_TOLERANCE = 3;

  async function extractRows(file) {
    const pdfjs = await loadPdfJs();
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    const allRows = [];

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const raw = [];
      for (const it of content.items) {
        if (!it.str || !it.str.trim()) continue;
        raw.push({ x: it.transform[4], y: it.transform[5], str: it.str });
      }
      if (raw.length === 0) continue;

      // Sort top-to-bottom (PDF coords: bigger y = higher on page).
      raw.sort((a, b) => b.y - a.y);

      // Cluster into rows using a running tolerance.
      const rows = [];
      for (const item of raw) {
        let placed = false;
        for (const row of rows) {
          if (Math.abs(row.y - item.y) <= Y_TOLERANCE) {
            row.items.push(item);
            // Stable centroid update.
            row.y = (row.y * (row.items.length - 1) + item.y) / row.items.length;
            placed = true;
            break;
          }
        }
        if (!placed) rows.push({ y: item.y, items: [item] });
      }

      for (const row of rows) {
        row.items.sort((a, b) => a.x - b.x);
      }
      allRows.push(...rows);
    }
    return allRows;
  }

  // Split a single row into logical "columns" by detecting big horizontal gaps.
  // Typical 2-col menus have a gap of 80+ PDF units between left items and right items.
  // We split when the gap between consecutive items exceeds 2.5x the average gap.
  function splitRowByGap(row) {
    const items = row.items;
    if (items.length <= 1) {
      return [items.map(i => i.str).join("").trim()];
    }
    const gaps = [];
    for (let i = 1; i < items.length; i++) {
      gaps.push(items[i].x - (items[i - 1].x + items[i - 1].str.length * 4));
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const threshold = Math.max(avgGap * 2.5, 40);

    const cols = [[items[0]]];
    for (let i = 1; i < items.length; i++) {
      const gap = items[i].x - (items[i - 1].x + items[i - 1].str.length * 4);
      if (gap > threshold) cols.push([items[i]]);
      else cols[cols.length - 1].push(items[i]);
    }
    return cols.map(col => col.map(i => i.str).join(" ").replace(/\s+/g, " ").trim()).filter(Boolean);
  }

  // Price regex: $12, $12.50, 12.50, 12,50, 12.-, 12-, 1,200.50, with optional currency.
  // Requires the price to be followed by a non-digit or end-of-string.
  const PRICE_RE = /\$?\s*(\d{1,4}(?:[.,]\d{1,2}|[.,][-—])?)(?!\d)/g;

  function normalizePrice(raw) {
    return parseFloat(raw.replace(/[,]/g, ".").replace(/[-—]/, "")) || 0;
  }
  function isPlausiblePrice(p) { return p >= 1 && p <= 999; }

  function pricesIn(text) {
    const out = [];
    for (const m of text.matchAll(PRICE_RE)) {
      const price = normalizePrice(m[1]);
      if (isPlausiblePrice(price)) out.push({ price, index: m.index, length: m[0].length });
    }
    return out;
  }

  // Strip leader dots, leading bullets, numbering, trailing punctuation.
  function cleanName(s) {
    return s
      .replace(/^[\s•·*\-]+/u, "")
      .replace(/^\d+[.)]\s+/, "")          // "1. " or "1) " menu numbering
      .replace(/[\s.…·•\-_]+$/u, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function titleCase(s) {
    const letters = s.replace(/[^a-zA-Z]/g, "");
    if (letters.length > 3 && letters === letters.toUpperCase()) {
      // ALL CAPS — keep as-is, many menus use this for dish names.
      return s;
    }
    return s.toLowerCase().replace(/\b([a-z])/g, c => c.toUpperCase());
  }

  // A line is plausibly a category header if it has no price, is short, and is
  // mostly letters (no $ or numbers). Bonus points if it's ALL CAPS or italic.
  function looksLikeCategory(line) {
    if (!line) return false;
    if (line.length > 40) return false;
    if (pricesIn(line).length > 0) return false;
    if (/\d/.test(line)) return false;
    const letters = line.replace(/[^a-zA-Z]/g, "");
    if (letters.length < 3) return false;
    return true;
  }

  function parseItems(rows) {
    const items = [];
    let currentCategory = "Menu";
    let lastItem = null;

    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      // Split row into column-aware segments so 2-col menus don't get mangled.
      const segments = splitRowByGap(row);

      for (const seg of segments) {
        const matches = pricesIn(seg);

        if (matches.length === 0) {
          // No price in this segment. Three possibilities:
          //  (a) It's a category header
          //  (b) It's the description of the previous item
          //  (c) It's flavor text we should skip
          if (looksLikeCategory(seg)) {
            currentCategory = titleCase(seg);
            lastItem = null;
          } else if (lastItem && seg.length >= 8 && seg.length <= 240 && !lastItem.description) {
            lastItem.description = seg;
          }
          continue;
        }

        // For each price, the text since the previous price (or segment start)
        // is the name candidate.
        let cursor = 0;
        for (const m of matches) {
          let name = cleanName(seg.slice(cursor, m.index));

          // If the segment starts with a price and we have a recent prev segment
          // with no price, that prev was probably the name (right-aligned price column).
          if (!name && cursor === 0) {
            // Look back through earlier segments in this same row for an unused name.
            const prevSegIdx = segments.indexOf(seg) - 1;
            if (prevSegIdx >= 0) {
              const prev = segments[prevSegIdx];
              if (pricesIn(prev).length === 0) name = cleanName(prev);
            }
          }

          if (name.length >= 2 && name.length <= 90) {
            const item = {
              name: titleCase(name),
              price: m.price,
              category: currentCategory,
              description: "",
              spice: 0,
            };
            items.push(item);
            lastItem = item;
          }
          cursor = m.index + m.length;
        }
      }
    }

    return dedupe(items);
  }

  function dedupe(items) {
    const seen = new Set();
    const out = [];
    for (const it of items) {
      const k = `${it.name.toLowerCase()}|${it.price.toFixed(2)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(it);
    }
    return out;
  }

  async function parseFile(file) {
    const rows = await extractRows(file);
    const items = parseItems(rows);
    // Flatten rows back to lines for any caller that wants to debug.
    const lines = rows.map(r => splitRowByGap(r).join("  |  "));
    return { lines, items };
  }

  return { parseFile };
})();
