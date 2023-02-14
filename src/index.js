const express = require('express')
const mysql = require('mysql2')
const config = require('config')
const http = require('http')
const cors = require('cors')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const bcrypt = require("bcrypt");
require('dotenv').config()

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
             username varchar(256) not null,
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

    const apiRouter = require('./api')
    app.use('/api', apiRouter)

    const server = http.createServer(app)
    const port = process.env.PORT || 3000
    server.listen(port)
}
const setupPassport = () => {
    const LocalStrategy = require('passport-local').Strategy
    const passportJwt = require('passport-jwt')
    const JwtStrategy = passportJwt.Strategy
    const ExtractJwt = passportJwt.ExtractJwt
    const opts = {}
    opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
    opts.secretOrKey = process.env.JWT_SECRET
    passport.use(new LocalStrategy({
        usernameField: 'id',
        passwordField: 'password'
    }, (username, password, done) => {
        con.query(
            `select *
             from admins
             where id = ?`, [username]
        ).then(([data, _]) => {
            const userObj = data[0]
            if (userObj) {
                const hashedPassword = userObj.password
                const success = bcrypt.compareSync(password, hashedPassword)
                if (success) {
                    const {id, username} = userObj
                    return done(null, {
                        id: id,
                        username: username
                    })
                }
            }
            return done(null, false)
        })
    }))
    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
        return done(null, jwt_payload)
    }))

}
const main = () => {
    con.connect()
        .then(() => {
            console.log("データベース接続完了")
            setupDatabase()
            setupPassport()
            setupExpress()
        })
        .catch((err) => console.log(`データベースに接続中にエラー：${err}`))
}
main()