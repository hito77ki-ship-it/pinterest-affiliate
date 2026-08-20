export const meta = {
  name: 'content-pipeline',
  description: 'ライフスタイル系Pinterestアフィリエイト記事を、リサーチ→英語執筆→Pin設計まで自動連携させる',
  whenToUse: '/Users/hitoki/pinterest-affiliate/config/niche.mdの方針に沿って新しいトピックを1本〜複数本まとめて企画・執筆・Pin設計したいとき。args.topicCountで並行生成する本数を指定できる（省略時は1）。args.seedsでトピックの方向性ヒントを配列で渡せる（省略可）。',
  phases: [
    { title: 'Research', detail: 'トピック・キーワード・競合をリサーチしてブリーフを作成' },
    { title: 'Write', detail: 'ブリーフをもとに英語記事を執筆' },
    { title: 'Design', detail: 'Pinterest Pin用の画像仕様とコピーを作成' },
  ],
}

// NOTE: agentType（カスタムサブエージェント名）は、このワークフローを実行している
// セッションのプロジェクト側レジストリからしか解決できず、pinterest-affiliate以外の
// プロジェクトから実行すると見つからずに失敗する。そのため、ここでは agentType を使わず、
// 各エージェントに役割定義ファイル（.claude/agents/*.md）を直接Readさせて役割を渡す。
const ROLE_DIR = '/Users/hitoki/pinterest-affiliate/.claude/agents'
const roleInstruction = (roleFile) =>
  `まず ${ROLE_DIR}/${roleFile} を読み、そこに書かれている役割・ルール・出力フォーマットに厳密に従ってください。`

const topicCount = (args && args.topicCount) || 1
const seeds = (args && args.seeds) || []

// 空文字列を使う（nullやundefinedをpipeline()の項目に渡すと「処理対象なし」として
// スキップされ、エージェントが1件も呼ばれない事象が確認されたため）
const topics = Array.from({ length: topicCount }, (_, i) => seeds[i] || '')

log(`${topicCount}件のトピックをリサーチ→執筆→Pin設計のパイプラインで処理します`)

const results = await pipeline(
  topics,
  (seed) => {
    const hint = seed
      ? `トピックの方向性のヒント：${seed}`
      : '方向性の指定はないので、/Users/hitoki/pinterest-affiliate/config/niche.mdの方針に沿って自由に良いトピックを選定してください。'
    return agent(
      `${roleInstruction('researcher.md')}\n\nPinterestアフィリエイト向けの記事トピックを1つ選定し、トピックブリーフを作成して保存してください。${hint}`,
      { phase: 'Research', label: 'research' }
    )
  },
  (briefText) =>
    agent(
      `${roleInstruction('writer.md')}\n\n直前のリサーチャーが作成したトピックブリーフをもとに、英語記事を執筆して保存してください。\n\n---トピックブリーフ---\n${briefText}`,
      { phase: 'Write', label: 'write' }
    ),
  (draftText) =>
    agent(
      `${roleInstruction('pinterest-designer.md')}\n\n直前のライターが執筆した記事ドラフトをもとに、Pinterest Pinの仕様（画像3パターン・タイトル・説明文・ハッシュタグ）を設計して保存してください。\n\n---記事ドラフト---\n${draftText}`,
      { phase: 'Design', label: 'design' }
    )
)

const done = results.filter(Boolean).length
log(`${done}/${topicCount} 件のトピックが企画→執筆→Pin設計まで完走しました`)

return results
