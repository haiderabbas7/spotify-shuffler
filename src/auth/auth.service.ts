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

    async getAccessToken(): Promise<any> {
        console.log('Getting access token...');
        let access_token: string | null = await this.cacheManager.get('access_token');
        if (access_token === null) {
            console.log('Refreshing token...');
            access_token = await this.refreshToken();
        }
        return access_token;
    }

    async requestTokens(data: any) {
        try {
            console.log('Requesting first tokens...');
            const post_data = querystring.stringify({
                grant_type: 'authorization_code',
                code: data.code,
                redirect_uri: data.redirect_uri,
            });
            const response = await lastValueFrom(
                this.httpService.post('https://accounts.spotify.com/api/token', post_data, {
                    headers: {
                        Authorization:
                            'Basic ' +
                            Buffer.from(this.client_id + ':' + this.client_secret).toString(
                                'base64',
                            ),
                        'Content-Type': 'application/x-www-form-urlencoded',
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

    async refreshToken(): Promise<any> {
        try {
            const post_data = querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: await this.cacheManager.get('refresh_token'),
            });
            const response = await lastValueFrom(
                this.httpService.post('https://accounts.spotify.com/api/token', post_data, {
                    headers: {
                        Authorization:
                            'Basic ' +
                            Buffer.from(this.client_id + ':' + this.client_secret).toString(
                                'base64',
                            ),
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }),
            );
            //access token is limited to 60 minutes in spotify API
            await Promise.all([
                this.cacheManager.set('access_token', response.data.access_token, 59 * 60 * 1000),
                this.cacheManager.set('refresh_token', response.data.refresh_token),
            ]);
            return response.data.access_token;
        } catch (error) {
            console.error(error);
        }
    }
}
