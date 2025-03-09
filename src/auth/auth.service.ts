import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as querystring from 'node:querystring';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
    private client_id: any;
    private client_secret: any;
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
        this.client_id = this.configService.get<string>('CLIENT_ID');
        this.client_secret = this.configService.get<string>('CLIENT_SECRET');
    }

    /*TODO: kann ich den step VOR dem request der Tokens auch hier in einer Service methode unterbringen
     *  der step würde dann die requestTokens methode hier drunter aufrufen
     *  und damit wäre dann hier im auth service alles was mit auth zu tun hat
     *  wenn nicht dann kapsel das sonst in einen AuthController idfk*/

    async requestTokens(data: any) {
        const query_params = querystring.stringify({
            code: data.code,
            redirect_uri: data.redirect_uri,
            grant_type: 'authorization_code',
        });

        try {
            const response = await lastValueFrom(
                this.httpService.post('https://accounts.spotify.com/api/token', query_params, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization:
                            'Basic ' +
                            Buffer.from(this.client_id + ':' + this.client_secret).toString(
                                'base64',
                            ),
                    },
                }),
            );
            //access token is limited to 60 minutes in spotify API
            await Promise.all([
                this.cacheManager.set('access_token', response.data.access_token, 59 * 60 * 1000),
                this.cacheManager.set('refresh_token', response.data.refresh_token),
            ]);
        } catch (error) {
            console.error(error);
        }
    }

    /*TODO: hier eine methode refreshToken schreiben, die einfach das token refreshed du weißt
     *  und joa die tokens in cache schreibt mit den TTLs
     *  die methode soll das access token auch returnen, damit ich mir ein await unten sparen kann*/
    async refreshToken(): Promise<string> {
        return 'lol';
    }

    async getAccessToken(): Promise<any> {
        let access_token: string | null = await this.cacheManager.get('access_token');
        if (access_token === null) {
            access_token = await this.refreshToken();
        }
        return access_token;
    }
}
