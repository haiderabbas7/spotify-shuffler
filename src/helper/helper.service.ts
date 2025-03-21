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

    /**
     * Mein "eigener" weighted random object algo (hab ich vom package weighted-random-object geklaut)
     * man gibt einfach ein array an Elementen ein, wobei jedes Element ein attribut weight enthalten soll
     * und er gibt dir ein zufälliges objekt zurück OHNE ES ZU ENTFERNEN
     */
    getWeightedRandom(objects: any[]) {
        // Berechne das Gesamtgewicht
        const totalWeight = objects.reduce((agg, object) => agg + object.weight, 0);

        // Generiere eine Zufallszahl im Bereich des Gesamtgewichts
        const randomNumber = Math.random() * totalWeight;

        // Finde das Objekt, dessen Gewicht die Zufallszahl überschreitet
        let weightSum = 0;
        return objects.find((object) => {
            weightSum += object.weight;
            return randomNumber <= weightSum;
        });
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

    async wait(seconds: number) {
        await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }

    /*OPTIONAL: schreib hier vllt nach bedarf eine Methode, die Date objekte in meine Timezone umrechnet
        guck dafür in txt meine notizen um zu wissen wie ich umrechnen muss und so*/

    /*TODO: schreib eine methode welche den momentanen zeitpunkt mit einer nachricht printed
     *  also ich gib der methode ne message und er printed: (DD.MM.YY HH:MM) message
     *  dazu gucken wie ich das momentane datum mit new Date in das format bringen kann*/
    printWithTimestamp(message: string) {
        const now = new Date();
        const formattedDate = now
            .toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            })
            .replace(',', ''); // Entfernt das Komma zwischen Datum und Uhrzeit

        console.log(`(${formattedDate}) ${message}`);
    }
}
