import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { OpenService } from '../open/open.service';
import { ShuffleService } from '../shuffle/shuffle.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MainService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
        private readonly openService: OpenService,
        private readonly shuffleService: ShuffleService,
    ) {}

    @Cron(CronExpression.EVERY_10_SECONDS)
    async startShuffleApplication() {
        console.time('shuffle');
        await this.shuffleService.insertionShuffle('4B2UOzffIG92Kh2PTPqgWi', 5);
        console.timeEnd('shuffle');
    }
}
