import {Test, TestingModule} from '@nestjs/testing';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {FirebaseService} from "../../src/push/firebase/firebase.service";
import * as admin from "firebase-admin";
import {loggerServiceMock} from "../testutils/test.mock";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import { INestApplication} from "@nestjs/common";
import {sleep} from "../testutils/test.utils";
import {UserDataDto} from "../../src/dto/user.data.dto";

const configServiceMock = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'pushNotification.enabled':
                return true;
            default :
                return defVal;
        }
    })
};

const configServiceMockTimer = {
    get: jest.fn().mockImplementation((name, defVal) => {
        switch (name) {
            case 'pushNotification.enabled':
                return true;
            case 'pushNotification.clientTimerFlag':
                return true;
            case 'pushNotification.clientTimer':
                return 1000;
            default :
                return defVal;
        }
    })
};

let userData: UserDataDto = {
    userId: "dudu1234@webrtc-dev.restcomm.com",
    connectionId: "1",
    accessToken: "accessToken-777777777",
    PNSToken: "PUSH_TOKEN",
    accountSid: "accountSid-7777777777",
    appSid: "appSid-7777777"
}
let appKey = userData.accountSid + "_" + userData.appSid;

describe('FirebasePushService', () => {
    let service: FirebaseService;
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            providers: [FirebaseService
                , {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: ConfigurationService, useValue: configServiceMock}
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        service = app.get<FirebaseService>(FirebaseService);

        await app.init();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('FirebasePushService constructions', () => {
        expect(service).toBeDefined();
    });

    xit('FirebasePushService: success', async () => {

        console.log('send message:');

        let accountId: string = "accountId";
        let firebaseMock = jest.spyOn(service, 'createClient');
        //let token = "YOUR_REGISTRATION_TOKEN";
        let token = "ex5FwOYwQ7C2ReOPEZagdP:APA91bHAOn4Wbq2GR8a8zp1JS5ttDvc9EUBzl0lFOg0irwiZAbiW_87ZCCTJHui4Rp-9UUB6scCZPFLzHXoQOM-OevJ1I_JO2q_xt_qrfsFJCa6DcSa0dwLho9sQCQGpRUWEdBx-BU5o";

        let userDataClient: UserDataDto = {
            userId: "dudu1234@127.0.0.1:8085",
            connectionId: "1",
            accessToken: "accessToken-777777777",
            PNSToken: token,
            accountSid: "accountSid-7777777777",
            appSid: "appSid-7777777"
        }

        let appKey = userDataClient.accountSid + "_" + userDataClient.appSid;

        let response: boolean = await service.sendNotification("test1@test.com", userDataClient)
        console.log('Received response:', response);
        expect(response).toEqual(true);
        expect(response).toBeDefined();

        expect(firebaseMock).toHaveBeenCalledTimes(1);

        await service.deleteClient(appKey);
        await sleep(50);

    });

    it('FirebasePushService: error on token from firebase', async () => {

      console.log('send message:');

      let firebaseMock = jest.spyOn(service, 'createClient');

      await service.sendNotification("test1@test.com", userData)
        .then((response)=> {
            // Response is a message ID string.
            console.log('Received response:', response);
        })
        .catch((error) => {
            console.log('Error sending message:', error);
            console.log(error);
            expect(error.errorInfo.message).toEqual("The registration token is not a valid FCM registration token");
        });

        expect(firebaseMock).toHaveBeenCalledTimes(1);
        await service.deleteClient(appKey);
        await sleep(50);

    });

    it('FirebasePushService:  deleteClient - error on token from firebase', async () => {

        console.log('send message:');

        let firebaseMock = jest.spyOn(service, 'createClient');

        await service.sendNotification("test@test.com", userData)
            .then((response)=> {
                // Response is a message ID string.
                console.log('Received response:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                console.log(error);
                expect(error.errorInfo.message).toEqual("The registration token is not a valid FCM registration token");
            });

        await sleep(200);

        await service.deleteClient(appKey);
        await sleep(20);

        await service.sendNotification("test@test.com", userData)
            .then((response)=> {
                // Response is a message ID string.
                console.log('Received response:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                console.log(error);
                expect(error.errorInfo.message).toEqual("The registration token is not a valid FCM registration token");
            });

        expect(firebaseMock).toHaveBeenCalledTimes(2);

        await service.deleteClient(appKey);
        await sleep(50);

    });

    it('FirebasePushService: send 2 notifications check getClient - error on token from firebase', async () => {

        console.log('send message:');

        let firebaseMock = jest.spyOn(service, 'createClient');

        await service.sendNotification("test@test.com", userData)
            .then((response)=> {
                // Response is a message ID string.
                console.log('Received response:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                console.log(error);
                expect(error.errorInfo.message).toEqual("The registration token is not a valid FCM registration token");
            });

        await sleep(20);

        await service.sendNotification("test@test.com", userData)
            .then((response)=> {
                // Response is a message ID string.
                console.log('Received response:', response);
            })
            .catch((error) => {
                console.log('Error sending message:', error);
                console.log(error);
                expect(error.errorInfo.message).toEqual("The registration token is not a valid FCM registration token");
            });

        expect(firebaseMock).toHaveBeenCalledTimes(1);

        await service.deleteClient(appKey);
        await sleep(50);

    });

    it('FirebasePushService: buildNotification', async () => {

        const registrationToken = 'YOUR_REGISTRATION_TOKEN';
        let userId = "test@test.com";

        let expectedMessage: admin.messaging.TokenMessage = {
            notification: {
                title: 'MAVENIR',
                body: userId + ' is calling you'
            },
            token: registrationToken,
        }

        let message: admin.messaging.TokenMessage = service.buildNotification(userId, 'YOUR_REGISTRATION_TOKEN');
        expect(expectedMessage).toEqual(message);

    });
})

describe('FirebasePushService - test setClientTimer', () => {
    let service: FirebaseService;
    let app: INestApplication;

    jest.setTimeout(5000);

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            providers: [FirebaseService
                , {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: ConfigurationService, useValue: configServiceMockTimer}
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        service = app.get<FirebaseService>(FirebaseService);

        await app.init();
    });

    afterAll(() => {
        app.close();
        jest.clearAllMocks();
    });

    it('FirebasePushService constructions', () => {
        expect(service).toBeDefined();
    });

    it('FirebasePushService: setClientTimer', async () => {

        let firebaseMock1 = jest.spyOn(service, 'createClient');
        let firebaseMock2 = jest.spyOn(service, 'deleteClient');

        await service.getAccountClient(userData)
            .catch((error) => {
                console.log('Error getAccountClient', error);
                console.log(error);
            });

        await sleep(1200);

        expect(firebaseMock1).toHaveBeenCalledTimes(1);
        expect(firebaseMock2).toHaveBeenCalledTimes(1);

    });
})

