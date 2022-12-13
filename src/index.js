const connectToDatabase = con => con.connect(err => console.log(err ? `データベースに接続中にエラー：${err}` : "データベース接続完了"))
const setupDatabase = con => {
    const log = msg => err => err ? {} : console.log(msg)
    con.query('create database typing', log('データベースを作成'))
    con.query(
        'create table players (\
           id varchar(32) primary key,\
           name varchar(32) not null\
        )', log('playersテーブルを作成')
    )
    con.query(
        'create table records (\
           player_id varchar(32) primary key,\
           kps double not null,\
           miss int not null,\
           accuracy double not null,\
           score int not null\
        )', log('recordsテーブルを作成')
    )
}
const main = () => {
    const express = require('express')
    const mysql = require('mysql2')
    const config = require('config')
    const app = express()
    const con = mysql.createConnection(config.get("db"))
    connectToDatabase(con)
    setupDatabase(con)
}
main()