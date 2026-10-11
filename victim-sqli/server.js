// ============================================================
//  Lumos Security Lab — 脆弱な練習用Webアプリ (SQL Injection)
//  ※教育・演習専用。意図的に脆弱に作ってあります。
//    本番コードの参考にしないでください。
// ============================================================
const express = require("express");
const Database = require("better-sqlite3");
const app = express();
app.use(express.urlencoded({ extended: true }));

// --- インメモリDBを初期化 ---
const db = new Database(":memory:");
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, secret TEXT);
  INSERT INTO users (username, password, secret) VALUES
    ('admin',  'S3cr3t-Admin-Pw!', 'FLAG{sql_injection_auth_bypass}'),
    ('alice',  'alice123',          'alice の個人メモ'),
    ('bob',    'bobpass',           'bob の個人メモ');
  CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price INTEGER);
  INSERT INTO products (name, price) VALUES
    ('Lumos T-shirt', 2500), ('Lumos Mug', 1200), ('Sticker Pack', 500);
`);

const page = (title, body) => `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:sans-serif;max-width:720px;margin:40px auto;padding:0 16px}
nav a{margin-right:12px}input{font-size:1rem}
table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:6px 10px}
.ok{color:green}.ng{color:#b00}</style></head>
<body><nav><a href="/">Home</a><a href="/login">Login (認証バイパス)</a>
<a href="/products">Products (UNION抽出)</a></nav><h1>${title}</h1>${body}</body></html>`;

// --- Home ---
app.get("/", (_req, res) => {
  res.send(page("Lumos Vulnerable Shop (SQLi)", `
    <p>SQLインジェクション練習用アプリです。</p>
    <ul>
      <li><b>課題1 認証バイパス</b>: 正しいパスワードを知らずにログインする</li>
      <li><b>課題2 UNION抽出</b>: 商品検索から users テーブルの資格情報を盗む</li>
    </ul>`));
});

// --- 課題1: 認証バイパス ---
// 脆弱点: 入力を文字列連結でSQLに埋め込んでいる。
app.get("/login", (_req, res) => {
  res.send(page("Login", `
    <form method="post" action="/login">
      <p>username: <input name="username"></p>
      <p>password: <input name="password"></p>
      <button>ログイン</button>
    </form>
    <p class="hint">ヒント: password 欄に <code>' OR '1'='1' -- </code> を試す。</p>`));
});
app.post("/login", (req, res) => {
  const { username = "", password = "" } = req.body;
  const sql = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  let row;
  try { row = db.prepare(sql).get(); } catch (e) {
    return res.send(page("Login", `<p class="ng">SQLエラー: ${e.message}</p>
      <p>実行SQL: <code>${sql}</code></p>`));
  }
  if (row) {
    res.send(page("Login 成功", `<p class="ok">ようこそ ${row.username} さん！</p>
      <p>secret: <b>${row.secret}</b></p>
      <p>実行SQL: <code>${sql}</code></p>`));
  } else {
    res.send(page("Login 失敗", `<p class="ng">認証失敗</p>
      <p>実行SQL: <code>${sql}</code></p>`));
  }
});

// --- 課題2: UNIONベース情報抽出 ---
// 脆弱点: 検索語を文字列連結で埋め込んでいる。products は3カラム。
app.get("/products", (req, res) => {
  const q = req.query.q;
  let rows = [], sql = "";
  if (q !== undefined) {
    sql = `SELECT id, name, price FROM products WHERE name LIKE '%${q}%'`;
    try { rows = db.prepare(sql).all(); } catch (e) {
      return res.send(page("Products", `<p class="ng">SQLエラー: ${e.message}</p>
        <p>実行SQL: <code>${sql}</code></p>`));
    }
  }
  const table = rows.length
    ? `<table><tr><th>id</th><th>name</th><th>price</th></tr>` +
      rows.map(r => `<tr><td>${r.id}</td><td>${r.name}</td><td>${r.price}</td></tr>`).join("") +
      `</table>`
    : (q !== undefined ? "<p>該当なし</p>" : "");
  res.send(page("Products", `
    <form method="get" action="/products">
      <input name="q" placeholder="商品名で検索" size="40"><button>検索</button>
    </form>${table}
    ${sql ? `<p>実行SQL: <code>${sql}</code></p>` : ""}
    <p class="hint">ヒント: <code>%' UNION SELECT id, username, password FROM users -- </code></p>`));
});

app.listen(3000, () => console.log("victim-sqli app listening on :3000"));
