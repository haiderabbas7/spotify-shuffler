import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class PlaylistService {
    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
    ) {}

    async getPlaylists(): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const playlists = await lastValueFrom(
                this.httpService.get('https://api.spotify.com/v1/me/playlists', {
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                        limit: 50,
                    },
                }),
            );
            return playlists.data;
        } catch (error) {
            console.error(error);
        }
    }

    async getPlaylistByID(id: string): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const response = await lastValueFrom(
                this.httpService.get(`https://api.spotify.com/v1/playlists/${id}`, {
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

    async getPlaylistByName( name: string): Promise<any> {
        try {
            const playlists = await this.getPlaylists();
            const playlist = playlists.items.find((playlist: any) => playlist.name === name);
            if (!playlist) {
                throw new Error(`Playlist with name ${name} not found`);
            }
            return playlist;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getPlaylist(
        identifier: string,
        is_name: boolean = false,
    ): Promise<any> {
        let data: any;
        if (is_name) {
            data = await this.getPlaylistByName(identifier);
        } else {
            data = await this.getPlaylistByID(identifier);
        }
        return data;
    }

    /*TODO: prüf ob der shuffle auch für local songs geht. müsste aber eigentlich*/

    async reorderPlaylistByID(
        playlist_id: string,
        range_start: number,
        insert_before: number,
        range_length: number = 1,
    ): Promise<any> {
        try {
            //const playlist_data = await this.getPlaylistByID(access_token, playlist_id);
            //const snapshot_id = playlist_data.snapshot_id;
            const access_token = await this.authService.getAccessToken();

            const response = await lastValueFrom(
                this.httpService.put(
                    `https://api.spotify.com/v1/playlists/${playlist_id}/tracks`,
                    {
                        range_start: range_start,
                        range_length: range_length,
                        insert_before: insert_before,
                        //snapshot_id: snapshot_id,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${access_token}`,
                        },
                    },
                ),
            );
            return response.data;
        } catch (error) {
            console.error(error);
            throw error;
            //TODO: bau hier oder beim return darüber ein, dass Fehler wie 429 API rate limit zurückgegeben werden, damit ich sie an anderen Stellen behandeln kann
            //  dafür vielleicht Exception logik? also dass ich die exceptions handle, und wenn nicht handled wird ein error geworfen
        }
    }
}
