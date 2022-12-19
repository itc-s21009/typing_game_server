const axios = require("axios");
const render = (res, pug) => d => {
    const data = d.data
    data.error
        ? res.render('error', {error: data.error})
        : res.render(pug, {data: data})
}

const createRouter = () => {
    const express = require('express')
    const router = express.Router()
    const api = axios.create({baseURL: 'http://localhost:3000/api'})
    router.get('/', async (req, res) => {
        res.render('index')
    })
    router.get('/ranking', (req, res) => {
        api.get(`/ranking`)
            .then(render(res, 'ranking'))
    })
    router.get('/sentences', (req, res) => {
        api.get(`/sentences`, {headers: {Cookie: req.headers.cookie}})
            .then(render(res, 'sentences'))
    })
    router.get('/sentences/edit/:id', (req, res) => {
        api.get(`/sentences?id=${req.params.id}`, {headers: {Cookie: req.headers.cookie}})
            .then(render(res, 'edit_sentence'))
    })

    return router
}
module.exports = createRouter()