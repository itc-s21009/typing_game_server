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
configの設定が終わったら、起動してください。
```
npm start
```
## configの設定
* `db`: データベースに接続するための設定です。[mysql](https://github.com/mysqljs/mysql#connection-options)の設定が使えます。
* `game-host`: [タイピングゲーム](https://github.com/itc-s21009/typing_game)があるURLを書きます。
## APIの仕様
* `/api/ranking`: ランキングを取得できます。スコアをもとに降順で並べられています。
* `/api/records/me`: 自分自身が登録した記録を取得できます。
