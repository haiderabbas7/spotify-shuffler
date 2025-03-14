import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';
import { HelperService } from '../helper/helper.service';

@Injectable()
export class SpotifyApiService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly helperService: HelperService,
    ) {}

    //TODO: mach hier eine methode für PUT wenn notwendig

    /*GET methode
    * FUNKTIONSPARAMETER
    * hier erstmal accesstoken anfordern
    * URL: https://api.spotify.com/v1/ + aus funktionsparam nehmen
    * headers: Authorization: 'Bearer ' + access_token */

    /**/
}
