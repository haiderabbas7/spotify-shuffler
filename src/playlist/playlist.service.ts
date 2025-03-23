import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
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

    async getOwnListenedPlaylists(x_hours_back: number = 3): Promise<string[]> {
        const current_date: Date = new Date();
        const optional_end_date = new Date(current_date.getTime() - x_hours_back * 60 * 60 * 1000);
        const listened_tracks: any =
            await this.trackService.getRecentlyPlayedTracks(optional_end_date);
        const playlist_ids: Set<string> = new Set<string>();

        //DIESER STEP IST WICHTIG! dadurch dass ich immer neu frage, welche playlists ich habe, werden keine gelöschten geshuffled
        const ownPlaylists = await this.getOwnPlaylists();

        // Abgleich mit den Playlists, die der Nutzer gehört hat
        for (const track of listened_tracks) {
            if (track.context && track.context.type === 'playlist' && track.context.uri) {
                const playlist_id = this.helperService.extractIDfromSpotifyURI(track.context.uri);
                //er fügt die playlist_id nur ein, wenn es meine eigene playlist ist
                if (ownPlaylists.some((playlist) => playlist.id === playlist_id)) {
                    playlist_ids.add(playlist_id);
                }
            }
        }
        return [...playlist_ids];
    }

    async getOwnPlaylists(): Promise<any> {
        try {
            const user_id: any = this.userService.getUserID();
            let playlists: any[] = [];
            let nextURL: string = `me/playlists?offset=0&limit=20`;
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
    //FUNKTIONIERT, BRAUCHT UM DIE 200 BIS 500 MS
    /*async getOwnPlaylists(): Promise<any> {
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
    }*/

    async getPlaylistByIDOnlyNecessaryInfo(playlist_id: string) {
        return await this.getPlaylistByID(playlist_id, 'name,snapshot_id,tracks.total');
    }

    async getPlaylistByID(playlist_id: string, fields: string = ''): Promise<any> {
        return await this.spotifyApiService.sendGetCall(`playlists/${playlist_id}`, {
            ...(fields && { fields }),
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
        snapshot_id: string = '',
        range_length: number = 1,
    ): Promise<string> {
        try {
            const response = await this.spotifyApiService.sendPutCall(
                `playlists/${playlist_id}/tracks`,
                {
                    range_start,
                    range_length,
                    insert_before,
                    //wenn snapshot_id gesetzt, dann wird es eingefügt
                    ...(snapshot_id && { snapshot_id }),
                },
            );
            //returned nicht das Objekt mit einem string attribut, sondern den string selber
            return response.snapshot_id;
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
