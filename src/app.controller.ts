import { Controller, Get, Inject, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './auth/auth.service';
import { ShuffleService } from './shuffle/shuffle.service';
import { PlaylistService } from './playlist/playlist.service';
import { TrackService } from './track/track.service';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { OpenService } from './open/open.service';
import * as querystring from 'node:querystring';

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
        private readonly openService: OpenService,
    ) {
        this.scope =
            'user-read-private user-read-email playlist-modify-public playlist-modify-private';
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
    async shuffle(@Req() req: Request) {
        await this.authService.requestTokens({
            redirect_uri: this.redirect_uri + 'start',
            code: req.query.code,
        });

        /*TODO: google nochmal ordentlich, ob sich eine möglichkeit finden lässt, mit dem ich den tab hier schließen kann
         *  weil ich gib mich nicht geschlagen damit, dass man den Tab selber schließen muss*/

        return `
        <html lang="en">
        <head>
            <title>My Spotify Shuffler</title>
            <style>
                body {
                    background-color: #333; /* Dunkelgrauer Hintergrund */
                    color: white; /* Weiße Schriftfarbe */
                    display: flex; /* Flexbox für zentrierte Ausrichtung */
                    justify-content: center; /* Horizontale Zentrierung */
                    align-items: center; /* Vertikale Zentrierung */
                    height: 100vh; /* Volle Höhe des Viewports */
                    margin: 0; /* Kein Margin */
                    font-size: 2em; /* Große Schriftgröße */
                    font-family: Papyrus,serif;
                }
            </style>
        </head>
        <body>
            <p>Close the window vro...</p>
        </body>
        </html>
    `;
    }

    //TODO: mach hier eine route shuffle, womit ich das shuffling ganz einfach selber anstoßen kann

    //OPTIONAL TODO: mach hier eine route config, womit ich vllt paar sachen konfigurieren kann. wird halt iwie persistiert

    @Get('/test')
    async test(@Req() req: Request) {
        //const { default: open } = await import('open');
        //await open('https://google.com');
        await (
            await this.openService.getOpen()
        )('https://google.com');
    }
}
