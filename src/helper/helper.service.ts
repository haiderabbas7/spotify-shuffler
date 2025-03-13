import { Injectable } from '@nestjs/common';

@Injectable()
export class HelperService {
    constructor() {}

    async getOpen(): Promise<any> {
        const module = await (eval(`import('open')`) as Promise<any>);
        return module.default;
    }

    getDateXMinutesBack(minutes: number = 120): Date {
        const date = new Date();
        date.setMinutes(date.getMinutes() - minutes);
        return date;
    }
}
