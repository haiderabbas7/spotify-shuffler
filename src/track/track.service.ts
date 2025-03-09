import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TrackService {
    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
    ) {}

    async getTracksOfPlaylistByID(id: string): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const response = await lastValueFrom(
                this.httpService.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                        limit: 50,
                    },
                }),
            );
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //TODO: mach hier eine methode, die ganz einfach alle Track objekte in einem Array/Liste zurückgibt

    /*TODO: diese methode beachtet nicht den case, wenn eine playlist mehr als 50 songs hat
     *   denn mit dem API call oben kann man nur 50 songs auf einmal bekommen
     *   guck dir endpoint funktioniert, um weitere songs zu bekommen
     *   und pass die methode hier entsprechend an*/
    async getTrackByIndex(playlist_id: string, index: number): Promise<any> {
        try {
            const tracksData = await this.getTracksOfPlaylistByID(playlist_id);
            if (index < 0 || index >= tracksData.items.length) {
                throw new Error(`Index "${index}" is out of bounds`);
            }
            return tracksData.items[index];
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
