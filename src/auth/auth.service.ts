import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as querystring from 'node:querystring';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { lastValueFrom } from 'rxjs';
import { HelperService } from '../helper/helper.service';

@Injectable()
export class AuthService {
    private client_id: any;
    private client_secret: any;
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly helperService: HelperService,
    ) {
        this.client_id = this.configService.get<string>('CLIENT_ID');
        this.client_secret = this.configService.get<string>('CLIENT_SECRET');
    }

    async getAccessToken(): Promise<any> {
        let access_token: string | null = await this.cacheManager.get('access_token');
        if (access_token === null) {
            access_token = await this.refreshToken();
        }
        return access_token;
    }

    async requestTokens(data: any) {
        this.helperService.printWithTimestamp('Requesting initial tokens...');
        const response = await this.finalizePostCall(
            querystring.stringify({
                grant_type: 'authorization_code',
                code: data.code,
                redirect_uri: data.redirect_uri,
            }),
        );
        await Promise.all([
            this.cacheManager.set('access_token', response.access_token, 0.45 * 60 * 1000),
            this.cacheManager.set('refresh_token', response.refresh_token, 0),
        ]);
    }

    async refreshToken(): Promise<any> {
        this.helperService.printWithTimestamp('Refreshing access token...');
        const response = await this.finalizePostCall(
            querystring.stringify({
                grant_type: 'refresh_token',
                refresh_token: await this.cacheManager.get('refresh_token'),
            }),
        );
        await this.cacheManager.set('access_token', response.access_token, 0.45 * 60 * 1000);
        return response.access_token;
    }

    private async finalizePostCall(post_data: any): Promise<any> {
        try {
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
            return response.data;
        } catch (error) {
            console.error(error);
        }
    }
}
