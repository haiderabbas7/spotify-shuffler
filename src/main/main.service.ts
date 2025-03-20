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
import { LowDbService } from '../low-db/low-db.service';

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
        private readonly lowDBService: LowDbService,
    ) {}

    //TODO: entferne die methode später irgendwann mal, ist nur jetzt zum testen
    //@Cron(CronExpression.EVERY_10_SECONDS)
    async testMain() {
        console.time('shuffle');
        //const test = await this.trackService.getTracksOfPlaylistByID('41yP6x49QBGMdkNN7ATj5Y')
        //const test = await this.trackService.getTracksOfPlaylistByIDOnlyNecessaryInfo('41yP6x49QBGMdkNN7ATj5Y')
        //console.log(test)
        //this.lowDBService.init()
        //console.log(await this.lowDBService.addTrack('aa', 'uri, more like u pee'))
        await this.lowDBService.resetDB();
        await this.shuffleService.dynamicWeightedShuffle('4B2UOzffIG92Kh2PTPqgWi', 2);
        //await this.lowDBService.removeTrack('aa', 'A')
        //await this.startShuffleApplication();
        //await this.shuffleService.insertionShuffle('0BfYlDPlZlFpDlJxxGNGWi')
        console.timeEnd('shuffle');
    }

    @Cron(CronExpression.EVERY_2_HOURS)
    async startShuffleApplication() {
        const playlists_to_shuffle: string[] =
            await this.shuffleService.determinePlaylistsToShuffle();
        if (playlists_to_shuffle === undefined || playlists_to_shuffle.length == 0) {
            console.log('Nothing to shuffle');
        } else {
            if (playlists_to_shuffle) {
                for (const playlist_id of playlists_to_shuffle) {
                    await this.shuffleService.insertionShuffle(playlist_id);
                }
            }
        }
    }
    async testBackground() {
        await (
            await this.helperService.getOpen()
        )('https://www.example.com/');
    }

    /*TODO: eine funktion resetApplication, die halt die anwendung resetted
       soll die persistenten daten in der lowDB löschen und das pm2.log leeren
       calle ich wenn ich app in betrieb nehme und vllt ab und zu zum debugging*/
}
