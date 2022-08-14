import {UserDataDto} from "../../src/dto/user.data.dto";

export const loggerServiceMock = {
    debug: jest.fn().mockImplementation((...args) => {
        console.debug(args);
    }),
    info: jest.fn().mockImplementation((...args) => {
        console.info(args);
    }),
    error: jest.fn().mockImplementation((...args) => {
        console.error(args);
    }),
    warn: jest.fn().mockImplementation((...args) => {
        console.warn(args);
    }),
    verbose: jest.fn().mockImplementation((...args) => {
        console.log(args);
    }),
    setContext: jest.fn().mockImplementation((context: string) => {
        console.warn(context);
    })
};

export const MetricsServiceMock = {
    setClient: jest.fn().mockImplementation((...args) => {
    }),
    incrementCounter: jest.fn().mockImplementation((...args) => {
    }),
    decrementCounter: jest.fn().mockImplementation((...args) => {
    }),
    gaugeCounter: jest.fn().mockImplementation((...args) => {
    }),
    setCounter: jest.fn().mockImplementation((...args) => {
    }),
    timing: jest.fn().mockImplementation((...args) => {
    }),
    distribution: jest.fn().mockImplementation((...args) => {
    }),
    histogram: jest.fn().mockImplementation((...args) => {
    }),
    clientCheck: jest.fn().mockImplementation((...args) => {
    }),
    clientClose: jest.fn().mockImplementation((...args) => {
    }),
}


export const dbMock = {
    saveObject: jest.fn().mockImplementation((...args) => {
    }),
    get: jest.fn().mockImplementation((key) => {
    }),
    setUser: jest.fn().mockImplementation((key, value) => {
    }),
    updateUsersData: jest.fn().mockImplementation((key, value) => {
    }),
    getUserData: jest.fn().mockImplementation((userId, deviceID) => {
        return undefined
    }),
    getByConnectionId: jest.fn().mockImplementation((connectionId: string) => {
        return <UserDataDto>{
            connectionId: connectionId,
            userId: 'userId',
            deviceId: 'deviceId',
            deviceType: 'IOS',
            protocolVersion: "1.9",
            PNSToken: 'PNSToken',
            appSid: 'appSid',
            accountSid: 'accountId',
            organizationSid: 'organizationId',
            accessToken: 'accessToken'
        }
    }),
}

export const configServiceMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'sendWsMessage.retries':
                return 3
            case 'sendWsMessage.minTimeout':
                return 500
            case 'aws.webSocketUrl':
                return 'http://test' //dummy
            case 'aws.mock.ws':
                return true
            case 'aws.mock.http':
                return false
            case 'aws.region':
                return 'us-east-1'
            case 'pushNotification.timeout':
                return 500
            case 'pushNotification.retry':
                return 2
            case 'pushNotification.enabled':
                return true
            case 'cdr.enabled':
                return false
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

export const RetransmissionsMock = {
    setRetransmissionTimer: jest.fn().mockImplementation((response) => {
        console.debug(response);
    }),
    getRetransmissionTimer: jest.fn().mockImplementation((callId, toTag) => {
    }),
    cancelRetransmissionTimer: jest.fn().mockImplementation((callId, toTag) => {
    }),
    handleAckRequest: jest.fn().mockImplementation((callId, toTag) => {
    }),
    printMap: jest.fn().mockImplementation((printMap) => {
    })
}

export const CounterServiceMock = {
    setCounterName: jest.fn().mockImplementation((...args) => {
    }),
    getCounterName: jest.fn().mockImplementation((...args) => {
    }),
    setCounter: jest.fn().mockImplementation((counterType, counterData, value, counterName, tag) => {
    })
}

