const createRouter = () => {
    const express = require('express')
    const router = express.Router()
    router.get('/', async (req, res) => {
        res.render('index')
    })
    router.get('/ranking', (req, res) => {
        fetch('http://localhost:3000/api/ranking')
            .then(res => res.json())
            .then(data => res.render('ranking', {data: data}))
    })

    return router
}
module.exports = createRouter()