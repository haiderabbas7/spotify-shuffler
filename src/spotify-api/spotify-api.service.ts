import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';
import { HelperService } from '../helper/helper.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpotifyApiService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly helperService: HelperService,
    ) {}

    //TODO: mach hier methoden für die weiteren HTTP methoden wie POST, DELETE oder PUT wenn notwendig

    async sendGetCall(endpoint: string, params: Record<string, any> = {}): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const { data } = await firstValueFrom(
                this.httpService.get(`https://api.spotify.com/v1/${endpoint}`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`,
                    },
                    params,
                }),
            );
            return data;
        } catch (error) {
            console.error(`Fehler beim API-Call an ${endpoint}:`, error);
            throw error;
        }
    }
}
