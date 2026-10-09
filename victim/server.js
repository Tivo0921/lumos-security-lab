// ============================================================
//  Lumos Security Lab — 脆弱な練習用Webアプリ (XSS)
//  ※教育・演習専用。意図的に脆弱に作ってあります。
//    本番コードの参考にしないでください。
// ============================================================
const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

// 擬似「管理者セッション」。XSSで盗む対象 (document.cookie で見える)。
app.use((req, res, next) => {
  if (!req.headers.cookie) {
    // TODO(workshop 発展): 末尾に "; HttpOnly" を付けると document.cookie から
    //   読めなくなり、XSSが起きても cookie 窃取を防げる。効果を確認してみよう。
    res.setHeader("Set-Cookie", "session=SECRET-ADMIN-TOKEN-1234; Path=/");
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
  res.send(page("Lumos Vulnerable App", `
    <p>XSS練習用アプリです。左のメニューから各課題へ。</p>
    <ul>
      <li><b>Reflected XSS</b>: 検索ボックスに入れた値がそのまま表示されます。</li>
      <li><b>Stored XSS</b>: 投稿した内容が保存され、全員のページに表示されます。</li>
    </ul>
    <p>目標: <code>alert(document.cookie)</code> を実行し、管理者セッションを表示させる。</p>`));
});

// --- 課題1: Reflected XSS ---
// 脆弱点: q をエスケープせずHTMLに埋め込んでいる。
app.get("/search", (req, res) => {
  const q = req.query.q || "";
  res.send(page("Reflected XSS", `
    <form method="get" action="/search">
      <input name="q" value="" placeholder="検索ワード" size="40">
      <button>検索</button>
    </form>
    ${/* TODO(workshop ①): q をエスケープして埋め込む。ヒント: 下の esc() を使い ${esc(q)} に */""}
    ${q ? `<p>「${q}」の検索結果は見つかりませんでした。</p>` : ""}
    <p class="hint">ヒント: URL の <code>?q=</code> に直接 payload を入れてみる。</p>`));
});

// --- 課題2: Stored XSS ---
// 脆弱点: 投稿本文をエスケープせず保存・表示している。
const comments = [];

// TODO(workshop ②): 出力エスケープ関数。これを使って上書きを防ぐ。
//   solution ブランチに模範解答あり。
// const esc = s => s.replace(/[&<>"']/g, c =>
//   ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));

app.get("/guestbook", (_req, res) => {
  // TODO(workshop ②): ${c} をエスケープして ${esc(c)} にする
  const list = comments.map(c => `<div class="card">${c}</div>`).join("") ||
    "<p>まだ投稿はありません。</p>";
  res.send(page("Stored XSS — Guestbook", `
    <form method="post" action="/guestbook">
      <textarea name="comment" rows="3" cols="50" placeholder="コメントを書く"></textarea><br>
      <button>投稿</button>
    </form><h2>投稿一覧</h2>${list}
    <p class="hint">ヒント: 投稿した payload はページを開いた全員のブラウザで実行される。</p>`));
});
app.post("/guestbook", (req, res) => {
  if (req.body.comment) comments.push(req.body.comment);
  res.redirect("/guestbook");
});

app.listen(3000, () => console.log("victim app listening on :3000"));
