"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const webrtc_module_1 = require("./webrtc.module");
const APP_PORT = 9001;
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
    const app = await core_1.NestFactory.create(webrtc_module_1.WebrtcModule);
    app.enableCors();
    app.enableShutdownHooks();
    await app.listen(APP_PORT);
}
bootstrap();
//# sourceMappingURL=main.js.map