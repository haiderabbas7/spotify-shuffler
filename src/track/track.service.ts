import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, from, lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PlaylistService } from '../playlist/playlist.service';
import { HelperService } from '../helper/helper.service';
import unix_timestamp from 'unix-timestamp';
import * as stream from 'node:stream';

@Injectable()
export class TrackService {
    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly playlistService: PlaylistService,
        private readonly helperService: HelperService,
    ) {
        unix_timestamp.round = true
    }

    /*TODO: IMPLEMENTIERE DIESE METHODE, ICH BRAUCHE SIE BEIM ROULETTE PRINZIP DING
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

    //TODO: MUSST TESTEN OB DIESE METHODE FUNKTIONIERT
    //wenn kein Date angegeben so wird das Datum vor zwei Stunden genommen
    async getRecentlyPlayedTracks(date?: Date){
        try {
            const optionalDate = date ?? this.helperService.getDateXMinutesBack()
            const timestamp = unix_timestamp.fromDate(optionalDate);
            let tracks: any[] = [];
            let nextURL: string = `https://api.spotify.com/v1/me/player/recently-played?limit=50&after=${timestamp}`
            do {
                const access_token = await this.authService.getAccessToken();
                const { data } = await lastValueFrom(
                    this.httpService.get(nextURL, {
                        headers: {
                            Authorization: 'Bearer ' + access_token,
                        },
                    }),
                );
                nextURL = data.next;
                tracks = tracks.concat(data.items)
            } while (nextURL !== null);
            return tracks;
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
}
