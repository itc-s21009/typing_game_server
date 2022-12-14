const execQuery = (con, res, values) => sql => con.query(sql, values, (e, results) => e ? res.json({code: e.code}) : res.json(results))
const getRanking = (con) => (req, res) =>
    execQuery(con, res)(
        'select p.name, r.kps, r.miss, r.accuracy, r.score\
        from records as r\
        join players as p\
        on p.id = r.player_id\
        order by score desc'
    )
const getRecordById = (con) => (req, res) => {
    execQuery(con, res, req.params.id)(
        'select p.name, r.kps, r.miss, r.accuracy, r.score\
        from records as r\
        join players as p\
        on p.id = r.player_id\
        where player_id = ?'
    )
}
const postRecord = (con) => (req, res) => {
    const {player_id, kps, miss, accuracy, score} = req.body
    execQuery(con, res, [player_id, kps, miss, accuracy, score])(
        'insert into records (player_id, kps, miss, accuracy, score)\
        values (?, ?, ?, ?, ?)\
        on duplicate key update\
        kps = if(score > values(score), kps, values(kps)),\
        miss = if(score > values(score), miss, values(miss)),\
        accuracy = if(score > values(score), accuracy, values(accuracy)),\
        score = if(score > values(score), score, values(score))'
    )
}
const postPlayer = (con) => (req, res) => {
    const {id, name} = req.body
    execQuery(con, res, [id, name])(
        'insert ignore into players values (?, ?)'
    )
}

const createRouter = (con) => {
    const express = require('express')
    const router = express.Router()
    router.get('/ranking', getRanking(con))
    router.get('/records/:id', getRecordById(con))
    router.post('/records/register', postRecord(con))
    router.post('/players/register', postPlayer(con))

    return router
}
module.exports = createRouter