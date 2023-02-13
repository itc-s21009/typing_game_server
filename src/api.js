const {SENTENCE_MAX_LENGTH, db} = require("./index");
const uid = require('uid-safe').sync
const bcrypt = require('bcrypt')
const passport = require("passport");
const getSessionId = (req, res) => {
    let sid = req.cookies['session_id']
    if (!sid)
        res.cookie('session_id', sid = uid(24))
    return sid
}
const getRanking = (req, res) =>
    db.query(
        `select rank() over (order by score desc) as place, name, kps, miss, accuracy, score, updated_at
         from records
         order by score desc`
    ).then(([data, _]) => res.json(data))

const getOwnRecord = (req, res) =>
    db.query(
        `select place, name, kps, miss, accuracy, score, updated_at
         from (select rank() over (order by score desc) as place,
                      id,
                      name,
                      kps,
                      miss,
                      accuracy,
                      score,
                      updated_at
               from records) as me
         where id = ?`
        , getSessionId(req, res)
    ).then(([data, _]) => res.json(data))

const postRecord = (req, res) => {
    const {name, kps, miss, accuracy, score} = req.body
    const session_id = getSessionId(req, res)
    db.query(
        `insert
         into records(id, name, kps, miss, accuracy, score)
         values (?, ?, ?, ?, ?, ?)
         on duplicate key
             update name     = if(score > values(score), name, values(name)),
                    kps      = if(score > values(score), kps, values(kps)),
                    miss     = if(score > values(score), miss, values(miss)),
                    accuracy = if(score > values(score), accuracy, values(accuracy)),
                    score    = if(score > values(score), score, values(score)) `
        , [session_id, name, kps, miss, accuracy, score]
    ).then(() => res.end())
}

const getSentence = (req, res) => {
    const min = db.escape(req.query.min ? req.query.min : 0)
    const max = db.escape(req.query.max ? req.query.max : SENTENCE_MAX_LENGTH)
    const limit = db.escape(Math.min(req.query.limit ? req.query.limit : 10, 50))
    const order = req.query.order
    const order_to_query = {
        'new': 'id desc',
        'old': 'id',
        'short': 'length(kana)',
        'long': 'length(kana) desc'
    }
    const q_id = req.query.id ? `and id = ${db.escape(req.query.id)}` : ''
    const q_offset_limit = req.query.page ? `limit ${limit} offset ${(req.query.page - 1) * limit}` : ''
    const q_order_column = order_to_query[order] ? `order by ${order_to_query[order]}` : ''
    db.query(
        `select *
         from sentences
         where char_length(kana) >= ${min}
           and char_length(kana) <= ${max} ${q_id} ${q_order_column} ${q_offset_limit}`
    ).then(([data, _]) => res.json(data))
}

const editSentence = (req, res) => {
    const {id, sentence, kana} = req.body
    db.query(
        `update sentences
         set sentence = ?,
             kana     = ?
         where id = ?`
        , [sentence, kana, id]
    ).then(() => res.end())
}

const deleteSentence = (req, res) => {
    const {id} = req.body
    db.query(
        `delete
         from sentences
         where id = ?`
        , [id]
    ).then(() => res.end())
}

const postSentence = (req, res) => {
    const {sentence, kana} = req.body
    db.query(
        `insert
         into sentences (sentence, kana)
         values (?, ?)`, [sentence, kana]
    ).then(() => res.end())
        .catch((e) => {
            if (e.code === 'ER_DUP_ENTRY') {
                console.log(e.sqlMessage)
            }
            res.end()
        })
}

const setUsername = (req, res) => {
    const {id, password, newUsername} = req.body
    db.query(
        `select *
         from admins
         where id = ?`, [id]
    ).then(([data, _]) => {
        const userObj = data[0]
        if (userObj && bcrypt.compareSync(password, userObj.password)) {
            db.query(
                `update admins
                 set username = ?
                 where id = ?
                `, [newUsername, id]
            ).then(() => {
                res.json({success: true})
            })
        } else {
            res.json({success: false})
        }
    })
}
const setPassword = (req, res) => {
    const {id, password, newPassword} = req.body
    db.query(
        `select *
         from admins
         where id = ?`, [id]
    ).then(([data, _]) => {
        const userObj = data[0]
        if (userObj && bcrypt.compareSync(password, userObj.password)) {
            const newHash = bcrypt.hashSync(newPassword, 10)
            db.query(
                `update admins
                 set password = ?
                 where id = ?
                `, [newHash, id]
            ).then(() => {
                res.json({success: true})
            })
        } else {
            res.json({success: false})
        }
    })
}

const Auth = passport.authenticate('jwt', {session: false})

const createRouter = () => {
    const express = require('express')
    const router = express.Router()
    const passport = require('passport')
    const jwt = require('jsonwebtoken')
    router.get('/ranking', getRanking)
    router.get('/records/me', getOwnRecord)
    router.post('/records/register', postRecord)
    router.get('/sentences', getSentence)
    router.post('/sentences/edit', Auth, editSentence)
    router.post('/sentences/delete', Auth, deleteSentence)
    router.post('/sentences/register', Auth, postSentence)
    router.post('/settings/username', Auth, setUsername)
    router.post('/settings/password', Auth, setPassword)
    router.post('/login', passport.authenticate('local', {session: false}), (req, res) => {
        const payload = {id: req.user.id}
        const token = jwt.sign(payload, process.env.JWT_SECRET)
        res.status(200).json({
            ...req.user,
            token: token
        })
    })

    return router
}
module.exports = createRouter()