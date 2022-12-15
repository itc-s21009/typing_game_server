const connectToDatabase = con => con.connect(err => console.log(err ? `データベースに接続中にエラー：${err}` : "データベース接続完了"))
const setupDatabase = con => {
    const log = msg => err => err ? {} : console.log(msg)
    con.query('create database typing', log('データベースを作成'))
    con.query(
        'create table players (\
           id varchar(32) not null,\
           name varchar(32) not null,\
           primary key (id)\
        )', log('playersテーブルを作成')
    )
    con.query(
        'create table records (\
           player_id varchar(32) not null,\
           kps double not null,\
           miss int not null,\
           accuracy double not null,\
           score int not null,\
           updated_at datetime default current_timestamp on update current_timestamp,\
           primary key (player_id),\
           foreign key (player_id) references players(id)\
        )', log('recordsテーブルを作成')
    )
}
const setupExpress = (express, con) => {
    const path = require('path');
    const http = require('http')
    const cors = require('cors')
    const bodyParser = require('body-parser')
    express.set('views', path.join(__dirname, 'views'))
    express.set('view engine', 'pug')

    express.use(cors({origin: "http://localhost:8080"}))

    express.use(bodyParser.urlencoded({
        extended: true
    }))
    express.use(bodyParser.json())

    express.use('/api', require('./routes/api')(con))
    express.use('/', require('./routes/view'))

    const server = http.createServer(express)
    const port = process.env.PORT || 3000
    server.listen(port)
}
const main = () => {
    const express = require('express')
    const mysql = require('mysql2')
    const config = require('config')
    const app = express()
    const con = mysql.createConnection(config.get("db"))
    connectToDatabase(con)
    setupDatabase(con)
    setupExpress(app, con)

    module.exports = con
}
main()