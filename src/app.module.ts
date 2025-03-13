import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HttpModule } from '@nestjs/axios';
import { ShuffleService } from './shuffle/shuffle.service';
import { AuthService } from './auth/auth.service';
import { PlaylistService } from './playlist/playlist.service';
import { TrackService } from './track/track.service';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { MainService } from './main/main.service';
import { UserService } from './user/user.service';
import { HelperService } from './helper/helper.service';

@Module({
    imports: [
        HttpModule,
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CacheModule.register({
            isGlobal: true,
        }),
        ScheduleModule.forRoot(),
    ],
    controllers: [AppController],
    providers: [
        ShuffleService,
        AuthService,
        PlaylistService,
        TrackService,
        MainService,
        UserService,
        HelperService,
    ],
})
export class AppModule {}
