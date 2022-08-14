import {defineFeature, loadFeature} from "jest-cucumber";
import {
    callEnd,
    callStart,
    closeWsClient,
    openWsClient,
    register,
    sleep,
    systemSetup,
    terminateAck, unregister,
    waitForResponse
} from "../../common/steps/cpaas-steps";
import {WsService} from "../../common/ws/ws.service";
import {initUtils} from "../../common/common.steps.utils";
import {Context} from "../../common/context";

import {logConfig } from "../../logger"

const webRTCFeature = loadFeature(`${__dirname}/../features/wbrtc.cpaas.feature`);


jest.setTimeout(999999999);

let wsSrv: WsService = new WsService();

initUtils();

defineFeature(webRTCFeature, (test) => {

    beforeAll(() => {
        global.logger = logConfig(webRTCFeature.title);
    });

    const SCN_REGISTER = "happy path - userA terminates call";
    test(SCN_REGISTER, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.current = SCN_REGISTER;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(then, context);
        waitForResponse(then, context);
        callEnd(when, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
    });

    const UNKNOWN_USER = "call to unknown CPaaS Application";
    test(UNKNOWN_USER, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.current = UNKNOWN_USER;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(then, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
    });

    const END_CALL_BY_USER_B = "CPaaS Application terminates call";
    test(END_CALL_BY_USER_B, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.current = END_CALL_BY_USER_B;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(then, context);
        waitForResponse(then, context);
        sleep(then);
        waitForResponse(then, context);
        terminateAck(then, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
    });
});
