# mahjong-ui

麻雀AI学習プラットフォーム Web/GUI アプリケーション

高性能麻雀数理・判定・AI評価エンジン [`rust-mahjong`](https://github.com/applyuser160/mahjong) をバックエンドに接続し、4人CPU対局、リアルタイムAI HUD学習、何切るドリル特訓、および終局後の悪手検討をグラフィカルに操作できるWebアプリケーションです。

---

## アーキテクチャ

- **フロントエンド (`frontend/`)**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **バックエンド (`backend/`)**: Python 3.10+, FastAPI, Uvicorn, WebSockets
- **コアエンジン連携**: `rust-mahjong` (PyO3)

---

## セットアップ & 起動手順

### 1. バックエンド
```bash
cd backend
uv venv
uv pip install -e ../../mahjong
uv pip install -r pyproject.toml
uv run uvicorn main:app --reload --port 8000
```

### 2. フロントエンド
```bash
cd frontend
bun install
bun run dev
```

ブラウザで `http://localhost:5173` を開きます。
