import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenService {
    constructor() {}

    async getOpen(): Promise<any> {
        const module = await (eval(`import('open')`) as Promise<any>);
        return module.default;
    }
}
