import {defineFeature, loadFeature} from "jest-cucumber";

import {} from "../../common/dto/sipMessageDTO"
import {LoadRestcommSimulator} from "../common/load.restcomm.simulator";

import {LoadContext} from "../../../automation/common/context"
import {loadSetup,systemSet } from "./loadManage";

import { HttpClientServer } from "../../../automation/common/http-client/http-client.server";



const webRTCToWebRTCFeature = loadFeature(`/home/nehama/WebstormProjects/cpaas-webrtc-gateway/test/load/features/load.feature`);
jest.setTimeout(500000);


defineFeature(webRTCToWebRTCFeature, (test) => {

    const sipClient:LoadRestcommSimulator=new LoadRestcommSimulator(undefined);
    const app: HttpClientServer = new HttpClientServer();


    beforeAll(async () => {
        const hostName: string = "127.0.0.1";
        const port = 6060;
        sipClient.start();
        app.init();
        app.start(hostName, port);
        //let http server "load up nicely"
        await app.delay(50);
    });

    afterAll(async () => {
        app.stop();
        sipClient.stop()

    });

    const TO_RESTCOMM_LOAD = "restcomm<-->ClientA LOAD";
    test(TO_RESTCOMM_LOAD, async ({given, then, and,when}) => {
        const loadContext : LoadContext=new LoadContext();

        systemSet(given,loadContext)
        loadSetup(given, loadContext,sipClient,app);
    });







})
