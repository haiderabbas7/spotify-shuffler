import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { HelperService } from './helper/helper.service';

async function bootstrap() {
    const server_app = await NestFactory.create(AppModule);
    //const background_app = await NestFactory.createApplicationContext(AppModule);
    const configService = server_app.get<ConfigService>(ConfigService);
    const openService = server_app.get<HelperService>(HelperService);
    const port = configService.get('PORT');
    //Hiermit wird direkt die index route geöffnet, funktioniert auch wenn der await listen call erst danach kommt
    //TODO: kommentiere das folgende aus wenn ich die anwendung für mich launchen will idfk
    await (
        await openService.getOpen()
    )('http://localhost:777/');
    await server_app.listen(port);
}
bootstrap();
