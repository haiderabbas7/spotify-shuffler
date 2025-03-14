import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperService {
    constructor() {}

    //open ist ein ES modul und kann daher NUR so importiert werden
    async getOpen(): Promise<any> {
        const module = await (eval(`import('open')`) as Promise<any>);
        return module.default;
    }

    //unix-timestamp ist ein ES modul und kann daher NUR so importiert werden
    async getUnixTimestamp(): Promise<any> {
        const module = await (eval(`import('unix-timestamp')`) as Promise<any>);
        //setzt dass keine bruchteile der sekunde angezeigt werden, sondern immer gerundet wird
        module.default.round = true;
        return module.default;
    }

    //funktioniert, weniger als 1ms
    getDateXMinutesBack(minutes: number = 120): Date {
        const date = new Date();
        date.setMinutes(date.getMinutes() - minutes);
        return date;
    }

    extractIDfromSpotifyURI(uri: string): string {
        return uri.replace('spotify:playlist:', '');
    }

    //TODO: schreib hier vllt nach bedarf eine Methode, die Date objekte in meine Timezone umrechnet
    // guck dafür in txt meine notizen um zu wissen wie ich umrechnen muss und so
}
