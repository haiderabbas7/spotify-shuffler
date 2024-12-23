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

/**
 * @param id - ID der Playlist
 * @param range_start - Anfang der Sequenz an Liedern, die man reordern will
 * @param range_length - Länge der Sequenz an Liedern, die man reordern will
 * @param insert_before - Position, bevor die Sequenz eingefügt werden soll
 * */
async function reorderPlaylistByID(id: String, range_start: Number, range_length: Number, insert_before: Number): Promise<any> {
    try {
        let data = await getPlaylistByID(id);
        let snapshot_id = data.snapshot_id;
        const response = await axios.put(
            'https://api.spotify.com/v1/playlists/' + id + "/tracks",
            {
                "range_start": range_start,
                "range_length": range_length,
                "insert_before": insert_before,
                "snapshot_id": snapshot_id
            },
            {
                headers: {
                    Authorization: 'Bearer ' + access_token
                }
            }
        );
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
//http://localhost:8088/test
app.get('/test', async (req: any, res: any) => {
    try {
        let data = await reorderPlaylistByID("2L1Mq9vGReVgN08y3gMfQM", 0, 1, 25);
        res.send(data);
    } catch (error) {
        res.status(500).send('Error fetching playlists');
    }
});

app.listen(port, () => {
    console.log(`Rufe folgende URL auf: ${entry_url}`)
})