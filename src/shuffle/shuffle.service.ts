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

    async insertionShuffle(
        playlist_id: string,
        shuffle_amount: any = null,
    ): Promise<any> {
        try {
            const playlist = await this.playlistService.getPlaylistByID(playlist_id);
            const playlist_size: number = playlist.tracks.total;
            console.log(`Shuffling playlist ${playlist.name}`);
            if (shuffle_amount === null) {
                shuffle_amount = playlist_size;
            }
            if (shuffle_amount >= playlist_size + 1) {
                throw new Error(`Shuffle amount "${shuffle_amount}" is too large`);
            }
            for (let i = 0; i < shuffle_amount; i++) {
                //random_index from interval [i + last_shuffle_amount; playlist_size-1], meaning a random song from the unshuffled rest from the last shuffle
                const random_index =
                    Math.floor(Math.random() * (playlist_size - (i + this.last_shuffle_amount))) +
                    (i + this.last_shuffle_amount);
                //const songname = (await this.trackService.getTrackByIndex(access_token, playlist_id, random_index)).track.name;
                await this.playlistService.reorderPlaylistByID(
                    playlist_id,
                    random_index,
                    i,
                );
                //console.log(`Step ${i}: Shuffled song ${random_index} with name "${songname}" to front`)
                /*TODO: bau hier Logik ein, um das Rate Limit zu umgehen und dass bei einem erreichen des Limits keine Fehler passieren
                 *  Vielleicht einen kurzen Sleep einbauen, musst rumprobieren wie kurz der am besten sein kann
                 *  Und dass wenn ich einen 429 API Rate limit fehler bekomme, dass der pausiert und in beim gleichen Ort weitermacht du weißt*/
            }
            //if the whole playlist is shuffled then the next shuffle goes over the entire playlist
            this.last_shuffle_amount = shuffle_amount == playlist_size ? 0 : shuffle_amount;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
