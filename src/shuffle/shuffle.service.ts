import { Injectable } from '@nestjs/common';
import { PlaylistService } from '../playlist/playlist.service';
import { TrackService } from '../track/track.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';

@Injectable()
export class ShuffleService {
    private readonly default_shuffle_amount: number = 30;
    constructor(
        private readonly playlistService: PlaylistService,
        private readonly trackService: TrackService,
        private readonly authService: AuthService,
        private readonly userService: UserService,
    ) {}

    async shufflePlaylist(playlist_id: string, shuffle_amount: any = null) {
        const playlist: any = await this.playlistService.getPlaylistByID(playlist_id);
        const playlist_size: number = playlist.tracks.total;
        console.log(`Shuffling playlist ${playlist.name}`);
        if (shuffle_amount === null) {
            //FALL keine shuffle amount angegeben, wir versuchen default_shuffle_amount anzahl an songs zu shufflen, sonst die gesamte playlist
            shuffle_amount =
                playlist_size >= this.default_shuffle_amount
                    ? this.default_shuffle_amount
                    : playlist_size;
        } else {
            //FALL shuffle amount angegeben. Wenn hier shuffle amount zu groß, dann auf playlist_size beschränken, sonst lassen
            shuffle_amount = shuffle_amount >= playlist_size + 1 ? playlist_size : shuffle_amount;
        }
        const snapshot_id: string = await this.insertionShuffle(playlist, shuffle_amount);

        //TODO: hier weitermachen mit persistierung von daten und so
    }

    //FUNKTIONIERT
    async determinePlaylistsToShuffle(): Promise<string[]> {
        const shuffle_these_playlists: Set<string> = new Set<string>();
        /*TODO: überleg ob ich manche playlists doch einfach per default shuffle idfk
           ich habs fürs erste ausgestellt, weil es per track dynamik beim shufflen swayed: playlist wird geshuffled, obwohl nicht gehört*/
        /*const shuffle_these_playlists: Set<string> = new Set<string>([
            '0BfYlDPlZlFpDlJxxGNGWi', //Rock
            '41yP6x49QBGMdkNN7ATj5Y', //Citypop weil hat viele Local songs
        ]);*/

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

    async insertionShuffle(playlist: any, shuffle_amount: any = null): Promise<string> {
        const playlist_id: string = playlist.id;
        const playlist_size: number = playlist.tracks.total;
        let snapshot_id: string = playlist.snapshot_id;
        for (
            let i: number = 0;
            i < shuffle_amount;
            i++
        ) {
            //random number from interval [i; playlist_size-1]
            const random_index =
                Math.floor(Math.random() * (playlist_size - i)) +
                i;

            //wenn random_index gleich i ist, dann würde der song an die gleiche stelle geswapped werden => wir sparen einen API call
            if(random_index !== i){
                snapshot_id = await this.playlistService.reorderPlaylistByID(
                    playlist_id,
                    random_index,
                    i,
                    snapshot_id,
                );
            }
        }
        //returned die letzte snapshot_id damit man vergleichen kann
        return snapshot_id;
    }

    /*async insertionShuffle(playlist_id: string, shuffle_amount: any = null): Promise<any> {
        const playlist = await this.playlistService.getPlaylistByID(playlist_id);
        const playlist_size: number = playlist.tracks.total;
        let snapshot_id: string = playlist.snapshot_id;
        console.log(`Shuffling playlist ${playlist.name}`);
        if (shuffle_amount === null) {
            //FALL keine shuffle amount angegeben, wir versuchen default_shuffle_amount anzahl an songs zu shufflen, sonst die gesamte playlist
            shuffle_amount =
                playlist_size >= this.default_shuffle_amount
                    ? this.default_shuffle_amount
                    : playlist_size;
        } else {
            //FALL shuffle amount angegeben. Wenn hier shuffle amount zu groß, dann auf playlist_size beschränken, sonst lassen
            shuffle_amount =
                shuffle_amount >= playlist_size + 1 ? playlist_size : shuffle_amount;
        }
        for(let successful_shuffles: number = 0; successful_shuffles < shuffle_amount; successful_shuffles++){
            //random number from interval [successful_shuffles; playlist_size-1]
            const random_index =
                Math.floor(Math.random() * (playlist_size - successful_shuffles)) +
                successful_shuffles;
            snapshot_id = await this.playlistService.reorderPlaylistByID(
                playlist_id,
                random_index,
                successful_shuffles,
                snapshot_id,
            );
        }
    }*/
}
