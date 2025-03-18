import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';
import { HelperService } from '../helper/helper.service';
import { SpotifyApiService } from '../spotify-api/spotify-api.service';

@Injectable()
export class UserService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly helperService: HelperService,
        private readonly spotifyApiService: SpotifyApiService,
    ) {}

    getUserID() {
        return this.configService.get<string>('MY_USER_ID');
    }

    //FUNKTIONIERT
    /*OPTIONAL: benutz stattdessen den Endpoint /me/player/currently-playing,
       der macht genau das gleiche, aber ist vllt schneller weil weniger daten übermittelt werden als bei me/player? idk
       ABER ACHTUNG: der braucht scope user-read-currently-playing, und nicht den anderen mit playback state*/
    async getCurrentlyPlayingPlaylist(): Promise<string | null> {
        try {
            const data: any = await this.spotifyApiService.sendGetCall(`me/player`);
            if (data.is_playing && data.context.type === 'playlist') {
                return this.helperService.extractIDfromSpotifyURI(data.context.uri);
            } else {
                return null;
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
