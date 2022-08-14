import {defineFeature, loadFeature} from "jest-cucumber";
import {
    systemSetup,
    verifyResponse,
    recallByClientB,
    callStart,
    register,
    callEnd,
    callEndByClientB, testSetup, unregister
} from "../../common/steps/cpaas-steps";

import {} from "../../common/dto/sipMessageDTO"
import {RestcommSimulator} from "../../common/sip/restcomm.simulator";


import {Context} from "../../common/context"
import { HttpClientServer } from "../../common/http-client/http-client.server";
import {initUtils} from "../../common/common.steps.utils";

import {logConfig } from "../../logger"

const webRTCToCpaasFeature = loadFeature(`${__dirname}/../features/webrtc-cpaas.feature`);

jest.setTimeout(35000);

initUtils();

defineFeature(webRTCToCpaasFeature, (test) => {

    const sipClient:RestcommSimulator = new RestcommSimulator();
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

    const TO_RESTCOMM_SUCCEED_FLOW = "ClientA<-->restcomm, succeed flow";
    test(TO_RESTCOMM_SUCCEED_FLOW, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = TO_RESTCOMM_SUCCEED_FLOW;
        systemSetup(given, context, sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        callEnd(when, context, app);
        unregister(and, context);
    });

    const TO_RESTCOMM_REJECT_FLOW = "ClientA<-->restcomm, reject flow";
    test(TO_RESTCOMM_REJECT_FLOW, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = TO_RESTCOMM_REJECT_FLOW;
        systemSetup(given, context,sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        unregister(and, context);
    });

    const TO_RESTCOMM_BUSY_FLOW = "ClientA<-->restcomm, busy flow";
    test(TO_RESTCOMM_BUSY_FLOW, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = TO_RESTCOMM_BUSY_FLOW;
        systemSetup(given, context,sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        unregister(and, context);
    });

    const TO_RESTCOMM_CLIENT_B_END = "ClientA<-->restcomm, clientB ends call";
    test.skip(TO_RESTCOMM_CLIENT_B_END, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = TO_RESTCOMM_CLIENT_B_END;
        systemSetup(given, context, sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        callEndByClientB(when, context,sipClient);
        unregister(and, context);
    });

    const TO_RESTCOMM_CLIENT_B_RECALL = "ClientA<-->restcomm, clientB recall";
    test.skip(TO_RESTCOMM_CLIENT_B_RECALL, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = TO_RESTCOMM_CLIENT_B_RECALL;
        systemSetup(given, context,sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        recallByClientB(when, context, sipClient);
        callEnd(when, context, app);
        unregister(and, context);
    });

    const START_CALL_AFTER_END_CALL = "ClientA<-->restcomm, start call after end call";
    test(START_CALL_AFTER_END_CALL, async ({given, then, and,when}) => {
        const context: Context = new Context();
        context.current = START_CALL_AFTER_END_CALL;
        systemSetup(given, context,sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        callEnd(when, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        unregister(and, context);
    });

    const UNKNOWN_USER = "ClientA<-->restcomm, unknown clientB";
    test(UNKNOWN_USER, async ({given, then, and,when}) => {
        const context: Context = new Context();
        context.current = UNKNOWN_USER;
        systemSetup(given, context, sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        callStart(when, context, app);
        verifyResponse(then, context, app);
        verifyResponse(then, context, app);
        unregister(and, context);
    });
})
