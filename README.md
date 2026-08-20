# Pinterest Affiliate Team

海外（英語圏）ライフスタイル系Pinterestアフィリエイトサイトを、4つの役割を持つAIサブエージェントで運用するプロジェクト。ニッチや収益化方針は `config/niche.md` を参照。

## チーム体制

| 役割 | ファイル | 何をするか |
|---|---|---|
| リサーチャー | `.claude/agents/researcher.md` | トピック・キーワード・競合・アフィリエイト商品を調査し、トピックブリーフを作成 |
| 英語ライター | `.claude/agents/writer.md` | トピックブリーフをもとに英語記事を執筆 |
| Pinterestデザイナー | `.claude/agents/pinterest-designer.md` | 記事をもとにPin画像仕様・タイトル・説明文を設計 |
| 改善分析官 | `.claude/agents/analyst.md` | 公開後の実績を分析し、次サイクルへの改善提言をまとめる |

## 連携フロー

```
researcher → writer → pinterest-designer → （公開） → analyst → （次サイクルのresearcherへフィードバック）
```

コンテンツは `pipeline/` 配下を順番に流れる。

```
pipeline/
├── 01-research/    ← researcherの出力（トピックブリーフ）
├── 02-drafts/      ← writerの出力（英語記事ドラフト）
├── 03-pins/        ← pinterest-designerの出力（Pin仕様）
├── 04-published/   ← 公開済みコンテンツの記録（手動で移動）
└── 05-reports/     ← analystの出力（実績分析・改善提言）
```

## 使い方

### 新しいトピックを1〜複数本、まとめて企画・執筆・Pin設計する

Workflowツールで `content-pipeline` を実行する。

```
Workflow({ name: "content-pipeline" })
```

複数トピックを並行生成する場合、または方向性のヒントを与える場合：

```
Workflow({
  name: "content-pipeline",
  args: { topicCount: 3, seeds: ["small kitchen storage", "budget backyard DIY"] }
})
```

`args.seeds` は省略可。省略した場合は `config/niche.md` の方針に沿ってリサーチャーが自由にトピックを選ぶ。

### 各役割を単体で呼ぶ

`subagent_type` にそれぞれの名前（`researcher` 等）を指定するカスタムサブエージェント呼び出しは、**Claude Codeを`pinterest-affiliate`をプロジェクトルートとして開いているセッションからしか解決できない**（他プロジェクトのセッションから呼ぶと見つからずエラーになる）。

`pinterest-affiliate`以外のプロジェクト（例：study-quest）のセッションから単体で呼びたい場合は、汎用のAgentツールに役割ファイルを直接読ませる形にする。

```
Agent({
  prompt: "まず /Users/hitoki/pinterest-affiliate/.claude/agents/researcher.md を読み、その指示に従ってトピックブリーフを作成してください。"
})
```

`content-pipeline.js` もこの方式（役割ファイルを直接Read）で書いてあるため、どのプロジェクトのセッションから実行しても動く。

### 実績分析（analyst）を回す

analystはPinterestアナリティクス・GA・アフィリエイトダッシュボードの実数値を必要とするため、ワークフローには組み込んでいない。`pipeline/04-published/` に公開済み記事を記録したうえで、実際の数値を貼り付けてAgentツールから個別に呼び出す。

```
Agent({
  prompt: "まず /Users/hitoki/pinterest-affiliate/.claude/agents/analyst.md を読み、その指示に従ってください。〔対象記事〕の実績はこちら：〔Pinterest/GA/アフィリエイトの数値を貼り付け〕。"
})
```

analystの提言は、次の `content-pipeline` 実行時に `args.seeds` として渡すことで、リサーチにフィードバックできる。

## 方針を変えるとき

ニッチ・ターゲット・収益化方針を変える場合は `config/niche.md` を先に更新する。researcherはこのファイルを前提にトピックを選ぶため、更新せずに走らせると齟齬が生まれる。
