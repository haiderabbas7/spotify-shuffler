import { Controller, Get, Inject, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './auth/auth.service';
import { ShuffleService } from './shuffle/shuffle.service';
import { PlaylistService } from './playlist/playlist.service';
import { TrackService } from './track/track.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import * as querystring from 'node:querystring';
import { MainService } from './main/main.service';

@Controller()
export class AppController {
    private scope: any;
    private client_id: any;
    private redirect_uri: any;
    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly shuffleService: ShuffleService,
        private readonly playlistService: PlaylistService,
        private readonly trackService: TrackService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly mainService: MainService,
    ) {
        this.scope =
            'user-read-playback-state user-read-recently-played playlist-modify-public playlist-modify-private';
        this.client_id = this.configService.get<string>('CLIENT_ID');
        this.redirect_uri = 'http://localhost:' + this.configService.get<string>('PORT') + '/';
    }

    @Get()
    @Redirect()
    login() {
        return {
            url:
                'https://accounts.spotify.com/authorize?' +
                querystring.stringify({
                    response_type: 'code',
                    client_id: this.client_id,
                    scope: this.scope,
                    redirect_uri: this.redirect_uri + 'start',
                }),
        };
    }

    @Get('/start')
    async startApplication(@Req() req: Request) {
        await this.authService.requestTokens({
            redirect_uri: this.redirect_uri + 'start',
            code: req.query.code,
        });

        //TODO: mach das hier später weg, war nur zum testen. aber ist ne gute idee um eine methode direkt aufzurufen
        this.mainService.testMain();

        /*TODO: google nochmal ordentlich, ob sich eine möglichkeit finden lässt, mit dem ich den tab hier schließen kann
         *  weil ich gib mich nicht geschlagen damit, dass man den Tab selber schließen muss*/

        return `
        <html lang="en">
        <head>
            <title>My Spotify Shuffler</title>
            <style>
                body {
                    background-color: #333;
                    color: white;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    font-size: 2em;
                    font-family: Papyrus,serif;
                }
            </style>
        </head>
        <body>
            <p>Close the tab vro...👅👅👅👅👅</p>
        </body>
        </html>
    `;
    }

    @Get('/shuffle')
    async shuffle(@Req() req: Request) {
        this.mainService.startShuffleApplication();
    }

    //OPTIONAL: mach hier eine route config, womit ich vllt paar sachen konfigurieren kann. wird halt iwie persistiert
}
