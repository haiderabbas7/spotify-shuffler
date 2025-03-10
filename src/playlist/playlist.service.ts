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

    /*TODO: IMPLEMENTIERE DIESE METHODE, ICH BRAUCHE SIE SPÄTER WENN ICH MEHRERE PLAYLISTS SHUFFLEN WILL
     *  schreib die methode hier um für den fall dass man mehr als 50 playlists hat
     *  wie bei den tracks kann man nur 50 songs anfragen und muss mit nem offset arbeiten
     *  würde sagen hier kommen um einiges weniger daten an als wenn man alle tracks einer playlist anfragt
     *  */
    async getPlaylists(): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const playlists = await lastValueFrom(
                this.httpService.get('https://api.spotify.com/v1/me/playlists', {
                    headers: {
                        Authorization: 'Bearer ' + access_token,
                    },
                    params: {
                        limit: 50,
                    },
                }),
            );
            return playlists.data;
        } catch (error) {
            console.error(error);
        }
    }

    async getPlaylistByID(playlist_id: string): Promise<any> {
        try {
            const access_token = await this.authService.getAccessToken();
            const response = await lastValueFrom(
                this.httpService.get(`https://api.spotify.com/v1/playlists/${playlist_id}`, {
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

    async getPlaylistByName(name: string): Promise<any> {
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

    async getPlaylistSizeByID(playlist_id: string): Promise<number> {
        return (await this.getPlaylistByID(playlist_id)).tracks.total;
    }

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
        }
    }
}
