const express = require('express')
const session = require('express-session')
const MySQLStore = require('express-mysql-session')(session)
const mysql = require('mysql2')
const config = require('config')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')

const SENTENCE_MAX_LENGTH = 64
const con = mysql.createConnection(config.get("db")).promise()

module.exports = {
    SENTENCE_MAX_LENGTH: SENTENCE_MAX_LENGTH,
    db: con
}

const setupDatabase = () => {
    const log = msg => err => err ? {} : console.log(msg)
    con.query('create database if not exists typing').then(log('データベースを作成'))
    con.query(
        `create table if not exists records
         (
             id         varchar(256)           not null primary key,
             name       varchar(16)            not null,
             kps        decimal(4, 1) unsigned not null,
             miss       int unsigned           not null,
             accuracy   decimal(4, 1) unsigned not null check (accuracy <= 100.0),
             score      int unsigned           not null,
             updated_at datetime default current_timestamp on update current_timestamp
         )`
    ).then(log('recordsテーブルを作成'))
    con.query(
        `create table if not exists sentences
         (
             id       int unsigned                    not null primary key auto_increment,
             sentence varchar(${SENTENCE_MAX_LENGTH}) not null unique,
             kana     varchar(${SENTENCE_MAX_LENGTH}) not null unique
         )`
    ).then(log('sentencesテーブルを作成'))
    con.query(
        `create table if not exists admins
         (
             id       varchar(256) not null primary key,
             password varchar(256) not null
         )`
    ).then(log('adminsテーブルを作成'))
}
const setupExpress = () => {
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

    app.use(session({
        secret: config.get('secret'),
        resave: false,
        saveUninitialized: false,
        store: new MySQLStore({}, con)
    }))

    const apiRouter = require('./api')
    app.use('/api', apiRouter)

    const server = http.createServer(app)
    const port = process.env.PORT || 3000
    server.listen(port)
}
const main = () => {
    con.connect()
        .then(() => {
            console.log("データベース接続完了")
            setupDatabase()
            setupExpress()
        })
        .catch((err) => console.log(`データベースに接続中にエラー：${err}`))
}
main()