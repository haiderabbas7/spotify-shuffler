import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HelperService } from '../helper/helper.service';
import { ShuffleService } from '../shuffle/shuffle.service';
import { PlaylistService } from '../playlist/playlist.service';
import { TrackService } from '../track/track.service';
import { UserService } from '../user/user.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MainService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly helperService: HelperService,
        private readonly shuffleService: ShuffleService,
        private readonly playlistService: PlaylistService,
        private readonly trackService: TrackService,
        private readonly userService: UserService,
    ) {}

    //TODO: entferne die methode später irgendwann mal, ist nur jetzt zum testen
    //@Cron(CronExpression.EVERY_10_SECONDS)
    async testMain() {
        console.time('shuffle');
        //await this.shuffleService.insertionShuffle('4B2UOzffIG92Kh2PTPqgWi', 5);
        //const test = await this.playlistService.getListenedPlaylists();
        //const test = await this.userService.getCurrentlyPlayingPlaylist();
        //const test = await this.trackService.getTrackByIndex('4B2UOzffIG92Kh2PTPqgWi', 2)
        //const test = await this.playlistService.getOwnPlaylists();
        //const test = await this.shuffleService.determinePlaylistsToShuffle()


        /*const playlist_old = await this.playlistService.getPlaylistByID('4B2UOzffIG92Kh2PTPqgWi')
        const snapshot_id_old = playlist_old.snapshot_id
        const current_date_old: Date = new Date();
        console.log(current_date_old + ": " + snapshot_id_old);

        await this.shuffleService.shufflePlaylist('4B2UOzffIG92Kh2PTPqgWi')

        const playlist = await this.playlistService.getPlaylistByID('4B2UOzffIG92Kh2PTPqgWi')
        const snapshot_id = playlist.snapshot_id
        const current_date: Date = new Date();
        console.log(current_date + ": " + snapshot_id);*/


        //NEUER SNAPSHOT ID TEST
        /*const playlist = await this.playlistService.getPlaylistByID('4B2UOzffIG92Kh2PTPqgWi')
        const snapshot_id = playlist.snapshot_id
        const current_date: Date = new Date();
        console.log(current_date + ": " + snapshot_id);
        await this.playlistService.reorderPlaylistByID('4B2UOzffIG92Kh2PTPqgWi', 5, 2)
        const playlist_new = await this.playlistService.getPlaylistByID('4B2UOzffIG92Kh2PTPqgWi')
        const snapshot_id_new = playlist_new.snapshot_id
        const current_date_new: Date = new Date();
        console.log(current_date_new + ": " + snapshot_id_new);*/

        await this.startShuffleApplication();
        console.timeEnd('shuffle');
    }

    //TODO: hier kommt die Cron expression von einer stunde dran
    async startShuffleApplication() {
        const playlists_to_shuffle: string[] = await this.shuffleService.determinePlaylistsToShuffle();
        if (playlists_to_shuffle === undefined || playlists_to_shuffle.length == 0) {
            console.log("Nothing to shuffle")
        }
        else{
            if(playlists_to_shuffle){
                for(const playlist_id of playlists_to_shuffle){
                    await this.shuffleService.shufflePlaylist(playlist_id)
                }
            }
        }
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async testBackground(){
        await (
            await this.helperService.getOpen()
        )('https://www.example.com/');
    }

    /*TODO: eine funktion resetApplication, die halt die anwendung resetted
       soll die persistenten daten in der lowDB löschen und das pm2.log leeren
       calle ich wenn ich app in betrieb nehme und vllt ab und zu zum debugging*/
}
