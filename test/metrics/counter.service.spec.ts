import {Test, TestingModule} from '@nestjs/testing';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {dbMock, loggerServiceMock, MetricsServiceMock} from "../testutils/test.mock";
import {DbService} from "../../src/common/db/db.service";
import {CounterService} from "../../src/metrics/counter.service";
import {CounterType, MetricsService} from "service-infrastructure/dd-metrics/metrics.service";
import {CounterName} from "../../src/common/constants";
import {
    callStartRequest,
    callStartRequestOne2One,
    callStatusResponse,
    terminateRequest,
    terminateRequestOne2One
} from "../msghandler/messages";
import * as _ from 'lodash'
import {ApiGwDto} from "../../src/dto/api.gw.dto";


let dbServiceMock = dbMock;

describe('Counter service TG', () => {
    jest.useFakeTimers()
    let counterService: CounterService

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CounterService,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: DbService, useValue: dbServiceMock},
                {provide: MetricsService, useValue: MetricsServiceMock}
            ]
        }).compile();
        counterService = module.get<CounterService>(CounterService);

        delete process.env.NODE_ENV
        delete process.env.SERVICE_NAME

    });

    afterEach(() => {
        // dbServiceMock.setUser.mockClear();
        //clear mocks;;;
    });

    it('should be defined', () => {
        expect(counterService).toBeDefined();
    });

    it('incrementCounter callStart', async () => {
        counterService.setCounter(CounterType.incrementCounter, <ApiGwDto>_.merge(callStartRequest.dto, {
                body: {
                    "deviceType": "ANDROID",
                    "accountId": "accountId",
                    "appSid": "appSid",
                    "counterName": CounterName.startCall,
                    "organizationId": "organizationId"
                }
            }
        ))

        jest.advanceTimersByTime(1000)

        expect(MetricsServiceMock.incrementCounter).toHaveBeenCalledWith({
            "counterName": CounterName.startCall,
            "accountId": "accountId",
            "appSid": "appSid",
            "organizationId": "organizationId",

            "tag": {
                "deviceType": "ANDROID",
                "service": "P2A",
            },
            "value": 1
        })
    });

    it('decrementCounter callStart with ENV', async () => {

        process.env.NODE_ENV = 'env'
        process.env.SERVICE_NAME = 'service'

        counterService.setCounter(CounterType.decrementCounter, <ApiGwDto>_.merge(callStartRequest.dto, {
                body: {
                    "deviceType": "ANDROID",
                    "accountId": "accountId",
                    "appSid": "appSid",
                    "counterName": CounterName.startCall,
                    "organizationId": "organizationId"
                }
            }
        ))

        jest.advanceTimersByTime(1000)

        expect(MetricsServiceMock.decrementCounter).toHaveBeenCalledWith({
            "counterName": `service.env.${CounterName.startCall}`,
            "accountId": "accountId",
            "appSid": "appSid",
            "organizationId": "organizationId",

            "tag": {
                "deviceType": "ANDROID",
                "service": "P2A",
            },
            "value": 1
        })
    });


    it('distributionCounter callStartRequestOne2One with SERVICE_NAME', async () => {

        process.env.SERVICE_NAME = 'service'
        delete process.env.NODE_ENV


        counterService.setCounter(CounterType.distributionCounter, <ApiGwDto>_.merge(callStartRequestOne2One.dto, {
                body: {
                    "deviceType": "ANDROID",
                    "accountId": "accountId",
                    "appSid": "appSid",
                    "counterName": CounterName.startCall,
                    "organizationId": "organizationId"
                }
            }), 30
        )

        jest.advanceTimersByTime(1000)

        expect(MetricsServiceMock.distribution).toHaveBeenCalledWith({
            "counterName": `service.${CounterName.startCall}`,
            "accountId": "accountId",
            "appSid": "appSid",
            "organizationId": "organizationId",
            "tag": {
                "deviceType": "ANDROID",
                "service": "P2P"
            },
            "value": 30
        })
    });

    it('histogram + terminateRequestOne2One', async () => {
        process.env.SERVICE_NAME = 'service'
        delete process.env.NODE_ENV

        counterService.setCounter(CounterType.histogramCounter, <ApiGwDto>_.merge(terminateRequestOne2One.dto, {
                body: {
                    "deviceType": "ANDROID",
                    "accountId": "accountId",
                    "appSid": "appSid",
                    "counterName": CounterName.startCall,
                    "organizationId": "organizationId"
                }
            }), 40
        )

        jest.advanceTimersByTime(1000)

        expect(MetricsServiceMock.histogram).toHaveBeenCalledWith({
            "counterName": `service.${CounterName.endCall}`,
            "accountId": "accountId",
            "appSid": "appSid",
            "organizationId": "organizationId",
            "tag": {
                "deviceType": "ANDROID",
                "service": "P2P",
                "statusCode": "200"
            },
            "value": 40
        })
    });

    it('timing counter + terminateRequest', async () => {
        process.env.SERVICE_NAME = 'service'
        process.env.NODE_ENV = 'dev'

        counterService.setCounter(CounterType.timing, <ApiGwDto>_.merge(terminateRequest.dto, {
                body: {
                    "deviceType": "ANDROID",
                    "accountId": "accountId",
                    "appSid": "appSid",
                    "counterName": CounterName.startCall,
                    "organizationId": "organizationId"
                }
            }), 15
        )

        jest.advanceTimersByTime(1000)

        expect(MetricsServiceMock.timing).toHaveBeenCalledWith({
            "counterName": `service.dev.${CounterName.endCall}`,
            "accountId": "accountId",
            "appSid": "appSid",
            "organizationId": "organizationId",
            "tag": {
                "deviceType": "ANDROID",
                "statusCode": "200"
            },
            "value": 15
        })
    });

    it('gaugeCounter counter + callStatusResponse 401', async () => {
        process.env.SERVICE_NAME = 'service'
        process.env.NODE_ENV = 'dev'

        callStatusResponse.body.statusCode = "401"

        counterService.setCounter(CounterType.gaugeCounter, <ApiGwDto>_.merge(callStatusResponse, {
                body: {
                    "deviceType": "ANDROID",
                    "accountId": "accountId",
                    "appSid": "appSid",
                    "counterName": CounterName.rejectCall,
                    "organizationId": "organizationId"
                }
            }), 20
        )

        jest.advanceTimersByTime(1000)

        expect(MetricsServiceMock.gaugeCounter).toHaveBeenCalledWith({
            "counterName": `${process.env.SERVICE_NAME}.${process.env.NODE_ENV}.${CounterName.rejectCall}`,
            "accountId": "accountId",
            "appSid": "appSid",
            "organizationId": "organizationId",
            "tag": {
                "deviceType": "ANDROID",
                "statusCode": "401"
            },
            "value": 20
        })
    });

    it('setCounter counter + setCounterName', async () => {
        process.env.SERVICE_NAME = 'service'
        process.env.NODE_ENV = 'dev'

        callStatusResponse.body.statusCode = "405"

        counterService.setCounter(CounterType.setCounter, <ApiGwDto>_.merge(callStatusResponse, {
                body: {
                    "deviceType": "ANDROID",
                    "accountId": "accountId",
                    "appSid": "appSid",
                    "counterName": CounterName.rejectCall,
                    "organizationId": "organizationId"
                }
            }), 55, 'setCounterName'
        )

        jest.advanceTimersByTime(1000)

        expect(MetricsServiceMock.setCounter).toHaveBeenCalledWith({
            "counterName": `${process.env.SERVICE_NAME}.${process.env.NODE_ENV}.setCounterName`,
            "accountId": "accountId",
            "appSid": "appSid",
            "organizationId": "organizationId",
            "tag": {
                "deviceType": "ANDROID",
                "statusCode": "405"
            },
            "value": 55
        });
    })

    it('getCounterName both process.env.NODE_ENV and process.env.SERVICE_NAME are defined', () => {
        process.env.NODE_ENV = 'testing'
        process.env.SERVICE_NAME = 'testservice'

        let result: string = counterService['setCounterName']('counterName')
        expect(result).toEqual('testservice.testing.counterName')
    });

    it('getCounterName just process.env.NODE_ENV defined', () => {
        process.env.NODE_ENV = 'testing'
        delete process.env.SERVICE_NAME

        let result: string = counterService['setCounterName']('counterName')
        expect(result).toEqual('testing.counterName')
    });

    it('getCounterName both process.env.NODE_ENV and process.env.SERVICE_NAME are undefined', () => {
        delete process.env.NODE_ENV
        delete process.env.SERVICE_NAME

        let result: string = counterService['setCounterName']('counterName')
        expect(result).toEqual('counterName')
    });
});
