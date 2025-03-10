import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { PlaylistService } from '../playlist/playlist.service';
import { TrackService } from '../track/track.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ShuffleService {
    private last_shuffle_amount: number;
    constructor(
        private readonly httpService: HttpService,
        private readonly playlistService: PlaylistService,
        private readonly trackService: TrackService,
        private readonly authService: AuthService,
    ) {
        this.last_shuffle_amount = 0;
    }

    async insertionShuffle(playlist_id: string, shuffle_amount: any = null): Promise<any> {
        try {
            let back_off_time: number = 1;
            let successful_shuffles: number = 0;
            const playlist = await this.playlistService.getPlaylistByID(playlist_id);
            const playlist_size: number = playlist.tracks.total;
            console.log(`Shuffling playlist ${playlist.name}`);
            //wenn kein shuffle amount angegeben, dann einfach gesamte playlist shufflen
            if (shuffle_amount === null) {
                shuffle_amount = playlist_size;
            }
            if (shuffle_amount >= playlist_size + 1) {
                throw new Error(`Shuffle amount "${shuffle_amount}" is too large`);
            }
            while (successful_shuffles < shuffle_amount) {
                //random number from interval [i + last_shuffle_amount; playlist_size-1], meaning a random song from the last unshuffled set
                const random_index =
                    Math.floor(
                        Math.random() *
                            (playlist_size - (successful_shuffles + this.last_shuffle_amount)),
                    ) +
                    (successful_shuffles + this.last_shuffle_amount);
                //const songname = (await this.trackService.getTrackByIndex(access_token, playlist_id, random_index)).track.name;
                try {
                    await this.playlistService.reorderPlaylistByID(
                        playlist_id,
                        random_index,
                        successful_shuffles,
                    );
                    //Wenn shuffle kein Error auslöst, dann erst wird successful_shuffle inkrementiert
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
                //console.log(`Step ${i}: Shuffled song ${random_index} with name "${songname}" to front`)
            }
            //if the whole playlist is shuffled then the next shuffle goes over the entire playlist
            this.last_shuffle_amount = shuffle_amount == playlist_size ? 0 : shuffle_amount;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    async getOpen(): Promise<any> {
        const module = await (eval(`import('open')`) as Promise<any>);
        return module.default;
    }
}
