import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';
import { HelperService } from '../helper/helper.service';

@Injectable()
export class UserService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly helperService: HelperService,
    ) {}

    getUserID() {
        return this.configService.get<string>('MY_USER_ID');
    }

    //FUNKTIONIERT
    async getCurrentlyPlayingPlaylist(): Promise<string | null> {
        try {
            const access_token = await this.authService.getAccessToken();
            const { data } = await lastValueFrom(
                this.httpService.get(`https://api.spotify.com/v1/me/player`, {
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                    },
                }),
            );
            if (data.is_playing && data.context && data.context.type === 'playlist') {
                return this.helperService.extractIDfromSpotifyURI(data.context.uri)
            } else {
                return null;
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
