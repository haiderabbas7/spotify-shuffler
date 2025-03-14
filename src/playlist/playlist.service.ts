import { Injectable, forwardRef, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { HelperService } from '../helper/helper.service';
import { TrackService } from '../track/track.service';
import { SpotifyApiService } from '../spotify-api/spotify-api.service';

@Injectable()
export class PlaylistService {
    constructor(
        private readonly httpService: HttpService,
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly helperService: HelperService,
        //das löst die Circular Dependency mit TrackService auf, von Copilot und Nest docs
        @Inject(forwardRef(() => TrackService))
        private readonly trackService: TrackService,
        private readonly spotifyApiService: SpotifyApiService,
    ) {}

    isOwnPlaylist(playlist: any): boolean {
        const user_id: any = this.userService.getUserID();
        return playlist.owner.id == user_id;
    }

    //TODO: gleiches ding wie die alte getRecentlyListenedTracks in trackservice
    /*async getListenedPlaylists(date?: Date){
        const optionalDate: Date = date ?? this.helperService.getDateXMinutesBack();
        const listenedTracks: any = await this.trackService.getRecentlyPlayedTracks(optionalDate);
        let playlistIDs: Set<string> = new Set<string>();
        for(const track of listenedTracks){
            if(track.context && track.context.type === "playlist" && track.context.uri){
                //Entfernt den kram am anfang und lässt nur die ID übrig
                const currentPlaylistId = track.context.uri.replace("spotify:playlist:", "");
                playlistIDs.add(currentPlaylistId)
            }
        }
        //wieder in ein Array umwandeln, hab ich von GPT. Sets speichern an sich schon keine doppelten Einträge
        return [...playlistIDs];
    }*/

    async getListenedPlaylists(end_date?: Date) {
        const current_date: Date = new Date();
        const optional_end_date = end_date ?? new Date(current_date.getTime() - 2 * 60 * 60 * 1000);
        const listened_tracks: any =
            await this.trackService.getRecentlyPlayedTracks(optional_end_date);
        const playlist_ids: Set<string> = new Set<string>();
        for (const track of listened_tracks) {
            if (track.context && track.context.type === 'playlist' && track.context.uri) {
                playlist_ids.add(this.helperService.extractIDfromSpotifyURI(track.context.uri));
            }
        }
        //wieder in ein Array umwandeln, hab ich von GPT. Sets speichern an sich schon keine doppelten Einträge
        return [...playlist_ids];
    }

    //TODO: wandel diese methode ganz einfach um dass der den /me endpunkt nutzt
    //  weil an anderen stellen benutze ich auch den me endpunkt, weil es keinen user endpunkt gibt
    //FUNKTIONIERT, BRAUCHT UM DIE 200 BIS 500 MS
    async getOwnPlaylists(): Promise<any> {
        try {
            const user_id: any = this.userService.getUserID();
            let playlists: any[] = [];
            //let nextURL: string = `https://api.spotify.com/v1/users/${user_id}/playlists?offset=0&limit=20`;
            let nextURL: string = `users/${user_id}/playlists?offset=0&limit=20`;
            do {
                const data: any = await this.spotifyApiService.sendGetCall(
                    nextURL.replace('https://api.spotify.com/v1/', ''),
                );
                nextURL = data.next;
                playlists = playlists.concat(data.items);
            } while (nextURL !== null);
            return playlists.filter((playlist) => this.isOwnPlaylist(playlist));
        } catch (error) {
            console.error(error);
        }
    }

    async getPlaylistByID(playlist_id: string): Promise<any> {
        return await this.spotifyApiService.sendGetCall(`playlists/${playlist_id}`, {
            limit: 50,
        });
    }

    async getPlaylistByName(name: string): Promise<any> {
        try {
            const playlists = await this.getOwnPlaylists();
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

    async getPlaylistNameByID(playlist_id: string): Promise<string> {
        try {
            const playlist: any = await this.getPlaylistByID(playlist_id);
            return playlist.name;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
