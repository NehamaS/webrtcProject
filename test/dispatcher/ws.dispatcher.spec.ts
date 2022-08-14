import {Test, TestingModule} from '@nestjs/testing';
import {WsDispatcher} from "../../src/ws.dispatcher";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ApiGwDto} from "../../src/dto/api.gw.dto";
import {configServiceMock, loggerServiceMock} from "../testutils/test.mock";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {HttpService} from "@nestjs/axios";
import {REGISTER_ACTION} from "../../src/common/constants";
import {DbService} from "../../src/common/db/db.service";
import {DbServiceMock} from "../msghandler/client.msg.handler.spec";
import {WssAdmin} from "../../src/websocket/admin/wss.admin";

const httpServiceMock = {
    post:  jest.fn().mockImplementation((name, defVal) => {})
}

const wssAdminMock = {
    sendMessage:  jest.fn().mockImplementation((connId, msg) => {})
}


describe('Test dispatcher retry', () => {
    let wsDispatcher: WsDispatcher;
    jest.setTimeout(10000)

    beforeEach(async () => {
        console.log("starting msg handler test");

        const app: TestingModule = await Test.createTestingModule({
            imports: [],
            providers: [
                WsDispatcher,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: HttpService, useValue: httpServiceMock},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: DbService, useValue: DbServiceMock},
                {provide: WssAdmin, useValue: wssAdminMock}
            ]
        }).compile();

        wsDispatcher = app.get<WsDispatcher>(WsDispatcher);
        // await wsDispatcher.onModuleInit()
    });

    beforeAll(async () => {
        jest.clearAllMocks()

    })

    afterAll(async () => {
        console.log("msg handler app closed!");
    })

    it('No retry in cass of dispatcher success', async () => {

        let apiGwDto :ApiGwDto = {
            callId: "-1",
            messageId: "1",
            source: "test@test.com",
            destination: "GW",
            ts: 12345,
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                PNSToken: "pns-token",
                deviceType: "WEB_BROWSER",
                deviceId: "deviceId-11111",
                appSid: "appSid-222222"
            }
        }

        //await wsDispatcher.onModuleInit() //using mock
        await wsDispatcher.onApplicationBootstrap() //using mock
        await wsDispatcher.sendMessage('111111', apiGwDto)
        expect ( DbServiceMock.getUserData ).toBeCalledTimes(0);

    });


    it('Retry in case of dispatcher error  ', async () => {
         jest.setTimeout(10000)

        let apiGwDto :ApiGwDto = {
                callId: "-1",
                messageId: "1",
                source: "test@test.com",
                destination: "GW",
                ts: 12345,
                type: REGISTER_ACTION,
                body: {
                    protocolVersion: "1.0",
                    clientVersion: "1.0",
                    PNSToken: "pns-token",
                    deviceType: "WEB_BROWSER",
                    deviceId: "deviceId-11111",
                    userId: "2222",
                    appSid: "appSid-222222"
                }
            }

        await wsDispatcher.sendMessage('111111', apiGwDto)
        expect ( DbServiceMock.getUserData ).toBeCalledTimes(3);

    });


});
