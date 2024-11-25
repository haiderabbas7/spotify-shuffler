//IMPORTS
import axios from 'axios'
import * as querystring from "node:querystring"

//GLOBALS
var entry_url = "http://localhost:8080/login"
var client_id = "ee425c7c8e6145229201dc4c908501b0"
var client_secret = "c77d8772e1844bc69334510d26a16f45"
var redirect_uri = 'http://localhost:8080/'

var refresh_token = ""

//CONSTANTS
const express = require('express')
const app = express()
const port = 8080

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
        console.log(response.data)
        res.send(response.data)
    }).catch(error => {
        console.log(error)
        res.status(error.response.status).send(error.response.data)
    })
})

app.listen(port, () => {
    console.log(`Rufe folgende URL auf: ${entry_url}`)
})
