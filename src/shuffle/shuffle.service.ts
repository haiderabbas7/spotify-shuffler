import { Injectable } from '@nestjs/common';
import { PlaylistService } from '../playlist/playlist.service';
import { TrackService } from '../track/track.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ShuffleService {
    constructor(
        private readonly playlistService: PlaylistService,
        private readonly trackService: TrackService,
        private readonly authService: AuthService,
    ) {}

    async insertionShuffle(playlist_id: string, shuffle_amount: any = null): Promise<any> {
        try {
            const default_shuffle_amount: number = 60;
            let back_off_time: number = 1;
            let successful_shuffles: number = 0;
            const playlist = await this.playlistService.getPlaylistByID(playlist_id);
            const playlist_size: number = playlist.tracks.total;
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
                    await this.playlistService.reorderPlaylistByID(
                        playlist_id,
                        random_index,
                        successful_shuffles,
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
