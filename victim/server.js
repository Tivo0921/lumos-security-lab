// ============================================================
//  Lumos Security Lab — 修正版 (solution ブランチ)
//  XSS を以下の多層防御で無効化した模範解答です。
//    ① 出力エスケープ  ② HttpOnly cookie  ③ CSP ヘッダ
//  main ブランチ(脆弱版)と diff を取ると、どこを直したか分かります。
// ============================================================
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

// 出力エスケープ: 特殊文字を実体参照へ変換し、入力を「コード」ではなく「文字」にする。
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ③ CSP: 万一エスケープ漏れしてもインライン script の実行を止める多層防御。
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'");
  // ② HttpOnly: JS(document.cookie)から読めなくし、cookie 窃取を防ぐ。
  if (!req.headers.cookie) {
    res.setHeader("Set-Cookie", "session=SECRET-ADMIN-TOKEN-1234; Path=/; HttpOnly");
  }
  next();
});

const page = (title, body) => `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px}
nav a{margin-right:12px}input,textarea{font-size:1rem}
.card{border:1px solid #ccc;border-radius:8px;padding:12px;margin:8px 0}</style></head>
<body><nav><a href="/">Home</a><a href="/search">Reflected XSS</a>
<a href="/guestbook">Stored XSS</a></nav><h1>${title}</h1>${body}</body></html>`;

// --- Home ---
app.get("/", (_req, res) => {
  res.send(page("Lumos App (fixed)", `
    <p>XSS を修正した版です。同じ payload を入れても実行されないことを確認してください。</p>
    <ul>
      <li><b>Reflected XSS</b>: 検索ボックス（修正済み）</li>
      <li><b>Stored XSS</b>: 掲示板（修正済み）</li>
    </ul>`));
});

// --- 課題1: Reflected XSS → 修正: 出力時に esc() ---
app.get("/search", (req, res) => {
  const q = req.query.q || "";
  res.send(page("Reflected XSS (fixed)", `
    <form method="get" action="/search">
      <input name="q" value="" placeholder="検索ワード" size="40">
      <button>検索</button>
    </form>
    ${q ? `<p>「${esc(q)}」の検索結果は見つかりませんでした。</p>` : ""}
    <p class="hint">payload を入れても文字として表示されるだけ。</p>`));
});

// --- 課題2: Stored XSS → 修正: 表示時に esc() ---
// 保存は生のままでよい(入力は信頼せず「出力時」に無害化するのが基本)。
const comments = [];
app.get("/guestbook", (_req, res) => {
  const list = comments.map(c => `<div class="card">${esc(c)}</div>`).join("") ||
    "<p>まだ投稿はありません。</p>";
  res.send(page("Stored XSS — Guestbook (fixed)", `
    <form method="post" action="/guestbook">
      <textarea name="comment" rows="3" cols="50" placeholder="コメントを書く"></textarea><br>
      <button>投稿</button>
    </form><h2>投稿一覧</h2>${list}
    <p class="hint">payload を投稿しても実行されず、文字として表示される。</p>`));
});
app.post("/guestbook", (req, res) => {
  if (req.body.comment) comments.push(req.body.comment);
  res.redirect("/guestbook");
});

app.listen(3000, () => console.log("victim app (fixed) listening on :3000"));
