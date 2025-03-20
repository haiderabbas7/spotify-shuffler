import { Injectable } from '@nestjs/common';
import { PlaylistService } from '../playlist/playlist.service';
import { TrackService } from '../track/track.service';
import { AuthService } from '../auth/auth.service';
import { UserService } from '../user/user.service';
import { HelperService } from '../helper/helper.service';
import { LowDbService } from '../low-db/low-db.service';
import * as lodash from 'lodash';

@Injectable()
export class ShuffleService {
    private readonly default_shuffle_amount: number = 30;
    private base_weight: number = 50;
    constructor(
        private readonly playlistService: PlaylistService,
        private readonly trackService: TrackService,
        private readonly authService: AuthService,
        private readonly userService: UserService,
        private readonly helperService: HelperService,
        private readonly lowDBService: LowDbService,
    ) {}

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

    async dynamicWeightedShuffle(playlist_id: string, shuffle_amount: any = null) {
        const playlist = await this.playlistService.getPlaylistByIDOnlyNecessaryInfo(playlist_id);
        const playlist_size = playlist.total;
        const playlist_name = playlist.name;
        console.log(`Shuffling playlist ${playlist_name}`);
        let all_tracks = await this.trackService.getTracksOfPlaylistByIDOnlyNecessaryInfo(playlist_id);
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
        let final_weighted_tracks: any[];
        const was_playlist_shuffled = await this.lowDBService.doesPlaylistExist(playlist_id)
        const new_snapshot_id = playlist.snapshot_id;
        //FALL playlist wurde schon mal geshuffled
        if (was_playlist_shuffled) {

            let weighted_tracks = await this.lowDBService.getTracks(playlist_id);
            const old_snapshot_id = (await this.lowDBService.getPlaylist(playlist_id))?.snapshot_id;
            if (new_snapshot_id !== old_snapshot_id) {
                //TODO: der gesamte code hier in der if bedingung ist von gpt

                // Berechne die Tracks, die hinzugefügt oder entfernt werden müssen
                const weighted_tracks_uris = weighted_tracks.map((track) => track.uri);
                const all_tracks_uris = all_tracks.map((item) => item.track.uri);

                // Tracks, die in all_tracks sind, aber nicht in weighted_tracks (Hinzufügen)
                const tracks_to_add = lodash
                    .differenceBy(all_tracks, weighted_tracks, 'track.uri')
                    .map((item) => ({
                        uri: item.track.uri,
                        weight: this.base_weight,
                    }));

                // Tracks, die in weighted_tracks sind, aber nicht in all_tracks (Löschen)
                const tracks_to_remove = lodash.differenceBy(weighted_tracks, all_tracks, 'uri');

                // Tracks zum Hinzufügen in weighted_tracks
                for (const track of tracks_to_add) {
                    await this.lowDBService.addTrack(playlist_id, track.uri, track.weight);
                }

                // Tracks zum Löschen aus weighted_tracks
                for (const track of tracks_to_remove) {
                    await this.lowDBService.removeTrack(playlist_id, track.uri);
                }

                // Jetzt könnte weighted_tracks aktualisiert werden, falls notwendig
                weighted_tracks = await this.lowDBService.getTracks(playlist_id);
            }
            const shuffled_tracks = all_tracks.slice(this.default_shuffle_amount);

            final_weighted_tracks = weighted_tracks.map(async (track) => {
                //TODO: der gesamte code hier im map ist von gpt

                // Wenn der Track in den letzten geshuffelten Tracks ist
                const isInShuffledTracks = shuffled_tracks.some(
                    (shuffledTrack) => shuffledTrack.track.uri === track.uri,
                );

                // Anpassung des Gewichts
                if (isInShuffledTracks) {
                    // Reduziere das Gewicht für Tracks, die im letzten Shuffle waren (z.B. halbieren)
                    track.weight = Math.max(track.weight * 0.5, 1); // Verhindert, dass das Gewicht unter 1 fällt
                } else {
                    // Erhöhe das Gewicht für Tracks, die nicht im letzten Shuffle waren (z.B. um 10%)
                    track.weight = Math.min(track.weight * 1.1, 100); // Verhindert, dass das Gewicht über 100 steigt
                }
                await this.lowDBService.updateWeight(playlist_id, track.uri, track.weight)
                return track;
            });
        }
        //FALL playlist wurde noch nie geshuffled, daher kein eintrag in der lowdb
        else {
            await this.lowDBService.addPlaylist(playlist_id);
            for(const track of all_tracks){
                await this.lowDBService.addTrack(playlist_id, track.track.uri, this.base_weight)
            }
            final_weighted_tracks = await this.lowDBService.getTracks(playlist_id);
        }
        let snapshot_id_after_shuffle: string = new_snapshot_id;
        for(let i = 0; i < shuffle_amount; i++){
            const chosen_track = this.helperService.getWeightedRandom(final_weighted_tracks);
            console.log(`track_index: ${chosen_track.uri}`)
            // Finde den meepmoop des ausgewählten Tracks
            const meepmoop = final_weighted_tracks.findIndex(track => track.uri === chosen_track.uri);


            // Falls der Track gefunden wurde, entferne ihn
            final_weighted_tracks.splice(meepmoop, 1);
            for(const track of final_weighted_tracks){
                console.log(track.uri);
            }



            const track_index = all_tracks.findIndex(track => track.track.uri === chosen_track.uri)
            console.log(`track_index: ${track_index}`)




            /*TODO: das shuffling ging durch für eine neue playlist, musst aber noch mit console logs gucken ob es richtig ist
            *  und dann noch den viel schlimmeren code für shufflign einer schon mal geshuffleden playlist testen und nachvollziehen*/




            snapshot_id_after_shuffle = await this.playlistService.reorderPlaylistByID(
                playlist_id,
                track_index,
                i,
                snapshot_id_after_shuffle,
            );
            all_tracks.splice(i, 0, all_tracks.splice(track_index, 1)[0]); // Dies wird den Track an die i-te Position verschieben
        }

        await this.lowDBService.setSnapshotID(playlist_id, snapshot_id_after_shuffle);
    }

    async insertionShuffle(playlist_id: string, shuffle_amount: any = null): Promise<any> {
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
            shuffle_amount = shuffle_amount >= playlist_size + 1 ? playlist_size : shuffle_amount;
        }
        for (
            let successful_shuffles: number = 0;
            successful_shuffles < shuffle_amount;
            successful_shuffles++
        ) {
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
    }

    /*async shufflePlaylist(playlist_id: string, shuffle_amount: any = null) {
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
    }*/
}
