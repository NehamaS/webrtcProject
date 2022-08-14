import {NestFactory} from '@nestjs/core';
import {WebrtcModule} from './webrtc.module';

const APP_PORT :number = 9001;

function logAppInitConfig() {
    console.info('Environment...', {
        THBIND: process.env.THBIND,
        SIP_ADDRESS: process.env.SIP_ADDRESS,
        PLATFORM_TYPE: process.env.PLATFORM_TYPE,
        POD_UID: process.env.POD_UID,
        SIP_CONTACT_ADDR: process.env.SIP_CONTACT_ADDR
    });
}

async function bootstrap() {
    logAppInitConfig();

    const app = await NestFactory.create(WebrtcModule);
    app.enableCors();
    app.enableShutdownHooks();
    await app.listen(APP_PORT);
}

bootstrap();
