const execQuery = (con, res, values) => sql => con.query(sql, values, (e, results) => e ? console.log(e) : res.json(results))
const getRanking = (con) => (req, res) =>
    execQuery(con, res)(
        'select * from records\
        order by score desc'
    )
const getId = (con) => (req, res) => {
    execQuery(con, res, req.params.id)(
        'select * from records\
        where player_id = ?'
    )
}


const createRouter = (con) => {
    const express = require('express')
    const router = express.Router()
    router.get('/ranking', getRanking(con))
    router.get('/:id', getId(con))
    return router
}
module.exports = createRouter