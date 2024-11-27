import axios from 'axios'
import * as querystring from "node:querystring"
import * as dotenv from 'dotenv'
import * as crypto from 'crypto'

dotenv.config()

const express = require('express')
const app = express()
const port = 8088

var entry_url = "http://localhost:" + port + "/login"
var client_id = process.env.CLIENT_ID
var client_secret = process.env.CLIENT_SECRET
var redirect_uri = "http://localhost:" + port + "/"
var state = crypto.randomBytes(16).toString('hex')
var refresh_token = ""
var access_token = ""

async function getProfile() {
    axios.get('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: 'Bearer ' + access_token
        }
    }).then(response => {
        return response.data
    }).catch(error => {
        console.log(error)
    })
}

app.get('/login', (req: any, res: any) => {
    let scope = 'user-read-private user-read-email'

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }))
})

app.get('/', (req: any, res: any) => {
    let code = req.query.code
    let received_state = req.query.state

    if (!received_state || received_state !== state) {
        return res.status(400).send('Invalid state parameter')
    }

    const data = querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
    })

    axios.post('https://accounts.spotify.com/api/token', data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
        }
    }).then(response => {
        access_token = response.data.access_token
        refresh_token = response.data.refresh_token
    }).catch(error => {
        console.log(error)
        res.status(error.response.status).send(error.response.data)
    })
})

app.get('/test', (req: any, res: any) => {
    res.send(getProfile())
})

app.listen(port, () => {
    console.log(`Rufe folgende URL auf: ${entry_url}`)
})