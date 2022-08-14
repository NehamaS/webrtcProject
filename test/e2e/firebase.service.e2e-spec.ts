import {Test, TestingModule} from '@nestjs/testing';
import {HttpStatus, INestApplication} from '@nestjs/common';
import request from 'supertest';
import {sleep} from "../testutils/test.utils";

import {FirebaseService} from "../../src/push/firebase/firebase.service";
import {WebrtcModule} from "../../src/webrtc.module";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {loggerServiceMock, MetricsServiceMock} from "../testutils/test.mock";
import {NestFactory} from "@nestjs/core";
import {E2eModule} from "./simulators/e2e.module";
import {WsSimController} from "./simulators/ws.sim.controller";
import {ApiGwDto} from "../../src/dto/api.gw.dto";
import {SipService} from "../../src/callserviceapi/sip/sip.service";
import path from "path";
import {UserDataDto} from "../../src/dto/user.data.dto";
import {MetricsService} from "service-infrastructure/dd-metrics/metrics.service";

process.env.SRV_CONF_PATH = `${__dirname}${path.sep}config-firebase.json`;
process.env.CONF_PATH = `${__dirname}${path.sep}config-firebase.json`

let isCancelFlow: boolean = false

let SIP = {

};

describe('test /push api to firebase webrtc class', () => {

    jest.setTimeout(10000);
    let moduleFixture: TestingModule;
    let app: INestApplication;
    let testApp: INestApplication;
    let contextMap: Map<string, Array<ApiGwDto>> = new Map<string, Array<ApiGwDto>>();
    let service: FirebaseService;
    let sipServer: SipService;

    let userData: UserDataDto = {
        userId: "test1@mavenir.com",
        connectionId: "1",
        accessToken: "accessToken-777777777",
        PNSToken: "PUSH_TOKEN",
        accountSid: "accountSid-7777777777",
        appSid: "appSid-7777777"
    }
    let data = {
        callerUserId: "teat2@test.com",
        userData: userData
    }

    const initTestApp = async (): Promise<void> => {
        let port: number = 8088;
        testApp = await NestFactory.create(E2eModule);
        testApp.enableCors();

        let wsSimController = testApp.get<WsSimController>(WsSimController);
        wsSimController.setContext(contextMap);

        await testApp.listenAsync(port, "127.0.0.1");
        console.log(`Test app started on: 127.0.0.1:${port}`);

    }


    beforeAll(async () => {

        console.log("starting test app...");
        moduleFixture = await Test.createTestingModule({
            imports: [WebrtcModule],
            providers: [
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: MetricsService, useValue: MetricsServiceMock}
            ]
        }).compile();

        app = moduleFixture.createNestApplication();
        service = app.get<FirebaseService>(FirebaseService);
        sipServer = app.get<SipService>(SipService);

        sipServer.setSipApi(SIP);

        await app.init();

        await initTestApp();

    });

    afterAll(async () => {
        console.log("test app closed!");
        await app.close();
        await testApp.close();
    })

    let response = {};

    it('Test Push Api', async () => {

        let firebaseMock = jest.spyOn(service, 'sendNotification');
        let response = {};

        await request(app.getHttpServer())
            .post(`/push`)
            .set('Content-type', 'application/json')
            .send(data)
            .expect(HttpStatus.ACCEPTED, response);

        expect(firebaseMock).toHaveBeenCalledTimes(1);

        await service.deleteClient(userData.accountSid + "_" + userData.appSid);

        await sleep(200);

    });
});
