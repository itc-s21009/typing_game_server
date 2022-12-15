const uid = require('uid-safe').sync
const getSessionId = (req, res) => {
    let sid = req.cookies['session_id']
    if (!sid)
        res.cookie('session_id', sid = uid(24))
    return sid
}
const execQuery = (con, res, values) => sql => con.query(sql, values, (e, results) => e ? res.json({code: e.code}) : res.json(results))
const getRanking = (con) => (req, res) =>
    execQuery(con, res)(
        'select name, kps, miss, accuracy, score, updated_at\
        from records\
        order by score desc'
    )

const getRecordById = (con) => (req, res) =>
    execQuery(con, res, req.params.id)(
        'select name, kps, miss, accuracy, score, updated_at\
        from records\
        where id = ?'
    )

const postRecord = (con) => (req, res) => {
    const {name, kps, miss, accuracy, score} = req.body
    const session_id = getSessionId(req, res)
    execQuery(con, res, [session_id, name, kps, miss, accuracy, score])(
        'insert into records (session_id, name, kps, miss, accuracy, score)\
        values (?, ?, ?, ?, ?, ?)\
        on duplicate key update\
        name = if(score > values(score), name, values(name)),\
        kps = if(score > values(score), kps, values(kps)),\
        miss = if(score > values(score), miss, values(miss)),\
        accuracy = if(score > values(score), accuracy, values(accuracy)),\
        score = if(score > values(score), score, values(score))'
    )
}

const createRouter = (con) => {
    const express = require('express')
    const router = express.Router()
    router.get('/ranking', getRanking(con))
    router.get('/records/:id', getRecordById(con))
    router.post('/records/register', postRecord(con))

    return router
}
module.exports = createRouter