<p align="right"><a href="README.md">English</a> | 日本語</p>

# WakaTime Stats Action

WakaTime APIとGitHub Actionsを使用して、過去7日間のコーディング活動から
カスタマイズ可能なSVGカードを生成します。

このActionは、MITライセンスの
[`@stats-organization/github-readme-stats-core`](https://github.com/stats-organization/github-stats-extended/tree/master/packages/core)
パッケージに含まれるWakaTimeカードレンダラーを使用してカードを生成します。
WakaTime APIキーを使用して、WakaTimeから統計情報を直接取得します。

<details>
<summary><strong>WakaTimeとは？</strong></summary>

[WakaTime](https://wakatime.com/)は、エディター、言語、プロジェクトなどの
コーディング活動を自動的に記録する開発者向け生産性プラットフォームです。
このActionを使用すると、その統計情報をカスタマイズ可能なSVGカードに変換し、
GitHubプロフィールやリポジトリのREADMEに表示できます。

</details>

## 機能

- WakaTimeの統計カードをSVGファイルとして生成
- コンパクトレイアウト、テーマ、カスタムカラー、言語フィルタリングに対応
- WakaTimeによる直近の統計情報の集計完了を待機
- チェックアウトしたリポジトリ内の任意の場所にカードを出力

## 関連Actionとの違い

関連する
[`stats-organization/github-readme-stats-action`](https://github.com/stats-organization/github-readme-stats-action)
は、ユーザー名でWakaTimeユーザーを識別します。一方、このActionはWakaTime
APIキーで認証し、現在のユーザーの統計情報を取得します。APIキーによって
アカウントが識別されるため、WakaTimeのプロフィールに独自のユーザー名を
設定する必要がなく、[WakaTimeのFreeプラン](https://wakatime.com/pricing)でも
カードを生成できます。

## クイックスタート

### 1. WakaTime APIキーを追加する

[WakaTime APIキーページ](https://wakatime.com/api-key)からAPIキーをコピーし、
カードを生成するリポジトリに追加します。

1. **Settings → Secrets and variables → Actions** を開きます。
2. **New repository secret** を選択します。
3. Secret名を `WAKATIME_API_KEY` とし、APIキーを値として貼り付けます。

APIキーをワークフローファイルに直接記載しないでください。

### 2. ワークフローを追加する

生成したカードを保存するリポジトリに `.github/workflows/wakatime.yml` を
作成します。

```yaml
name: Update WakaTime card

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * *"

permissions:
  contents: write

jobs:
  update-card:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v7

      - name: Generate WakaTime card
        uses: twelnina/wakatime-stats-action@v0.1.0
        with:
          wakatime-api-key: ${{ secrets.WAKATIME_API_KEY }}
          output-path: assets/wakatime.svg
          layout: compact
          theme: transparent
          hide-border: true

      - name: Commit updated card
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add assets/wakatime.svg
          git diff --cached --quiet || git commit -m "chore: update WakaTime stats"
          git push
```

このActionはSVGを生成しますが、コミットは行いません。上記ワークフローの
最後のステップでは、カードの内容が変更された場合にのみコミットします。

### 3. カードを埋め込む

ワークフローがファイルを生成してコミットした後、READMEに追加します。

```markdown
![WakaTime stats](./assets/wakatime.svg)
```

## 入力

| 入力 | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `wakatime-api-key` | Yes | — | 現在のユーザーの統計情報を取得するために使用するWakaTime APIキー。 |
| `output-path` | No | `wakatime-card.svg` | 生成するSVGの出力先パス。 |
| `layout` | No | `normal` | カードのレイアウト：`normal` または `compact`。 |
| `langs-count` | No | すべて | 表示する言語数の上限。 |
| `card-width` | No | `495` | カードの幅（ピクセル）。 |
| `theme` | No | `default` | カードのテーマ。[テーマ](#テーマ)を参照。 |
| `hide-border` | No | `false` | `true` にするとカードの枠線を非表示にします。 |
| `line-height` | No | `25` | 言語の行間（ピクセル）。`normal` レイアウトにのみ適用されます。 |
| `display-format` | No | `time` | 言語ごとの値の表示形式：`time` または `percent`。 |
| `hide` | No | — | 非表示にする言語をカンマ区切りで指定。 |
| `hide-title` | No | `false` | `true` にするとカードのタイトルを非表示にします。 |
| `custom-title` | No | — | カードに表示するカスタムタイトル。 |
| `locale` | No | `en` | カードの表示言語。[ロケール](#ロケール)を参照。 |
| `title-color` | No | テーマの値 | カードのタイトル色。`#` を除いた16進数で指定します。 |
| `text-color` | No | テーマの値 | カードの文字色。`#` を除いた16進数で指定します。 |
| `bg-color` | No | テーマの値 | カードの背景色。`#` を除いた16進数で指定します。 |
| `border-color` | No | テーマの値 | カードの枠線色。`#` を除いた16進数で指定します。 |
| `border-radius` | No | `4.5` | カードの角丸半径（ピクセル）。 |
| `disable-animations` | No | `false` | `true` にするとSVGアニメーションを無効にします。 |

ワークフローの入力値はすべて文字列です。真偽値は `true` または `false` と
記述してください。

### レイアウト

- `normal` は、言語を1行ずつプログレスバーとともに表示します。
- `compact` は、言語を2列に並べ、まとめたプログレスバーとともに表示します。

`line-height` 入力が反映されるのは `normal` レイアウトのみです。`compact`
レイアウトでは固定の行間が使用され、この入力は無視されます。

以下の例では、どちらも同じサンプル統計を使用しています。

| `normal` | `compact` |
| :---: | :---: |
| <img src="docs/examples/wakatime-normal.svg" alt="normalレイアウトのWakaTimeカード" width="420"> | <img src="docs/examples/wakatime-compact.svg" alt="compactレイアウトのWakaTimeカード" width="420"> |

### テーマ

よく使用されるテーマには、`default`、`transparent`、`dark`、`radical`、
`tokyonight`、`onedark`、`dracula`、`nord`、`github_dark`、
`catppuccin_mocha` などがあります。

<details>
<summary>利用可能なテーマをすべて表示</summary>

`default`, `default_repocard`, `transparent`, `shadow_red`, `shadow_green`,
`shadow_blue`, `dark`, `radical`, `merko`, `gruvbox`, `gruvbox_light`,
`tokyonight`, `onedark`, `cobalt`, `synthwave`, `highcontrast`, `dracula`,
`prussian`, `monokai`, `vue`, `vue-dark`, `shades-of-purple`, `nightowl`,
`buefy`, `blue-green`, `algolia`, `great-gatsby`, `darcula`, `bear`,
`solarized-dark`, `solarized-light`, `chartreuse-dark`, `nord`, `gotham`,
`material-palenight`, `graywhite`, `vision-friendly-dark`, `ayu-mirage`,
`midnight-purple`, `calm`, `flag-india`, `omni`, `react`, `jolly`,
`maroongold`, `yeblu`, `blueberry`, `slateorange`, `kacho_ga`, `outrun`,
`ocean_dark`, `city_lights`, `github_dark`, `github_dark_dimmed`,
`discord_old_blurple`, `aura_dark`, `panda`, `noctis_minimus`, `cobalt2`,
`swift`, `aura`, `apprentice`, `moltack`, `codeSTACKr`, `rose_pine`,
`catppuccin_latte`, `catppuccin_mocha`, `date_night`, `one_dark_pro`, `rose`,
`holi`, `neon`, `blue_navy`, `calm_pink`, `ambient_gradient`

</details>

### ロケール

利用可能なロケール値は次のとおりです。

`ar`, `az`, `be`, `bg`, `bn`, `ca`, `cn`, `cs`, `de`, `el`, `en`, `es`,
`fa`, `fi`, `fil`, `fr`, `he`, `hi`, `hu`, `id`, `it`, `ja`, `kr`, `ml`,
`my`, `nl`, `no`, `np`, `pl`, `pt-br`, `pt-pt`, `ro`, `ru`, `sa`, `se`,
`sk`, `sr`, `sr-latn`, `sw`, `ta`, `th`, `tr`, `uk-ua`, `ur`, `uz`, `vi`,
`zh-tw`

### カスタムカラー

色は先頭の `#` を除いた3桁、4桁、6桁、または8桁の16進数で指定します。
例えば `ff0000` や `1f2328` です。`bg-color` 入力では、
`angle,color1,color2` 形式のグラデーションも使用できます。例えば
`90,ffffff,000000` です。

## 注意事項

- 統計情報の対象期間は過去7日間です。
- WakaTimeが直近の活動を集計中の場合があります。このActionは短時間
  リトライし、最新のデータを取得できなければ失敗します。
- 生成先に同名のファイルが存在する場合は上書きされます。
- WakaTime APIキーはSecretとして扱い、漏えいした場合は再発行してください。

## ライセンス

このプロジェクトは[MIT License](LICENSE)のもとで公開されています。
