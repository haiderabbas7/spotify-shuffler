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


async function getPlaylists(): Promise<any> {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
            headers: {
                Authorization: 'Bearer ' + access_token,
                limit: 50
            }
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

//Für die Playlist: https://api.spotify.com/v1/playlists/2L1Mq9vGReVgN08y3gMfQM
//Für meinen User: https://api.spotify.com/v1/users/t6ijwf0r16yvskujumkyn78jx
//Für die Tracks: https://api.spotify.com/v1/playlists/2L1Mq9vGReVgN08y3gMfQM/tracks
async function getPlaylistByID(id: String): Promise<any> {
    try {
        const response = await axios.get('https://api.spotify.com/v1/playlists/' + id, {
            headers: {
                Authorization: 'Bearer ' + access_token,
                limit: 50
            }
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function getTracksOfPlaylistByID(id: String): Promise<any> {
    try {
        const response = await axios.get('https://api.spotify.com/v1/playlists/' + id + "/tracks", {
            headers: {
                Authorization: 'Bearer ' + access_token,
                limit: 50
            }
        });
        return response.data;
    } catch (error) {
        console.log(error);
        throw error;
    }
}

app.get('/login', (req: any, res: any) => {
    let scope = 'user-read-private user-read-email playlist-modify-public playlist-modify-private'

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
        res.send(response.data)
    }).catch(error => {
        console.log(error)
        res.status(error.response.status).send(error.response.data)
    })
})

//Für die Playlist: https://api.spotify.com/v1/playlists/2L1Mq9vGReVgN08y3gMfQM
//Für meinen User: https://api.spotify.com/v1/users/t6ijwf0r16yvskujumkyn78jx
//Für die Tracks: https://api.spotify.com/v1/playlists/2L1Mq9vGReVgN08y3gMfQM/tracks
app.get('/test', async (req: any, res: any) => {
    try {
        let data = await getPlaylistByID("2L1Mq9vGReVgN08y3gMfQM");
        res.send(data);
    } catch (error) {
        res.status(500).send('Error fetching playlists');
    }
});

app.listen(port, () => {
    console.log(`Rufe folgende URL auf: ${entry_url}`)
})