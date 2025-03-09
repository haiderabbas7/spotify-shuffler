import { Controller, Get, Inject, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';
import { HttpService } from '@nestjs/axios';
import { AuthService } from './auth/auth.service';
import { ShuffleService } from './shuffle/shuffle.service';
import { PlaylistService } from './playlist/playlist.service';
import { TrackService } from './track/track.service';
import * as querystring from 'node:querystring';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

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
                    redirect_uri: this.redirect_uri + 'shuffle',
                }),
        };
    }

    @Get('/shuffle')
    async shuffle(@Req() req: Request) {
        await this.authService.requestTokens({
            redirect_uri: this.redirect_uri + 'shuffle',
            code: req.query.code,
        });
        console.time('shuffle');
        await this.shuffleService.insertionShuffle('0BfYlDPlZlFpDlJxxGNGWi', 60);
        /*await this.playlistService.reorderPlaylistByID
            tokens.access_token,
            '4B2UOzffIG92Kh2PTPqgWi',
            25,
            1,
            )*/

        /*const daten = await this.trackService.getTrackByIndex(tokens.access_token, '4B2UOzffIG92Kh2PTPqgWi', 0)
        console.log(daten)*/

        console.timeEnd('shuffle');
    }

    @Get('/test')
    getHello(): string {
        return 'test!';
    }
}
