const {SENTENCE_MAX_LENGTH, db} = require("./index");
const uid = require('uid-safe').sync
const getSessionId = (req, res) => {
    let sid = req.cookies['session_id']
    if (!sid)
        res.cookie('session_id', sid = uid(24))
    return sid
}
const isAdmin = (req, res) =>
    db.query(
        `select *
         from admins
         where id = ?`
        , getSessionId(req, res), (e, data) => {
            res.json({admin: data.length > 0})
        }
    )
const checkAdmin = (req, res, next) =>
    db.query(
        `select *
         from admins
         where id = ?`
        , getSessionId(req, res), (e, data) => {
            data.length > 0 ? next() : res.end()
        }
    )
const getRanking = (req, res) =>
    db.query(
        `select rank() over (order by score desc) as place, name, kps, miss, accuracy, score, updated_at
         from records
         order by score desc`
        , (e, data) => {
            res.json(data)
        }
    )

const getOwnRecord = (req, res) =>
    db.query(
        `select rank() over (order by score desc) as place, name, kps, miss, accuracy, score, updated_at
         from records
         where id = ?`
        , getSessionId(req, res), (e, data) => {
            res.json(data)
        }
    )

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
        , [session_id, name, kps, miss, accuracy, score], () => res.end()
    )
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
        , (e, data) => [
            res.json(data)
        ]
    )
}

const editSentence = (req, res) => {
    const {id, sentence, kana} = req.body
    db.query(
        `update sentences
         set sentence = ?,
             kana     = ?
         where id = ?
        `, [sentence, kana, id], () => res.end()
    )
}

const deleteSentence = (req, res) => {
    const {id} = req.body
    db.query(
        `delete
         from sentences
         where id = ?
        `, id, () => res.end()
    )
}

const postSentence = (req, res) => {
    const {sentence, kana} = req.body
    db.query(
        `insert
         into sentences (sentence, kana)
         values (?, ?)
        `, [sentence, kana], () => res.end()
    )
}

const createRouter = () => {
    const express = require('express')
    const router = express.Router()
    router.get('/ranking', getRanking)
    router.get('/records/me', getOwnRecord)
    router.post('/records/register', postRecord)
    router.get('/sentences', getSentence)
    router.post('/sentences/edit', checkAdmin, editSentence)
    router.post('/sentences/delete', checkAdmin, deleteSentence)
    router.post('/sentences/register', checkAdmin, postSentence)
    router.get('/testadmin', isAdmin)

    return router
}
module.exports = createRouter()