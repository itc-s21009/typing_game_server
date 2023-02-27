# typing_game_server
タイピングゲームのデータAPI
## 起動
```
# リポジトリをクローンする
git clone https://github.com/itc-s21009/typing_game_server.git
# クローンしたフォルダに移動する
cd typing_game_server
# 必要なパッケージをダウンロードする
npm i
```
下記の設定が終わったら、起動してください。
```
npm start
```
## 設定
### config
* `db`: データベースに接続するための設定です。[mysql](https://github.com/mysqljs/mysql#connection-options)の設定が使えます。
* `game-host`: [タイピングゲーム](https://github.com/itc-s21009/typing_game)があるURLを書きます。
### .env
* `JWT_SECRET`: JWTの秘密鍵の値を適当に入れます。
## APIの仕様
* `GET /api/ranking`: ランキングを取得できます。スコアをもとに降順で並べられています。
* `GET /api/records/me`: 自分自身が登録した記録を取得できます。
* `POST /api/records/register`: 記録を登録できます。
* `GET /api/sentences`: 文章一覧を取得できます。
* `POST /api/login`: 管理者IDとパスワードを検証して、成功した場合はトークンを生成して返します。
### 以下は認証が必要なものです
* `POST /api/sentences/edit`: 文章を編集できます。
* `POST /api/sentences/delete`: 文章を削除できます。
* `POST /api/sentences/register`: 文章を登録できます。
* `POST /api/settings/username`: 管理者ユーザー名を変更できます。
* `POST /api/settings/password`: パスワードを変更できます。
