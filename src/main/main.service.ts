import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { HelperService } from '../helper/helper.service';
import { ShuffleService } from '../shuffle/shuffle.service';
import { Cron, CronExpression } from '@nestjs/schedule';
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
        const test = await this.userService.getCurrentlyPlayingPlaylist();
        console.log(test);
        console.timeEnd('shuffle');
    }

    async startShuffleApplication() {
        /*TODO: füg hier VOR dem shufflen ganz einfach ein, dass er nicht shufflen soll, wenn ich gerade musik höre
         *  ganz einfach die eine methode vom userService abfragen und mit einer if bedingung abfrühstücken*/
    }
}
