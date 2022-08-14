import {CdrService} from "../../../src/cdr/cdr.service";
import {Test, TestingModule} from "@nestjs/testing";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {configServiceMock, loggerServiceMock} from "../../testutils/test.mock";
import {callStartRequest} from "../../msghandler/messages";
import {WsRequestDto} from "../../../src/dto/ws.request.dto";
import {ApiGwDto, Body} from "../../../src/dto/api.gw.dto";
import {SessionDto} from "../../../src/dto/session.dto";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {ApiGwFormatDto} from "../../../src/dto/apiGwFormatDto";
import {GwCdrDto} from "../../../src/dto/gw.cdr.dto";
import {JOIN_REASON} from "../../../src/common/constants";
import * as path from "path";
import {INestApplication} from '@nestjs/common';
import {DbModule} from "../../../src/common/db/db.module";
import {InfrastructureModule} from "service-infrastructure/infrastructure.module";
import * as fs from 'fs';
import {sleep} from "../../testutils/test.utils";

process.env.SRV_CONF_PATH = `${__dirname}${path.sep}config.json`;
process.env.CONF_PATH = `${__dirname}${path.sep}config.json`

const pad = num => (num > 9 ? "" : "0") + num;

export const cdrConfigServiceMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
             case 'cdr.enabled':
                return true
            case 'cdr.path':
                return './cdr'
            case 'cdr.filename':
                return 'cdr.log'
            case 'cdr.size':
                return '100K'
            case 'cdr.interval':
                return '5m'
            case 'cdr.maxFiles':
                return 5
            default :
                return defVal;
        }
    })
};

describe('Test CDR Service', () => {
    let cdrService: CdrService;
    let nextApp: INestApplication;
    let date;

    jest.setTimeout(60000)

    beforeAll(async () => {
        console.log("Starting CDR service test");

        jest.clearAllMocks();
        jest.useFakeTimers();

        const app: TestingModule = await Test.createTestingModule({
            imports: [InfrastructureModule, DbModule],
            providers: [CdrService,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: ConfigurationService, useValue: cdrConfigServiceMock}
           ]
        }).compile();

        nextApp = app.createNestApplication();

        cdrService = app.get<CdrService>(CdrService);

        await nextApp.init();
    });

    afterAll(async () => {
        await nextApp.close();
        jest.useRealTimers();
        console.log("cdr service closed!");
    });

    beforeEach(async () => {
        jest.clearAllMocks()
    });

    afterEach(async () => {
    });

    it('Test connected call', async () => {

        let body: Body = {
            userId: callStartRequest.dto.source,
            service: 'P2P',
            reason: JOIN_REASON
        }

        let callData: ApiGwDto = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId + '_leg2',
            meetingId: callStartRequest.dto.meetingId,
            messageId: callStartRequest.dto.messageId,
            ts: 12345,
            type: callStartRequest.dto.type,
            body: body
        };

        let event: WsRequestDto = {
            connectionId: callStartRequest.connectionId,
            dto: callData
        }

        let userData: SessionDto = {
            callId: callStartRequest.dto.callId,
            userId: callStartRequest.dto.source,
            deviceId: callStartRequest.dto.body.deviceId,
            connectionId: callStartRequest.connectionId,
            meetingId: callStartRequest.dto.meetingId
        }

        // for test cdr.log
        for (let i:number = 0; i < 1; i++) {

            await cdrService.setStartTime4SessData(event, callData, userData);

            jest.advanceTimersByTime(2000);

            await cdrService.setAnswerTime4SessData(callData);

            let discReq: ApiGwFormatDto = {
                caller: callStartRequest.dto.source,
                callee: callStartRequest.dto.destination,
                callId: callStartRequest.dto.callId,
                service: 'P2P',
                status: {
                    code: '200',
                    desc: 'OK'
                }
            }

            jest.advanceTimersByTime(3000);

            if (date == undefined) {
                date = new Date();
            }

            let cdr: GwCdrDto = await cdrService.writeCdr(discReq);

            console.log('cdr: ', cdr);

            expect(cdr.ringDuration).toEqual(2);
            expect(cdr.duration).toEqual(3);

            expect(cdr.terminator).toEqual(discReq.caller);

            expect(cdr.reason.code).toEqual(200);
            expect(cdr.reason.message).toEqual('OK');
        }

     });

    it('Test canceled call', async () => {

        let body: Body = {
            userId: callStartRequest.dto.source,
            service: 'P2P',
            reason: JOIN_REASON
        }

        let callData: ApiGwDto = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId + '_leg2',
            meetingId: callStartRequest.dto.meetingId,
            messageId: callStartRequest.dto.messageId,
            ts: 12345,
            type: callStartRequest.dto.type,
            body: body
        };

        let event: WsRequestDto = {
            connectionId: callStartRequest.connectionId,
            dto: callData
        }

        let userData: SessionDto = {
            callId: callStartRequest.dto.callId,
            userId: callStartRequest.dto.source,
            deviceId: callStartRequest.dto.body.deviceId,
            connectionId: callStartRequest.connectionId,
            meetingId: callStartRequest.dto.meetingId
        }

        cdrService.setStartTime4SessData(event, callData, userData);

        jest.advanceTimersByTime(2000);

        // cancel call
        let discReq: ApiGwFormatDto = {
            caller: callStartRequest.dto.source,
            callee: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId,
            service: 'P2P',
            status : {
                code: '200',
                desc: 'OK'
            }
        }

        let cdr: GwCdrDto = await cdrService.writeCdr(discReq);

        console.log('cdr: ', cdr);

        expect(cdr.ringDuration).toEqual(2);

        expect(cdr.duration).toEqual(0);

        expect(cdr.terminator).toEqual(discReq.caller);

        expect(cdr.reason.code).toEqual(487);
        expect(cdr.reason.message).toEqual('Canceled');

    });

    it('Test rejected call', async () => {

        let body: Body = {
            userId: callStartRequest.dto.source,
            service: 'P2P',
            reason: JOIN_REASON
        }

        let callData: ApiGwDto = {
            source: callStartRequest.dto.source,
            destination: callStartRequest.dto.destination,
            callId: callStartRequest.dto.callId + '_leg2',
            meetingId: callStartRequest.dto.meetingId,
            messageId: callStartRequest.dto.messageId,
            ts: 12345,
            type: callStartRequest.dto.type,
            body: body
        };

        let event: WsRequestDto = {
            connectionId: callStartRequest.connectionId,
            dto: callData
        }

        let userData: SessionDto = {
            callId: callStartRequest.dto.callId,
            userId: callStartRequest.dto.source,
            deviceId: callStartRequest.dto.body.deviceId,
            connectionId: callStartRequest.connectionId,
            meetingId: callStartRequest.dto.meetingId
        }

        await cdrService.setStartTime4SessData(event, callData, userData);

        jest.advanceTimersByTime(2000);

        // reject call
        let discReq: ApiGwFormatDto = {
            caller: callStartRequest.dto.destination,
            callee: callStartRequest.dto.source,
            callId: callStartRequest.dto.callId,
            service: 'P2P',
            status : {
                code: '486',
                desc: 'Busy Here'
            }
        }

        let cdr: GwCdrDto = await cdrService.writeCdr(discReq);

        console.log('cdr: ', cdr);

        expect(cdr.ringDuration).toEqual(0);

        expect(cdr.duration).toEqual(0);

        expect(cdr.terminator).toEqual(discReq.caller);

        expect(cdr.reason.code).toEqual(486);
        expect(cdr.reason.message).toEqual('Busy Here');

    });

    it('Test CDR file', async () => {
        let filename = './cdr/' + date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + '-';
        filename += pad(date.getHours()) + pad(date.getMinutes()) + '-01-cdr.log';

        jest.useRealTimers();
        await sleep(500);

        // ./cdr/20220619-1026-01-cdr.log
        if (!fs.existsSync(filename)) {
            console.error('file not present: ', filename);
            expect(fs.existsSync(filename)).toBe(false);
        }
        else {
            console.log('test file: ', filename);
            expect(fs.existsSync(filename)).toBe(true);

            expect(fs.readFileSync(filename, 'utf-8')).toContain(callStartRequest.dto.callId);
            expect(fs.readFileSync(filename, 'utf-8')).toContain('OK');
            expect(fs.readFileSync(filename, 'utf-8')).toContain('Canceled');
            expect(fs.readFileSync(filename, 'utf-8')).toContain('Busy Here"');

            try {
                console.log('delete file: ', filename);
                fs.unlinkSync(filename);
            }
            catch(err) {
                console.error(err);
            }
        }
    });

});