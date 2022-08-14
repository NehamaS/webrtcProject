import {defineFeature, loadFeature} from "jest-cucumber";
import {
    systemSetup,
    verifyResponse,
    recallByClientB,
    callStart,
    register,
    callEnd,
    callEndByClientB,
    testSetup,
    cpaasStartCall,
    sendRinging,
    sleep,
    answerCall,
    cpaasSendAck,
    rejectCall,
    verifyErrorResponse, unregister
} from "../../common/steps/cpaas-steps";

import {} from "../../common/dto/sipMessageDTO"
import {RestcommSimulator} from "../../common/sip/restcomm.simulator";


import {Context} from "../../common/context"
import { HttpClientServer } from "../../common/http-client/http-client.server";
import {logConfig} from "../../logger";



const CpaasToWebRTCFeature = loadFeature(`${__dirname}/../features/cpaas-webrtc.feature`);
jest.setTimeout(500000);


defineFeature(CpaasToWebRTCFeature, (test) => {

    const sipClient:RestcommSimulator = new RestcommSimulator();
    const app: HttpClientServer = new HttpClientServer();
    const hostName: string = "127.0.0.1";
    const port: number = 6070;

    beforeEach(async () => {
        jest.clearAllMocks()
        // contextMap.clear() //clear ws map
        // isCancelFlow = false
    });


    beforeAll(async () => {
        global.logger = logConfig(CpaasToWebRTCFeature.title);
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

    const TO_RESTCOMM_SUCCEED_FLOW = "restcomm<-->ClientB, Cpass end call";
    test(TO_RESTCOMM_SUCCEED_FLOW, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = TO_RESTCOMM_SUCCEED_FLOW;
        systemSetup(given, context, sipClient);
        // testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        cpaasStartCall(when, context, sipClient);
        sendRinging(and, context);
        answerCall(when, context);
        cpaasSendAck(and, context, sipClient);
        sleep(then);
        callEndByClientB(when, context,sipClient);
        unregister(and, context);
        unregister(and, context);
    });

    const RESTCOMM_WEBRTC_END_CALL_BY_WEBRTC = "restcomm<-->ClientB, ClientB end call";
    test(RESTCOMM_WEBRTC_END_CALL_BY_WEBRTC, async ({given, then, and,when}) => {
        const context : Context=new Context();
        context.current = RESTCOMM_WEBRTC_END_CALL_BY_WEBRTC;
        systemSetup(given, context, sipClient);
        // testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        cpaasStartCall(when, context, sipClient);
        sendRinging(and, context);
        answerCall(when, context);
        cpaasSendAck(and, context, sipClient);
        sleep(then);
        callEndByClientB(when, context,sipClient);
        unregister(and, context);
        unregister(and, context);
    });

    const RESTCOMM_WEBRTC_REJECT_CALL = "restcomm<-->ClientB, ClientB reject call";
    test(RESTCOMM_WEBRTC_REJECT_CALL, async ({given, then, and,when}) => {
        const context: Context = new Context();
        context.current = RESTCOMM_WEBRTC_REJECT_CALL;
        systemSetup(given, context, sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        cpaasStartCall(when, context, sipClient);
        sendRinging(and, context);
        rejectCall(and, context);
        sleep(then);
        verifyErrorResponse(and, context);
        unregister(and, context);
        unregister(and, context);
    });

    const RESTCOMM_WEBRTC_BUSY_CALL = "restcomm<-->ClientB, ClientB busy response";
    test.skip(RESTCOMM_WEBRTC_BUSY_CALL, async ({given, then, and,when}) => {
        const context: Context = new Context();
        context.current = RESTCOMM_WEBRTC_BUSY_CALL;
        systemSetup(given, context, sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        cpaasStartCall(when, context, sipClient);
        sendRinging(and, context);
        // busyCall(and, context);
        unregister(and, context);
        unregister(and, context);
    });

    const RESTCOMM_WEBRTC_NOT_REGISTERED = "restcomm<-->ClientB, ClientB not registered";
    test(RESTCOMM_WEBRTC_NOT_REGISTERED, async ({given, then, and,when}) => {
        const context: Context = new Context();
        context.current = RESTCOMM_WEBRTC_NOT_REGISTERED;
        systemSetup(given, context, sipClient);
        testSetup(given, context);
        register(when, context, port, app);
        verifyResponse(then, context, app);
        cpaasStartCall(when, context, sipClient);
        sleep(then);
        verifyErrorResponse(and, context);
        unregister(and, context);
    });
})