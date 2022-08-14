import {defineFeature, loadFeature} from "jest-cucumber";
import {
    answerCall,
    callEnd,
    callStart,
    closeWsClient,
    openWsClient,
    register, rejectCall, sendRinging,
    sleep,
    systemSetup,
    terminateAck, unregister,
    waitForResponse
} from "../../common/steps/cpaas-steps";
import {WsService} from "../../common/ws/ws.service";
import {initUtils} from "../../common/common.steps.utils";
import { Context } from "../../common/context";
import {logConfig } from "../../logger"


const webRTCFeature = loadFeature(`${__dirname}/../features/wbrtc.wbrtc.feature`);
jest.setTimeout(999999999);

let wsSrv: WsService = new WsService();

initUtils();

defineFeature(webRTCFeature, (test) => {

    beforeAll(() => {
        global.logger = logConfig(webRTCFeature.title)

    });

    beforeEach(() => {

    });

    afterEach(() => {

    });

    const USERA_TO_USERB = "happy path - userA call userB";
    test(USERA_TO_USERB, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.current = USERA_TO_USERB;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(when, context);
        sendRinging(when, context);
        waitForResponse(then, context);
        answerCall(when, context);
        waitForResponse(then, context);
        callEnd(when, context);
        waitForResponse(then, context);
        unregister(and, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
        closeWsClient(and, context);
    });

    const USERB_END_CALL = "userA start call, userB end call";
    test(USERB_END_CALL, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.current = USERB_END_CALL;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(when, context);
        sendRinging(when, context);
        waitForResponse(then, context);
        answerCall(when, context);
        waitForResponse(then, context);
        callEnd(when, context);
        waitForResponse(then, context);
        // terminateAck(and,context);
        // waitForResponse(then, context);
        unregister(and, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
        closeWsClient(and, context);
    });

    const USERB_REJECT_CALL = "userA start call, userB reject call";
    test(USERB_REJECT_CALL, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.currentTest = USERB_REJECT_CALL;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(when, context);
        sendRinging(when, context);
        waitForResponse(then, context);
        rejectCall(and, context);
        waitForResponse(then, context);
        unregister(and, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
        closeWsClient(and, context);
    });

    const UNREGISTER_USER = "call to unregistered user";
    test(UNREGISTER_USER, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.currentTest = UNREGISTER_USER;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(when, context);
        unregister(and, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
        closeWsClient(and, context);
    });

    const REGISTER_AFTER_START_CALL = "register user after start call";
    test(REGISTER_AFTER_START_CALL, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.currentTest = REGISTER_AFTER_START_CALL;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        register(when, context);
        waitForResponse(then, context);
        waitForResponse(when, context);
        sendRinging(when, context);
        waitForResponse(then, context);
        answerCall(when, context);
        waitForResponse(then, context);
        callEnd(when, context);
        waitForResponse(then, context);
        unregister(and, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
        closeWsClient(and, context);
    })

    const CALL_AFTER_DISCONNECT = "start call after userB disconnected";
    test(CALL_AFTER_DISCONNECT, async ({given, then, and, when}) => {
        const context: Context = new Context();
        context.current = CALL_AFTER_DISCONNECT;
        systemSetup(given, context);
        openWsClient(when, context, wsSrv);
        openWsClient(when, context, wsSrv);
        register(when, context);
        waitForResponse(then, context);
        register(when, context);
        waitForResponse(then, context);
        callStart(when, context);
        waitForResponse(when, context);
        sendRinging(when, context);
        waitForResponse(then, context);
        answerCall(when, context);
        waitForResponse(then, context);
        callEnd(when, context);
        waitForResponse(then, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
        callStart(when, context);
        waitForResponse(then, context);
        unregister(and, context);
        sleep(then);
        closeWsClient(and, context);
    });
});