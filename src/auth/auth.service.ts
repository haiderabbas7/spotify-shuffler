import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as querystring from 'node:querystring';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';


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


    async requestTokens(data: any){
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
            /*TODO: hier die tokens nicht returnen, sondern direkt in cache schreiben, accesstoken mit TTL von 59 minuten, also 59 * 60 * 1000 = 3540000ms*/

        } catch (error) {
            console.error(error);
        }
    }

    /*TODO: hier eine methode refreshToken schreiben, die einfach das token refreshed du weißt
    *  und joa die tokens in cache schreibt mit den TTLs */

    /*TODO: hier eine neue methode getTokens, welches die Schnittstelle für alle Services sind, um das Accesstoken zu bekommen
    *  logik ist ganz einfach er guckt ob das access token undefined ist, wenn nicht dann gibt er es einfach an die methoden zurück
    *  wenn es undefined ist, dann muss refreshed werden. darauf wartet er, bevor er das token dann aus dem cache ausliest*/
}
