import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserService {
    constructor(private readonly configService: ConfigService) {}

    getUserID() {
        return this.configService.get<string>('MY_USER_ID');
    }

    /*TODO: schreib hier eine methode zum abfragen des Playback states
    *   musst dir dafür den Endpoint dazu durchlesen
    *   möchte ich beim Shufflen benutzen um eben nicht zu shufflen, wenn ich gerade Musik höre*/
}
