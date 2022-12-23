const uid = require('uid-safe').sync
const getSessionId = (req, res) => {
    let sid = req.cookies['session_id']
    if (!sid)
        res.cookie('session_id', sid = uid(24))
    return sid
}
const isAdmin = (con) => (req, res) =>
    con.query(
        `select *
         from admins
         where id = ?`
        , getSessionId(req, res), (e, data) => {
            res.json({admin: data.length > 0})
        }
    )
const checkAdmin = (con) => (req, res, next) =>
    con.query(
        `select *
         from admins
         where id = ?`
        , getSessionId(req, res), (e, data) => {
            data.length > 0 ? next() : res.end()
        }
    )
const getRanking = (con) => (req, res) =>
    con.query(
        `select rank() over (order by score desc) as place, name, kps, miss, accuracy, score, updated_at
         from records
         order by score desc`
        , (e, data) => {
            res.json(data)
        }
    )

const getOwnRecord = (con) => (req, res) =>
    con.query(
        `select rank() over (order by score desc) as place, name, kps, miss, accuracy, score, updated_at
         from records
         where id = ?`
        , getSessionId(req, res), (e, data) => {
            res.json(data)
        }
    )

const postRecord = (con) => (req, res) => {
    const {name, kps, miss, accuracy, score} = req.body
    const session_id = getSessionId(req, res)
    con.query(
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

const getSentence = (con) => (req, res) => {
    const min = req.query.min ? req.query.min : 0
    const max = req.query.max ? req.query.max : 64
    con.query(
        `select *
         from sentences
         where char_length(kana) >= ?
           and char_length(kana) <= ? ${req.query.id ? 'and id = ?' : ''}`
        , [min, max, req.query.id], (e, data) => [
            res.json(data)
        ]
    )
}

const editSentence = (con) => (req, res) => {
    const {id, sentence, kana} = req.body
    con.query(
        `update sentences
         set sentence = ?,
             kana     = ?
         where id = ?
        `, [sentence, kana, id], () => res.end()
    )
}

const deleteSentence = (con) => (req, res) => {
    const {id} = req.body
    con.query(
        `delete
         from sentences
         where id = ?
        `, id, () => res.end()
    )
}

const postSentence = (con) => (req, res) => {
    const {sentence, kana} = req.body
    con.query(
        `insert
         into sentences (sentence, kana)
         values (?, ?)
        `, [sentence, kana], () => res.end()
    )
}

const createRouter = (con) => {
    const express = require('express')
    const router = express.Router()
    router.get('/ranking', getRanking(con))
    router.get('/records/me', getOwnRecord(con))
    router.post('/records/register', postRecord(con))
    router.get('/sentences', checkAdmin(con), getSentence(con))
    router.post('/sentences/edit', checkAdmin(con), editSentence(con))
    router.post('/sentences/delete', checkAdmin(con), deleteSentence(con))
    router.post('/sentences/register', checkAdmin(con), postSentence(con))
    router.get('/testadmin', isAdmin(con))

    return router
}
module.exports = createRouter