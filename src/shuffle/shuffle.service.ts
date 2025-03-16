import { Injectable } from '@nestjs/common';
import { PlaylistService } from '../playlist/playlist.service';
import { TrackService } from '../track/track.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ShuffleService {
    constructor(
        private readonly playlistService: PlaylistService,
        private readonly trackService: TrackService,
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    //FUNKTIONIERT
    async determinePlaylistsToShuffle(): Promise<string[]> {
        const shuffle_these_playlists: Set<string> = new Set<string>([
            '0BfYlDPlZlFpDlJxxGNGWi', //Rock
            '41yP6x49QBGMdkNN7ATj5Y', //Citypop weil hat viele Local songs
        ]);

        const listened_playlists: string[] = await this.playlistService.getOwnListenedPlaylists();
        for (const listened_playlist of listened_playlists) {
            shuffle_these_playlists.add(listened_playlist);
        }

        const currently_playing_playlist: any =
            await this.userService.getCurrentlyPlayingPlaylist();
        if (currently_playing_playlist !== '') {
            shuffle_these_playlists.delete(currently_playing_playlist);
        }
        return [...shuffle_these_playlists];
    }

    async insertionShuffle(playlist_id: string, shuffle_amount: any = null): Promise<any> {
        try {
            const default_shuffle_amount: number = 60;
            let back_off_time: number = 1;
            let successful_shuffles: number = 0;
            const playlist = await this.playlistService.getPlaylistByID(playlist_id);
            const playlist_size: number = playlist.tracks.total;
            let snapshot_id: string = playlist.snapshot_id;
            console.log(`Shuffling playlist ${playlist.name}`);
            //wenn kein shuffle amount angegeben, dann einfach gesamte playlist shufflen
            if (shuffle_amount === null) {
                //FALL keine shuffle amount angegeben, wir versuchen default_shuffle_amount anzahl an songs zu shufflen, sonst die gesamte playlist
                shuffle_amount =
                    playlist_size >= default_shuffle_amount
                        ? default_shuffle_amount
                        : playlist_size;
            } else {
                //FALL shuffle amount angegeben. Wenn hier shuffle amoutn zu groß, dann auf playlist_size beschränken, sonst lassen
                shuffle_amount =
                    shuffle_amount >= playlist_size + 1 ? playlist_size : shuffle_amount;
            }
            while (successful_shuffles < shuffle_amount) {
                //random number from interval [successful_shuffles; playlist_size-1]
                const random_index =
                    Math.floor(Math.random() * (playlist_size - successful_shuffles)) +
                    successful_shuffles;
                //const songname = (await this.trackService.getTrackByIndex(access_token, playlist_id, random_index)).track.name;
                try {
                    snapshot_id = await this.playlistService.reorderPlaylistByID(
                        playlist_id,
                        random_index,
                        successful_shuffles,
                        snapshot_id,
                    );
                    //Wenn shuffle kein Error auslöst, dann erst wird successful_shuffle inkrementiert und back_off_time resetted
                    successful_shuffles++;
                    back_off_time = 1;
                } catch (error) {
                    //Wenn 429 rate limit fehler, dann Exponential Backoff
                    if (error.status === 429) {
                        console.warn(`Rate limit exceeded. Waiting...`);
                        await new Promise((resolve) => setTimeout(resolve, back_off_time * 1000));
                        back_off_time *= 2;
                    } else {
                        console.error(error);
                        throw error;
                    }
                }
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
