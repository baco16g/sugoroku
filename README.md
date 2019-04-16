# izapack-starter-kit

## Usage

```bash
# package install
$ npm i

# start server
$ npm start

# preview
$ npm run preview

# publish
$ npm run publish

# test
$ npm test

# export coverage
$ npm test -- --coverage
```

## Commit Message Format
コミットメッセージは以下のフォーマットで入力します。  

```
<type>(<scope>): <subject>

<body>

<footer>
```
`type`と`subject`は必須ですが、`scope`、`body`、`footer`は省略が可能です。  

#### Type
`type`は下記の中から必ず一つ選択します。

* **feat**: 新機能や新要素の追加
* **fix**: バグ、不具合、表示崩れ等の修正
* **docs**: README等のドキュメントに対する変更、追加(ソースコードに対する変更は含まない)
* **style**: ソースコードのフォーマットなど、スクリプトの挙動やコンパイル結果には影響を及ぼさない修正
* **refactor**: ソースコードへのリファクタリング
* **perf**: パフォーマンス改善を目的としたソースコードへの変更
* **test**: テストコードの追加や既存のテストコードに対する修正(ソースコードに対する変更は含まない)
* **chore**: ビルドプロセスやツール、使用するライブラリの追加や変更(ソースコードに対する変更は含まない)

#### Scope(optional)
`scope`は、そのコミットによる変更の影響範囲が識別できるものなら何でも構いません。  
例えば変更したファイル名やモジュール名、影響範囲が多岐にわたる場合は`*`を使用することもできます。  

#### Description
`description`には、そのコミットによる変更点の要約を、命令形、なおかつ現在形を用いて記します。
その際、最初の一文字目は大文字にしないでください。また、末尾にドットを使わないでください。

#### Body, Footer(optional)
`type`、`scope`、`description`では情報が不十分、もしくは制限によって入力しきれなかった場合は、ボディ、フッターを入力します。  
ボディには、その変更を実施した理由と、変更をしなかった場合どういう挙動になるのかを、より詳しく明記します。  
フッターは、主にissueへの参照を記載します。

#### commitizen
[commitizen](http://commitizen.github.io/cz-cli/)を使用することで、対話形式でコミットメッセージを入力することができます。


## Git Commit Hooks
#### pre-commit
[lint-staged](https://github.com/okonet/lint-staged)を用いて、**ステージされた`./src/scripts/`配下の`.ts(.js)`ファイルと`./src/styles/`配下の`.styl`ファイルに対してのみ**、下記ルールに沿って、静的解析、各種フォーマットを実行します。  
`tslint`においてエラーが発見された場合、そのコミットはリジェクトされますが、その他はautofixされ、そのままコミットされます。

```json
"lint-staged": {
  "./src/scripts/**/*.(t|j)s": [
    "tslint",
    "prettier --write",
    "git add"
  ],
  "./src/styles/**/*.styl": [
    "stylus-supremacy format glob --replace --options ./supremacy.json",
    "git add"
  ]
}
```

#### prepate-commit-msg
[commitlint](https://github.com/marionebl/commitlint)を用いてコミットメッセージに対するバリデーションを行います。  
ルールは`./.commitlintrc.js`で設定しています。

## Test
テストツールは[jest](https://jestjs.io/)を使用します。  
テストファイルは`./src/__tests__/配下`に格納するか、もしくはファイル名に`*.spec.ts(js)`か`*.test.ts(js)`のsuffixを付与してください。  

#### Dummyクラスのテスト例
Dummyクラス(`./src/scripts/modules/Dummy.ts`)は、自身がnewされるトリガーとなったDOMのinnerHTMLを取得できるメソッド`getInnerHtml`を持っています。  
以下のような時、`getInnerHtml`は`Hello`を返します。
```html
<div data-module="dummy">Hello</div>
```

この`getInnerHtml`メソッドをテストする場合以下のようなテストコードを書きます。

```typescript
// ./src/__tests__/Dummy.ts

// テスト対象のDummyクラスをimport
// エイリアスを張っているので../scripts/modules/Dummyと書く必要はない
import Dummy from 'modules/Dummy'

// 仮想DOM
document.body.innerHTML = `
  <div id="root">Hello</div>
`

// 以下Dummyクラスのテスト
describe('Dummy class', () => {
  // 仮想DOM<div id="root">Hello</div>を引数にDummyクラスをnewする
  const dummy = new Dummy(document.getElementById('root'), {})

  // getInnerHtmlメソッドのテスト
  it('should return innerHTML', () => {
    // 期待値
    const expected = 'Hello'

    // .toEqualは実際の返り値と期待値が一致するかどうか
    expect(dummy.getInnerHtml(dummy.getElem())).toEqual(expected)
  })
})
```
