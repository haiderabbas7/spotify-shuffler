import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthService } from '../auth/auth.service';
import { PlaylistService } from '../playlist/playlist.service';
import { HelperService } from '../helper/helper.service';
import { SpotifyApiService } from '../spotify-api/spotify-api.service';

@Injectable()
export class TrackService {
    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        //das löst die Circular Dependency mit PlaylistService auf, von Copilot und Nest docs
        @Inject(forwardRef(() => PlaylistService))
        private readonly playlistService: PlaylistService,
        private readonly helperService: HelperService,
        private readonly spotifyApiService: SpotifyApiService,
    ) {}

    /*TODO: IMPLEMENTIERE DIESE METHODE, ICH BRAUCHE SIE BEIM ROULETTE PRINZIP DING
     *  guck bei playlist wie das da gemacht wurde, ist ez as fuck*/
    async getTracksOfPlaylistByID(id: string): Promise<any> {
        return await this.spotifyApiService.sendGetCall(`playlists/${id}/tracks`, { limit: 50 });
    }

    async getTrackByIndex(playlist_id: string, index: number): Promise<any> {
        try {
            const playlist_size = await this.playlistService.getPlaylistSizeByID(playlist_id);
            if (index === playlist_size) {
                throw new Error(`Index ${index} is out of bounds`);
            }
            return await this.spotifyApiService.sendGetCall(`playlists/${playlist_id}/tracks`, {
                limit: 1,
                offset: index,
            });
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    //TODO: die methode ist nicht schlecht, aber der Endpoint funktioniert nicht mehr so wie er soll
    //  behalt die Methode fürs erste noch
    //wenn kein Date angegeben so wird das Datum vor zwei Stunden genommen
    /*async getRecentlyPlayedTracks(date?: Date){
        try {
            const unix_timestamp = await this.helperService.getUnixTimestamp()
            const optionalDate = date ?? this.helperService.getDateXMinutesBack()
            console.log("date:" + optionalDate)
            const timestamp = unix_timestamp.fromDate(optionalDate);
            console.log("timestamp: " + timestamp)
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
    }*/

    /**
     * Angepasste methode für den kaputte unzuverlässigen endpoint
     * basically man gibt ein end_date an und die methode liefert alle Tracks, die zwischen JETZT und diesem end date gehört wurden
     * gibt man kein enddate, so werden einfach die songs returned, die in den letzten zwei stunden gehört wurden
     * */
    async getRecentlyPlayedTracks(end_date?: Date): Promise<any> {
        try {
            const unix_timestamp_now = (await this.helperService.getUnixTimestamp()).now();

            const current_date: Date = new Date();
            const past_date: Date =
                end_date ?? new Date(current_date.getTime() - 2 * 60 * 60 * 1000);

            const final_tracks: any[] = [];
            const received_tracks: any = await this.spotifyApiService.sendGetCall(
                `me/player/recently-played?limit=50&after=${unix_timestamp_now}`,
            );

            for (const track of received_tracks.items) {
                const track_played_at = new Date(track.played_at);
                if (track_played_at >= past_date) {
                    final_tracks.push(track);
                }
            }
            return final_tracks;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    /* TODO: schreib hier eine methode isLocalSong, welches für ein Track objekt returned, ob es ein local file ist
        ganz einfach damit ich es an anderen stellen nutzen kann
     */
}
