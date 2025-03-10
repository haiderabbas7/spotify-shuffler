import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PlaylistService } from '../playlist/playlist.service';

@Injectable()
export class TrackService {
    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly playlistService: PlaylistService,
    ) {}

    /*TODO: überdenk ob ich diese methode brauche
     *   weil durch die nature des endpoints kann ich maximal nur 50 songs auf einmal anfragen
     *   also um alle songs einer zb 1000+ songs playlist zu bekommen brauche ich viele calls und viel zeit
     *   die methode ist möglich und kann ich auch easy umsetzen, aber viel mehr ob die methode nen richtigen nutzen hat du weißt*/
    async getTracksOfPlaylistByID(id: string): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const response = await lastValueFrom(
                this.httpService.get(`https://api.spotify.com/v1/playlists/${id}/tracks`, {
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                    },
                    params: {
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

    async getTrackByIndex(playlist_id: string, index: number): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const playlist_size = await this.playlistService.getPlaylistSizeByID(playlist_id);
            if (index === playlist_size) {
                throw new Error(`Index ${index} is out of bounds`);
            }
            const response = await firstValueFrom(
                this.httpService.get(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks`, {
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                    },
                    params: {
                        limit: 1,
                        offset: index,
                    },
                }),
            );
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
