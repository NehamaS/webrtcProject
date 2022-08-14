import {defineFeature, loadFeature} from "jest-cucumber";
import {
    systemSetup,
    verifyResponse,
    recallByClientB,
    callStart,
    register,
    openRoom,
    callEnd,
    callEndByClientB, testSetup,
    mcuCallStart,
    Sleep
} from "../../common/steps/cpaas-steps"

import {} from "../../common/dto/sipMessageDTO"
import {McuSimulator} from "../../common/sip/mcu.simulator";


import {Context} from "../../common/context"
import { HttpClientServer } from "../../common/http-client/http-client.server";
import {initUtils} from "../../common/common.steps.utils";

import {logConfig } from "../../logger"

const webRTCToCpaasFeature = loadFeature(`${__dirname}/../features/webrtc-mcu.feature`);

jest.setTimeout(35000);

initUtils();

defineFeature(webRTCToCpaasFeature, (test) => {

    const sipClient:McuSimulator = new McuSimulator();
    const app: HttpClientServer = new HttpClientServer();
    const hostName: string = "127.0.0.1";
    const port: number = 6060;

    beforeAll(async () => {
    	global.logger = logConfig(webRTCToCpaasFeature.title)
        sipClient.start();
        app.init();
        await app.start(hostName, port);
        //let http server "load up nicely"
        await app.delay(50);
    });

    afterAll(async () => {
        app.stop();
        sipClient.stop()

    });

    const MCU_CONF_SUCCEED_FLOW = "MCU conf, succeed flow";
    test(MCU_CONF_SUCCEED_FLOW, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = MCU_CONF_SUCCEED_FLOW;
        systemSetup(given, context, sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        register(when, context, port, app);
        verifyResponse(then, context, app);
       openRoom(when, context, app);
       verifyResponse(then, context, app);
       mcuCallStart(when, context, app);
       verifyResponse(then, context, app);
        callEnd(when, context, app)
    });

})
