# mahjong-ui

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38B2AC.svg)](https://tailwindcss.com/)

麻雀AI学習プラットフォーム Web/GUI アプリケーション。  
高性能麻雀数理・AI評価エンジン [`rust-mahjong`](https://github.com/applyuser160/mahjong) をバックエンドに接続し、4人CPU対局、リアルタイムAI HUD、何切るドリル特訓、および終局後の悪手検討をグラフィカルに操作できるWebアプリケーションです。

---

## 主要な機能

- 🀄 **4人CPU対局モード**:
  - 本格的な4人打ち麻雀。鳴き（チー・ポン・カン）、リーチ、ツモ・ロン和了、連荘、点棒授受を完全再現
  - 本物志向のリアルな牌画像表示、ツモ切り/手出しの視覚的区別
- 🧠 **リアルタイム AI HUD**:
  - プレイヤーの手番時に、Rust コアエンジンによる局収支 EV・和了率・平均打点の打牌ランキングをリアルタイム提示
  - 持ち点状況に応じた最終着順確率分布（1位〜4位の確率）の動的表示
- 🎯 **何切るドリル特訓**:
  - 難易度別（初級・中級・上級）の何切る問題の自動生成
  - AI による正誤判定と打牌理由（Explanation）の自動解説
- 🔍 **牌譜レビュー & 悪手検討**:
  - 終局後に1局の全打牌をAIが自動検分
  - EV 損失に基づく悪手・疑問手のハイライトと代替手の提示

---

## アーキテクチャ

- **フロントエンド (`frontend/`)**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **バックエンド (`backend/`)**: Python 3.10+, FastAPI, Uvicorn, WebSockets
- **エンジン連携**: `rust-mahjong` (PyO3)

詳細な設計は [docs/](docs/) を参照してください：
- 🖥️ [**画面機能仕様書**](docs/screens.md): 対局画面、AI HUD、ドリル、レビュー画面の仕様
- 🔌 [**通信プロトコル仕様書**](docs/api-protocol.md): WebSocket イベントシーケンスとペイロード構造

---

## セットアップ & 起動手順

### ワンクリック起動 (Windows)
リポジトリルート（または本ディレクトリ直下）のバッチファイルを実行するだけで、バックエンドとフロントエンドが自動起動します。

```bash
.\start.bat
```

### 個別起動する場合

#### 1. バックエンド
```bash
cd backend
uv venv
uv pip install -e ../../mahjong
uv pip install -r pyproject.toml
uv run uvicorn main:app --reload --port 8000
```

#### 2. フロントエンド
```bash
cd frontend
bun install
bun run dev
```

ブラウザで `http://localhost:5173` を開きます。
