<div align="center" style="margin: 20px;">
<img src="https://github.com/mkybdev/utol_mod_ts/blob/main/misc/utol_mod_logo.png?raw=true" alt="demo" style="width: 30%; margin: 10px">

<a href="https://github.com/HayatoHongo/utol_mod_ts_for_aiken/releases/tag/v0" id="dlLink" style="font-size: 1.1rem; font-weight: bold; display: block; padding-top: 200px; margin-top: -200px;">Download (ZIP)</a>

</div>

# UTOL Mod

UTOL の非公式 Chrome 拡張機能です。

UTOL のさまざまなカスタマイズが可能です。\
オプションで各機能の有効・無効を切り替えることができます。

## 機能

### すべてのページで適用される機能

- **サイドメニューを強制的に隠す**

  - UTOL の仕様上、すべてのページで読み込み時にサイドメニューが開いてしまう現象に対処できます。

- **PDF ファイルへのリンククリック時の確認ダイアログをスキップ**

  - PDF ファイルへのリンクをクリックした際に表示される、表示するかダウンロードするかを選択するダイアログをスキップし、直接 PDF ファイルを表示する（開く）ことができます。

  - ダウンロードする際は開いた後の UI でダウンロードするか、リンクの右クリックメニューにアクセスしてください。

- **ヘッダー部分に「時間割ボタン」を表示**

  - すべてのページで直接時間割ページにアクセスできるボタンが表示されます。

  - この機能を有効にすると、ヘッダー部分に特定の条件で表示される「一つ前のページに戻る」ボタンが非表示になります。

- **ヘッダー右上部の名前を非表示**

  - ヘッダーに表示される名前を非表示にし、スクリーンショットへの映り込み等を防ぎます。

- **ダークモード**

  - ダークモード／ライトモードの切り替えボタンが表示され、テーマの切り替えが可能になります。

  - 色反転によるダークモードのため、一部の画像やアイコンが正常に表示されない場合があります。

### 時間割ページで適用される機能

<div align="center" style="margin: 30px;">
<img src="https://github.com/mkybdev/utol_mod_ts/blob/main/misc/notice_fold.gif?raw=true" alt="demo" loop=infinite>
</div>

- **「重要なお知らせ」と「緊急のお知らせ」を自動的に折りたたむ**

  - 「重要なお知らせ」および「緊急のお知らせ」部分を、バナーをクリックすると展開するアコーディオンメニュー形式に変更します。

- **「提出状況一覧」の「課題・テスト・アンケート一覧」を表示**

  - サイドメニューから「提出状況一覧」にアクセスしなくても、時間割ページから直接課題の提出状況を確認できます。

  - 提出済みの課題を非表示にすることもできます。

<div align="center" style="margin: 30px;">
<img src="https://github.com/mkybdev/utol_mod_ts/blob/main/misc/add_schedule.gif?raw=true" alt="demo" loop=infinite>
</div>

- **時間割に任意の予定を追加**

  - 時間割表に任意の予定（タイトル・内容・期間）を追加できます。

  - 予定は各コマに１つだけ追加でき、現段階では予定の追加・削除のみ可能です。

  - この機能を有効にすると「予定を追加」ボタンが表示され、右端の時間割のアイコンが非表示になります。

- **「集中コース等」の一覧から「東大生のためのワークルール入門」を削除**

  - 多くの学生にとって不要な情報である「東大生のためのワークルール入門」の項目が削除されます。

### その他の機能

- **自動ログイン（試験的）**

  - ログアウトされている状態で UTOL にアクセスすると自動的にログインします。

  - セキュリティ上の問題が発生したり、UTOL が正しく動作しない可能性があります（現段階では特に問題は発生しないことを確認済みです）。

## 各種設定

<div align="center" style="margin: 20px;">
<img src="https://github.com/mkybdev/utol_mod_ts/blob/main/misc/options.gif?raw=true" alt="demo" loop=infinite style="width: 50%;">
</div>

- Chrome の拡張機能一覧からオプション画面にアクセスできます。

- 各機能の有効／無効を選択できます。

## インストール方法

簡単なインストール方法は以下の通りです。

1. 上記の <a href="#dlLink">"Download (ZIP)" リンク</a> から ZIP ファイルをダウンロードします。

2. ダウンロードした ZIP ファイルを解凍します。

3. Chrome の拡張機能ページ（[`chrome://extensions/`](chrome://extensions/)）を開きます。

4. ページ右上の「デベロッパーモード」を有効にします。

5. ページ左上の「パッケージ化されていない拡張機能を読み込む」ボタンをクリックし、先ほど解凍したフォルダを選択します。

6. 拡張機能が追加されたら、UTOL にアクセスして拡張機能が有効になっていることを確認します。

## 備考

- この拡張機能は非公式のものであり、UTOL の開発者とは一切関係ありません。

  - そのため、UTOL の仕様変更により正常に動作しなくなったり、開発者によって利用が禁止される可能性があります。

  - あくまで自己責任でご利用ください。

- この拡張機能の改良は歓迎しますが、無許可での再配布はご遠慮ください。

### 開発手順

```bash
# After cloning this repository
npm install
npm run build # Generating "dist" directory: the extension file
```

## Powered By

TypeScript, Vite, [Darkmode.js](https://github.com/sandoche/Darkmode.js), [ICOOON MONO](https://icooon-mono.com/)
