import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HelperService } from '../helper/helper.service';
import { ShuffleService } from '../shuffle/shuffle.service';
import { PlaylistService } from '../playlist/playlist.service';
import { TrackService } from '../track/track.service';
import { UserService } from '../user/user.service';

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
        await this.startShuffleApplication();
        //console.log(test);
        console.timeEnd('shuffle');
    }

    async startShuffleApplication() {
        const playlists_to_shuffle: string[] = await this.shuffleService.determinePlaylistsToShuffle();
        for(const playlist of playlists_to_shuffle){
            await this.shuffleService.insertionShuffle(playlist)
        }
    }
}
