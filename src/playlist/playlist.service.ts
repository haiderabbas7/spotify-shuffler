import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PlaylistService {
    constructor(private readonly httpService: HttpService) {}

    async getPlaylists(access_token: string): Promise<any> {
        try {
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

    async getPlaylistByID(access_token: string, id: string): Promise<any> {
        try {
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

    async getPlaylistByName(access_token: string, name: string): Promise<any> {
        try {
            const playlists = await this.getPlaylists(access_token);
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
        access_token: string,
        identifier: string,
        is_name: boolean = false,
    ): Promise<any> {
        let data;
        if (is_name) {
            data = await this.getPlaylistByName(access_token, identifier);
        } else {
            data = await this.getPlaylistByID(access_token, identifier);
        }
        return data;
    }

    async reorderPlaylistByID(
        access_token: string,
        playlist_id: string,
        range_start: number,
        insert_before: number,
        range_length: number = 1,
    ): Promise<any> {
        try {
            //TODO: brauche ich snapshot ID überhaupt? weil das hier ist einfach noch ein await. wenn ja dann überleg dir was
            //const playlist_data = await this.getPlaylistByID(access_token, playlist_id);
            //const snapshot_id = playlist_data.snapshot_id;

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
