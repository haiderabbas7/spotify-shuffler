"use strict";
//URL ZUM TESTEN: http://localhost:8080/login
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//IMPORTS
const axios_1 = __importDefault(require("axios"));
const querystring = __importStar(require("node:querystring"));
//GLOBALS
var client_id = "ee425c7c8e6145229201dc4c908501b0";
var client_secret = "c77d8772e1844bc69334510d26a16f45";
var redirect_uri = 'http://localhost:8080/';
var refresh_token = "";
//CONSTANTS
const express = require('express');
const app = express();
const port = 8080;
app.get('/login', (req, res) => {
    //hier umschreiben dass ein random string erstellt wird, für sicherheit idfk
    var state = "abcdefghijklmnop";
    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});
/*
HIER BEKOMMST DU VOM REDIRECT EIN GET ATTRIBUT code UND state
code ist "An authorization code that can be exchanged for an access token."
und state ist "The value of the state parameter supplied in the request.", also muss der gleiche sein wie im Login oben
ab hier automatisiert mit ajax anfragen machen*/
app.get('/', (req, res) => {
    let code = req.query.code;
    let state = req.query.state;
    // Überprüfe den state-Wert
    if (!state || state !== "abcdefghijklmnop") {
        return res.status(400).send('Invalid state parameter');
    }
    const data = querystring.stringify({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
    });
    axios_1.default.post('https://accounts.spotify.com/api/token', data, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
        }
    }).then(response => {
        console.log(response.data);
        res.send(response.data);
    }).catch(error => {
        console.log(error);
        res.status(error.response.status).send(error.response.data);
    });
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
