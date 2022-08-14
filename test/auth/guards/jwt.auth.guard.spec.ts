import {Test, TestingModule} from '@nestjs/testing';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {CounterServiceMock, dbMock, loggerServiceMock} from "../../testutils/test.mock";
import {JwtAuthGuard} from "../../../src/auth/guards/jwt.auth.guard";
import {DbService} from "../../../src/common/db/db.service";
import {ExecutionContext} from "@nestjs/common";
import * as dep from 'jwt-decode';
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {WsRequestDto} from "../../../automation/common/dto/ws.request.dto";
import {ApiGwDto} from "../../../automation/common/dto/api.gw.dto";
import {UserDataDto} from "../../../src/dto/user.data.dto";
import {CounterService} from "../../../src/metrics/counter.service";


jest.mock('jwt-decode');

const mockMyFunction = dep.default as jest.Mock;

let dbServiceMock = dbMock;

let TOKEN_DECODE_ENABLED: any = undefined;

const configServiceMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'auth.token.use':
                return TOKEN_DECODE_ENABLED != undefined ? TOKEN_DECODE_ENABLED : defVal;
            case 'auth.token.persist':
                return TOKEN_DECODE_ENABLED != undefined ? TOKEN_DECODE_ENABLED : defVal;
            default :
                return defVal;
        }
    })
};


export const TOKEN: string = "124572394857thwerhugerot2347y6298035";

describe('JwtAuthGuard', () => {
    let service: JwtAuthGuard;

    beforeEach(async () => {
        TOKEN_DECODE_ENABLED = undefined;
        const module: TestingModule = await Test.createTestingModule({
            providers: [JwtAuthGuard,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: DbService, useValue: dbServiceMock},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: CounterService, useValue: CounterServiceMock}
            ]
        }).compile();

        service = module.get<JwtAuthGuard>(JwtAuthGuard);
        mockMyFunction.mockReturnValue({
            email: "test@mavenir.com",
            "custom:organizationSid": "tata",
            jti: "45234563645",
            "custom:accountSid": "uber",
            "custom:applicationSid": "AP4434355t-applicationSid",
            "custom:deviceId": "deviceId_test",
            "custom:userId": "userId_test@test.com"
        });
    });

    afterEach(() => {
        dbServiceMock.setUser.mockClear();
        //clear mocks;;;
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('Can activate, token exists', async () => {
        let testType = (type:string) => {
            let result = {body: <WsRequestDto>{
                connectionId: "345ergty5636",
                dto: <ApiGwDto>{},
            }}
            let dto : any;
            switch (type) {
                case "header": result["headers"] = {Authorization: TOKEN}; break;
                case "query": result["query"] = {Authorization: TOKEN}; break;
                case "miss": result["headers"] =  {"content-type": "application/json"}; //continue to add header inside the body
                case "body": result.body["Authorization"] = TOKEN; break;
            }
            return result;
        }
        let testTypes = ["header", "body", "query", "miss"];
        TOKEN_DECODE_ENABLED = true;
        for (let i = 0; i < testTypes.length; i++) {

            const httpContextMock = {
                getRequest: jest.fn().mockReturnValue(testType(testTypes[i])
                )
            }

            const contextMock = {
                switchToHttp: jest.fn().mockReturnValue(httpContextMock)
            }

            let res: any = await service.canActivate(<ExecutionContext>(<unknown>contextMock));
            expect(res).toBeDefined();
            expect(res === true).toBeTruthy();
            expect(contextMock.switchToHttp).toHaveBeenCalledTimes(1);
            expect(httpContextMock.getRequest).toHaveBeenCalledTimes(1);
            expect(dbServiceMock.setUser).toHaveBeenCalledTimes(i+1); //DBServicemock is global
            expect(dbServiceMock.setUser).toHaveBeenCalledWith(expect.anything());
        }
    });

    it('Can activate, token NOT exist', async () => {
        const httpContextMock = {
            getRequest: jest.fn().mockReturnValue({
                headers: {},
                body: {connectionId: "345ergty5636"}
            })
        }

        const contextMock = {
            switchToHttp: jest.fn().mockReturnValue(httpContextMock)
        }

        let res: any = await service.canActivate(<ExecutionContext>(<unknown>contextMock));
        expect(res).toBeDefined();
        expect(res).toBeFalsy();
        expect(contextMock.switchToHttp).toHaveBeenCalledTimes(1);
        expect(httpContextMock.getRequest).toHaveBeenCalledTimes(1);
        expect(dbServiceMock.setUser).toHaveBeenCalledTimes(0);
    });

    it('Can activate, missing connection id', async () => {
        const httpContextMock = {
            getRequest: jest.fn().mockReturnValue({
                headers: {Authorization: TOKEN},
                body: {}
            })
        }

        const contextMock = {
            switchToHttp: jest.fn().mockReturnValue(httpContextMock)
        }

        let res: any = await service.canActivate(<ExecutionContext>(<unknown>contextMock));
        expect(res).toBeDefined();
        expect(res).toBeFalsy();
        expect(contextMock.switchToHttp).toHaveBeenCalledTimes(1);
        expect(httpContextMock.getRequest).toHaveBeenCalledTimes(1);
        expect(dbServiceMock.setUser).toHaveBeenCalledTimes(0);
    });

    it('Can activate, disabled configuration', async () => {
        TOKEN_DECODE_ENABLED = false;
        const httpContextMock = {
            getRequest: jest.fn().mockReturnValue({
                headers: {Authorization: TOKEN},
                body: {}
            })
        }

        const contextMock = {
            switchToHttp: jest.fn().mockReturnValue(httpContextMock)
        }

        let res: any = await service.canActivate(<ExecutionContext>(<unknown>contextMock));
        expect(res).toBeDefined();
        //token parsing is disabled, and auth is considered as authorized
        expect(res).toBeTruthy();
        expect(contextMock.switchToHttp).toHaveBeenCalledTimes(0);
        expect(httpContextMock.getRequest).toHaveBeenCalledTimes(0);
        expect(dbServiceMock.setUser).toHaveBeenCalledTimes(0);
    });

    it (('Check validator'), () => {
        let userData: UserDataDto = <UserDataDto>{
            connectionId: 'connectionIding',
            accessToken: 'accessToken',
            appSid: 'appSid',
            deviceId: 'deviceId'
        }
        expect(() => (service['validateParams'](userData))).toThrow('userId is missing in jwt!!')

    })
});
