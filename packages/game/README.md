# @hackforplay/common

HackForPlayでステージを構築するための共通パッケージ

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![npm latest version](https://img.shields.io/npm/v/@hackforplay/common/latest.svg)](https://www.npmjs.com/package/@hackforplay/common)

## 概要

@hackforplay/commonは、教育用プログラミングゲーム「HackForPlay」でステージを構築するためのパッケージです。
ゲームオブジェクト、ルール、イベント処理などの機能を提供し、インタラクティブなゲーム作成を可能にします。

## プロジェクト構造

```
packages/game/
├── src/
│   ├── hackforplay/      # コアモジュール
│   │   ├── object/       # オブジェクト関連クラス
│   │   ├── rule.ts       # ルールシステム
│   │   ├── rpg-map.ts    # マップシステム
│   │   ├── skin.ts       # スキンシステム
│   │   └── ...
│   ├── register.js       # エントリーポイント
│   └── index.ts          # メインエクスポート
├── test/                 # テストファイル
├── dist/                 # ビルド成果物
└── package.json          # 依存関係
```

## 主要コンポーネント

- **RPGObject**: すべてのゲームエンティティの基底クラス
- **Rule**: イベント駆動型のゲームロジック管理システム
- **RPGMap**: タイルベースのマップ管理と衝突検出
- **Player**: ユーザー入力とキャラクター制御
- **スキンシステム**: アセット管理とスプライト制御

## 開発環境のセットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start

# ライブラリの使用
# http://localhost:8080/register.js から利用可能
```

## ビルドプロセス

```bash
# パッケージのビルド
npm run build

# 以下のサブタスクが実行されます
# 1. webpack: ブラウザ用コードのバンドル
# 2. babel: Node.js用コードの変換
# 3. definition: 型定義ファイルの生成
```

## テスト

```bash
# テストの実行
npm test

# 特定のファイルのテスト
npx ava test/specific-test-file.js
```

## デプロイプロセス

デプロイは以下の2つの場所に対して行われます：

1. **npm registry**: Node.jsアプリケーションで使用するためのパッケージ
2. **Google Cloud Storage**: ブラウザで直接使用するためのCDNホスティング

semantic-releaseを使用して、コミットメッセージに基づいて自動的にバージョンが決定されます。
