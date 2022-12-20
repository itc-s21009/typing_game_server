const express = require('express')
const mysql = require('mysql2')
const config = require('config')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const apiRouter = require('./api')
const connectToDatabase = con => con.connect(err => console.log(err ? `データベースに接続中にエラー：${err}` : "データベース接続完了"))
const setupDatabase = con => {
    const log = msg => err => err ? {} : console.log(msg)
    con.query('create database typing', log('データベースを作成'))
    con.query(
        'create table records (\
            id varchar(256) not null primary key,\
            name varchar(16) not null,\
            kps decimal(4, 1) unsigned not null,\
            miss int unsigned not null,\
            accuracy decimal(4, 1) unsigned not null check(accuracy <= 100.0),\
            score int unsigned not null,\
            updated_at datetime default current_timestamp on update current_timestamp\
        )', log('recordsテーブルを作成')
    )
    con.query(
        'create table sentences (\
            id int unsigned not null primary key auto_increment,\
            sentence varchar(64) not null unique,\
            kana varchar(64) not null unique\
        )', log('sentencesテーブルを作成')
    )
    con.query(
        'create table admins (\
            id varchar(256) not null primary key\
        )', log('adminsテーブルを作成')
    )
}
const setupExpress = (con) => {
    const app = express()

    app.use(cors({
        origin: config.get('game-host'),
        credentials: true
    }))

    app.use(cookieParser())

    app.use(bodyParser.urlencoded({
        extended: true
    }))
    app.use(bodyParser.json())

    app.use('/api', apiRouter(con))

    const server = http.createServer(app)
    const port = process.env.PORT || 3000
    server.listen(port)
}
const main = () => {
    const con = mysql.createConnection(config.get("db"))
    connectToDatabase(con)
    setupDatabase(con)
    setupExpress(con)

    module.exports = con
}
main()