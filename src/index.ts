//IMPORTS
import axios from 'axios'
import * as querystring from "node:querystring"
import * as dotenv from 'dotenv'

dotenv.config()

//GLOBALS
var entry_url = "http://localhost:8080/login"
var client_id = process.env.CLIENT_ID
var client_secret = process.env.CLIENT_SECRET
var redirect_uri = 'http://localhost:8080/'
var refresh_token = ""
var access_token = ""

//CONSTANTS
const express = require('express')
const app = express()
const port = 8080

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
    //hier umschreiben dass ein random string erstellt wird, für sicherheit idfk
    var state = "abcdefghijklmnop"
    var scope = 'user-read-private user-read-email'

    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }))
})

/*
HIER BEKOMMST DU VOM REDIRECT EIN GET ATTRIBUT code UND state
code ist "An authorization code that can be exchanged for an access token."
und state ist "The value of the state parameter supplied in the request.", also muss der gleiche sein wie im Login oben
ab hier automatisiert mit ajax anfragen machen*/
app.get('/', (req: any, res: any) => {
    let code = req.query.code
    let state = req.query.state

    // Überprüfe den state-Wert
    if (!state || state !== "abcdefghijklmnop") {
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
