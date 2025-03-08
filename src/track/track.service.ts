import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TrackService {
    constructor(private readonly httpService: HttpService) {}

    async getTracksOfPlaylistByID(access_token: string, id: string): Promise<any> {
        try {
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
    async getTrackByIndex(access_token: string, playlist_id: string, index: number): Promise<any> {
        try {
            const tracksData = await this.getTracksOfPlaylistByID(access_token, playlist_id);
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
