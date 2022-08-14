import {Test, TestingModule} from '@nestjs/testing';
import {DynamoDbService} from '../../../src/common/db/dynamo.db.service';
import {DynamoTables} from "../../../src/common/db/dynamo.tables";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigServiceMock, DynamoDBServiceMock, MculoggerServiceMock} from "../mocks";
import {INestApplication} from "@nestjs/common";
import {DbService} from "../../../src/common/db/db.service";
import {ANSWER_ACTION, START_ACTION, USERS_TABLE} from "../../../src/common/constants";
import {SessionDto} from "../../../src/dto/session.dto";
import {UserDataDto} from "../../../src/dto/user.data.dto";


const isUsingRealAWSTable: boolean = false //when setting to ture => will work with dynamodb on dev


// //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
// describe('userTable functionalities - with partitionKey and sortKey', () => {
//
//     jest.setTimeout(10000)
//
//     let dynamoDbService: DynamoDbService
//     let dbService: DbService
//     let app: INestApplication;
//     let dynamoTables: DynamoTables
//     let region: string = ConfigServiceMock.get('aws.region')
//     let accessKeyId: string = ConfigServiceMock.get('dynamoDb.credentials.accessKeyId')
//     let secretAccessKey: string = ConfigServiceMock.get('dynamoDb.credentials.secretAccessKey')
//
//     let endpoint: string = ConfigServiceMock.get('dynamoDb.endpoint')
//
//     let tableName: string = 'userTable'
//     let partitionKeyName: string = 'user'
//     let firstGlobalIndexName: string = 'connectionIdIndex'
//     let firstGlobalKey: string = 'connectionId'
//     let secondGlobalIndexName: string = 'callIdIndex'
//     let secondGlobalKey: string = 'callId'
//
//     let credentials = {
//         credentials: {
//             accessKeyId: accessKeyId,
//             secretAccessKey: secretAccessKey
//         },
//         region: region
//     }
//
//     beforeAll(async () => {
//         if (isUsingRealAWSTable) {
//             dynamoTables = new DynamoTables(tableName, credentials, endpoint)
//             // await dynamoTables.createTableWithPartKeyString(tableName, partitionKeyName)
//             await dynamoTables.createUserTablePartitionKeyTwoGlobalSecondaryIndex(tableName, partitionKeyName, firstGlobalIndexName, firstGlobalKey, secondGlobalIndexName, secondGlobalKey)
//
//             await sleep(2000)
//         }
//     })
//
//     afterAll(async () => {
//         try {
//             if (isUsingRealAWSTable) {
//                 await dynamoTables.deleteTable(tableName);
//             }
//         } catch (e) {
//             console.info(e)
//         }
//         await app.close()
//     })
//
//     beforeEach(async () => {
//         let moduleRef: TestingModule
//         if (isUsingRealAWSTable) {
//             moduleRef = await Test.createTestingModule({
//                 providers: [DbService, DynamoDbService,
//                     {provide: ConfigurationService, useValue: ConfigServiceMock},
//                     {provide: MculoggerService, useValue: MculoggerServiceMock},
//                 ],
//             }).compile();
//         } else {
//             moduleRef = await Test.createTestingModule({
//                 providers: [DbService,
//                     {provide: DynamoDbService, useValue: DynamoDBServiceMock},
//                     {provide: ConfigurationService, useValue: ConfigServiceMock},
//                     {provide: MculoggerService, useValue: MculoggerServiceMock},
//                 ],
//             }).compile();
//         }
//
//         app = moduleRef.createNestApplication();
//         await app.init();
//
//         dynamoDbService = await moduleRef.get<DynamoDbService>(DynamoDbService);
//         dbService = await moduleRef.get<DbService>(DbService);
//
//     });
//
//     it('should be defined', () => {
//         expect(dynamoDbService).toBeDefined();
//     });
//
//
//     it('userTable => setUser, updateUser, getUser and deleteUser', async () => {
//         let user: string = 'testUser'
//         let userInfo: UserInfoDto = {
//             deviceId: "deviceId-222222",
//             user: {
//                 id: `sip:${user}@test.com`,
//                 name: user
//             },
//             connectionId: 'connectionId-1111111',
//             protocolVersion: "2.0",
//             token: {
//                 accessToken: 'accessToken-2222222',
//                 PNSToken: 'PNSToken-3333333',
//                 jti: 'jti-444444'
//             },
//             deviceType: 'Web',
//             organizationSid: 'Hummer',
//             accountSid: 'accountSid-555555',
//             app: {
//                 sid: 'sid-66666',
//                 id: 'id-777777'
//             },
//             callId: 'callid-11111',
//             getIdentifier(): string {
//                 return `${this.user}`;
//             },
//         }
//
//         // userInfo.protocolVersion = event.body.protocolVersion;
//         // userInfo.token.PNSToken = event.body.PNSToken;
//         // userInfo.deviceType = event.body.deviceType;
//
//         let updateData: WsRequestDto = {
//             connectionId: 'connctionId-updated',
//             dto:{
//                 callId: 'callid-11111',
//                 source: 'GW',
//                 ts: new Date().getTime(),
//                 destination: 'cpaas',
//                 type: 'Register',
//                 messageId: 222222,
//                 body: {
//                     userId: user,
//                     protocolVersion: '3.0',
//                     PNSToken: "PNSUpdateToken-3333333",
//                     deviceType: "iOS"
//
//                 }
//             }
//         }
//
//         await dbService.setUser(user, userInfo) //return void
//         let getResult = await dbService.getUser(user)
//
//         expect(getResult).toMatchObject({
//                 deviceId: "deviceId-222222",
//                 user: {
//                     id: `sip:${user}@test.com`,
//                     name: user
//                 },
//                 connectionId: 'connectionId-1111111',
//                 protocolVersion: "2.0",
//                 token: {
//                     accessToken: 'accessToken-2222222',
//                     PNSToken: 'PNSToken-3333333',
//                     jti: 'jti-444444'
//                 },
//                 deviceType: 'Web',
//                 organizationSid: 'Hummer',
//                 accountSid: 'accountSid-555555',
//                 app: {
//                     sid: 'sid-66666',
//                     id: 'id-777777'
//                 },
//                 callId: 'callid-11111',
//
//             }
//         )
//         //the ttl has diffent value
//         console.info(JSON.stringify(getResult))
//
//         await dbService.updateUser(updateData)
//         let getResultAfterUpdate = await dbService.getUser(user)
//
//         expect(getResultAfterUpdate).toMatchObject({
//             user: {
//                 id: `sip:${user}@test.com`,
//                 name: user
//             },
//             connectionId: 'connctionId-updated',
//             protocolVersion: "3.0",
//             token: {
//                 accessToken: 'accessToken-2222222',
//                 PNSToken: 'PNSUpdateToken-3333333',
//                 jti: 'jti-444444'
//             },
//             deviceType: 'iOS',
//             organizationSid: 'Hummer',
//             accountSid: 'accountSid-555555',
//             app: {
//                 sid: 'sid-66666',
//                 id: 'id-777777'
//             }
//         })
//
//         await dbService.delUser(user) //retunr void
//         let getResultsAfterDelete = await dbService.getUser(user)
//
//         expect(getResultsAfterDelete).toBe(undefined)
//     });
//
//     it('userTable => setUser, getByConnectionId and deleteUser', async () => {
//         let user: string = 'testUser'
//         let userInfo: UserInfoDto = {
//             deviceId: "deviceId-222222",
//             callId: "callID-11111",
//             user: {
//                 id: `sip:${user}@test.com`,
//                 name: user
//             },
//             connectionId: 'connectionId-1234567',
//             protocolVersion: "2.0",
//             token: {
//                 accessToken: 'accessToken-2222222',
//                 PNSToken: 'PNSToken-3333333',
//                 jti: 'jti-444444'
//             },
//             deviceType: 'Web',
//             organizationSid: 'Hummer',
//             accountSid: 'accountSid-555555',
//             app: {
//                 sid: 'sid-66666',
//                 id: 'id-777777'
//             },
//             getIdentifier(): string {
//                 return `${this.user}`;
//             },
//         }
//
//         await dbService.setUser(user, userInfo) //return void
//         let getResult = await dbService.getByConnectionId(userInfo.connectionId)
//
//         expect(getResult).toMatchObject({
//             user: {
//                 id: `sip:${user}@test.com`,
//                 name: user
//             },
//             connectionId: 'connectionId-1234567',
//             protocolVersion: "2.0",
//             token: {
//                 accessToken: 'accessToken-2222222',
//                 PNSToken: 'PNSToken-3333333',
//                 jti: 'jti-444444'
//             },
//             deviceType: 'Web',
//             organizationSid: 'Hummer',
//             accountSid: 'accountSid-555555',
//             app: {
//                 sid: 'sid-66666',
//                 id: 'id-777777'
//             }
//         })
//         //the ttl has diffent value
//         console.info(JSON.stringify(getResult))
//
//         await dbService.delUser(user) //retunr void
//         let getResultsAfterDelete = await dbService.getUser(user)
//
//         expect(getResultsAfterDelete).toBe(undefined)
//     });
//
//     it('userTable => setUser, getByCallId and deleteUser', async () => {
//         let user: string = 'testUser'
//         let userInfo: UserInfoDto = {
//             deviceId: "deviceId-222222",
//             callId: "callID-11111",
//             user: {
//                 id: `sip:${user}@test.com`,
//                 name: user
//             },
//             connectionId: 'connectionId-1234567',
//             protocolVersion: "2.0",
//             token: {
//                 accessToken: 'accessToken-2222222',
//                 PNSToken: 'PNSToken-3333333',
//                 jti: 'jti-444444'
//             },
//             deviceType: 'Web',
//             organizationSid: 'Hummer',
//             accountSid: 'accountSid-555555',
//             app: {
//                 sid: 'sid-66666',
//                 id: 'id-777777'
//             },
//             getIdentifier(): string {
//                 return `${this.user}`;
//             },
//         }
//
//         await dbService.setUser(user, userInfo) //return void
//         let getResult = await dbService.getByCallId(userInfo.callId)
//
//         expect(getResult).toMatchObject({
//             user: {
//                 id: `sip:${user}@test.com`,
//                 name: user
//             },
//             connectionId: 'connectionId-1234567',
//             protocolVersion: "2.0",
//             token: {
//                 accessToken: 'accessToken-2222222',
//                 PNSToken: 'PNSToken-3333333',
//                 jti: 'jti-444444'
//             },
//             deviceType: 'Web',
//             organizationSid: 'Hummer',
//             accountSid: 'accountSid-555555',
//             app: {
//                 sid: 'sid-66666',
//                 id: 'id-777777'
//             }
//         })
//         //the ttl has diffent value
//         console.info(JSON.stringify(getResult))
//
//         await dbService.delUser(user) //retunr void
//         let getResultsAfterDelete = await dbService.getUser(user)
//
//         expect(getResultsAfterDelete).toBe(undefined)
//     });
//
//
// })
describe('actionTable functionalities - with partitionKey', () => {

    jest.setTimeout(10000)

    let dynamoDbService: DynamoDbService
    let dbService: DbService
    let app: INestApplication;
    let dynamoTables: DynamoTables
    let region: string = ConfigServiceMock.get('aws.region')
    let accessKeyId: string = ConfigServiceMock.get('dynamoDb.credentials.accessKeyId')
    let secretAccessKey: string = ConfigServiceMock.get('dynamoDb.credentials.secretAccessKey')

    let endpoint: string = ConfigServiceMock.get('dynamoDb.endpoint')

    let tableName: string = ConfigServiceMock.get("dynamoDb.actionTable.tableName")
    let partitionKeyName: string = 'msgId'
    let sortKeyName: string = 'seq'


    let credentials = {
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        },
        region: region
    }

    beforeAll(async () => {
        if (isUsingRealAWSTable) {
            dynamoTables = new DynamoTables(tableName, credentials, endpoint)
            await dynamoTables.createTableWithPartAndSortNumber(tableName, partitionKeyName, sortKeyName)
            await sleep(2000)
        }
    })

    afterAll(async () => {
        try {
            if (isUsingRealAWSTable) {
                await dynamoTables.deleteTable(tableName);
            }
        } catch (e) {
            console.info(e)
        }
        await app.close()
    })

    beforeEach(async () => {
        let moduleRef: TestingModule
        if (isUsingRealAWSTable) {
            moduleRef = await Test.createTestingModule({
                providers: [DbService, DynamoDbService,
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        } else {
            moduleRef = await Test.createTestingModule({
                providers: [DbService,
                    {provide: DynamoDbService, useValue: DynamoDBServiceMock},
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        }

        app = moduleRef.createNestApplication();
        await app.init();

        dynamoDbService = await moduleRef.get<DynamoDbService>(DynamoDbService);
        dbService = await moduleRef.get<DbService>(DbService);

    });

    it('actionTable => setAction and getAction and delAction', async () => {

        let msgId: string = 'msgid-11111'
        let seq: string = "10"
        let action: string = START_ACTION

        await dbService.setAction(msgId, seq, action) //return void
        await sleep(1000)
        let getResult = await dbService.getAction(msgId, seq)
        await dbService.delAction(msgId, seq) //retunr void
        let getResultsAfterDelete = await dbService.getAction(msgId, seq)

        expect(getResult).toBe(ANSWER_ACTION)
        console.info(JSON.stringify(getResult))

        expect(getResultsAfterDelete).toBe(undefined)
    });


})
// describe('convertToUserInfo', () => {
//
//     jest.setTimeout(10000)
//
//
//     let dbService: DbService
//     let app: INestApplication;
//
//     beforeAll(async () => {
//
//     })
//
//     afterAll(async () => {
//         await app.close()
//     })
//
//     beforeEach(async () => {
//         let moduleRef: TestingModule
//         if (isUsingRealAWSTable) {
//             moduleRef = await Test.createTestingModule({
//                 providers: [DbService, DynamoDbService,
//                     {provide: ConfigurationService, useValue: ConfigServiceMock},
//                     {provide: MculoggerService, useValue: MculoggerServiceMock},
//                 ],
//             }).compile();
//         } else {
//             moduleRef = await Test.createTestingModule({
//                 providers: [DbService,
//                     {provide: DynamoDbService, useValue: DynamoDBServiceMock},
//                     {provide: ConfigurationService, useValue: ConfigServiceMock},
//                     {provide: MculoggerService, useValue: MculoggerServiceMock},
//                 ],
//             }).compile();
//         }
//
//         app = moduleRef.createNestApplication();
//         await app.init();
//
//         dbService = await moduleRef.get<DbService>(DbService);
//
//     });
//
//     it('convertToUserInfo', async () => {
//         let apiGwEvent: WsRequestDto = {
//             connectionId: 'connectionId-111111',
//
//             dto: {
//                 type: 'call',
//                 messageId: 1111111,
//                 destination: 'dst@test.com',
//                 source: 'src@test.com0',
//                 callId: 'call-id111111',
//                 ts: 112233,
//                 body: {
//                     userId: 'test@test.com',
//                 }
//             }
//         };
//
//         let userInfo = dbService['convertToUserInfo'](apiGwEvent)
//         console.log(userInfo)
//         expect(userInfo).toMatchObject({ //all undefined values are not display in Obj
//             "user": {
//                 "id": "test@test.com"
//             },
//             "app": {},
//             "connectionId": "connectionId-111111",
//             "token": {},
//             "callId": "call-id111111"
//         })
//     });
//
//
// })


describe('sessionTable functionalities', () => {

    jest.setTimeout(10000)

    let dynamoDbService: DynamoDbService
    let dbService: DbService
    let app: INestApplication;
    let dynamoTables: DynamoTables
    let region: string = ConfigServiceMock.get('aws.region')
    let accessKeyId: string = ConfigServiceMock.get('dynamoDb.credentials.accessKeyId')
    let secretAccessKey: string = ConfigServiceMock.get('dynamoDb.credentials.secretAccessKey')

    let endpoint: string = ConfigServiceMock.get('dynamoDb.endpoint')

    let tableName: string = ConfigServiceMock.get("dynamoDb.sessionTable.tableName")
    let partitionKeyName: string = 'callId'

    let credentials = {
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        },
        region: region
    }

    beforeAll(async () => {
        if (isUsingRealAWSTable) {
            dynamoTables = new DynamoTables(tableName, credentials, endpoint)
            await dynamoTables.createTableWithPartKeyString(tableName, partitionKeyName)
            await sleep(2000)
        }
    })

    afterAll(async () => {
        try {
            if (isUsingRealAWSTable) {
                await dynamoTables.deleteTable(tableName);
            }
        } catch (e) {
            console.info(e)
        }
        await app.close()
    })

    beforeEach(async () => {
        let moduleRef: TestingModule
        if (isUsingRealAWSTable) {
            moduleRef = await Test.createTestingModule({
                providers: [DbService, DynamoDbService,
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        } else {
            moduleRef = await Test.createTestingModule({
                providers: [DbService,
                    {provide: DynamoDbService, useValue: DynamoDBServiceMock},
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        }

        app = moduleRef.createNestApplication();
        await app.init();

        dynamoDbService = await moduleRef.get<DynamoDbService>(DynamoDbService);
        dbService = await moduleRef.get<DbService>(DbService);

    });

    it('sessionData => setAction and getAction and delAction', async () => {

        let callId: string = 'callId-22222'
        let sessionData: SessionDto = {
            callId: callId,
            connectionId: 'connectionId-222222',
            userId: 'userID@fmail.com',
            deviceId: 'deviceId-22222'
        }

        await dbService.setSessionData(sessionData ) //return void
        await sleep(1000)
        let getResult = await dbService.getSessionData(callId)
        await dbService.delSessionData(callId) //retunr void
        let getResultsAfterDelete = await dbService.getSessionData(callId)

        expect(getResult).toMatchObject(sessionData)
        console.info(JSON.stringify(getResult))

        expect(getResultsAfterDelete).toBe(undefined)
    });
})

describe('usersTable functionalities - with userId as partitionKey deviceId and sortKey', () => {

    jest.setTimeout(10000)

    let dynamoDbService: DynamoDbService
    let dbService: DbService
    let app: INestApplication;
    let dynamoTables: DynamoTables
    let region: string = ConfigServiceMock.get('aws.region')
    let accessKeyId: string = ConfigServiceMock.get('dynamoDb.credentials.accessKeyId')
    let secretAccessKey: string = ConfigServiceMock.get('dynamoDb.credentials.secretAccessKey')

    let endpoint: string = ConfigServiceMock.get('dynamoDb.endpoint')

    let tableName: string = USERS_TABLE
    let partitionKeyName: string = 'userId'
    let sortKey : string = 'deviceId'
    let globalIndexName: string = 'connectionIdIndex'
    let globalIndexKey: string = 'connectionId'

    let credentials = {
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        },
        region: region
    }

    beforeAll(async () => {
        if (isUsingRealAWSTable) {
            dynamoTables = new DynamoTables(tableName, credentials, endpoint)
            // await dynamoTables.createTableWithPartKeyString(tableName, partitionKeyName)
            await dynamoTables.createTableGlobalSecondaryIndexString(tableName, partitionKeyName, sortKey,globalIndexName, globalIndexKey)

            await sleep(2000)
        }
    })

    afterAll(async () => {
        try {
            if (isUsingRealAWSTable) {
                await dynamoTables.deleteTable(tableName);
            }
        } catch (e) {
            console.info(e)
        }
        await app.close()
    })

    beforeEach(async () => {
        let moduleRef: TestingModule
        if (isUsingRealAWSTable) {
            moduleRef = await Test.createTestingModule({
                providers: [DbService, DynamoDbService,
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        } else {
            moduleRef = await Test.createTestingModule({
                providers: [DbService,
                    {provide: DynamoDbService, useValue: DynamoDBServiceMock},
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        }

        app = moduleRef.createNestApplication();
        await app.init();

        dynamoDbService = await moduleRef.get<DynamoDbService>(DynamoDbService);
        dbService = await moduleRef.get<DbService>(DbService);

    });

    it('should be defined', () => {
        expect(dynamoDbService).toBeDefined();
    });


    it('usersTable => setUser, updateUser, getUserData and deleteUser', async () => {
        let user: string = 'testUser'
        let userData: UserDataDto = {
            deviceId: "deviceId-222222",
            userId: `sip:${user}@test.com`,
            connectionId: 'connectionId-1111111',
            protocolVersion: "2.0",
            accessToken: 'accessToken-2222222',
            PNSToken: 'PNSToken-3333333',
            deviceType: 'IOS',
            organizationSid: 'Hummer',
            accountSid: 'accountSid-555555',
            appSid:'app-sid-66666'
        }


        let updateData: UserDataDto = {
            deviceId: "deviceId-222222",
            userId: `sip:${user}@test.com`,
            connectionId: 'update-connectionId-1111111',
            accessToken: 'update-accessToken-2222222',
            PNSToken: 'update-PNSToken-3333333'
        }

        await dbService.setUser(userData) //return void
        let getResult = await dbService.getUserData(userData.userId, userData.deviceId)

        expect(getResult).toMatchObject(userData)
        //the ttl has diffent value
        console.info(JSON.stringify(getResult))

        await dbService.updateUsersData(updateData)
        let getResultAfterUpdate = await dbService.getUserData(userData.userId, userData.deviceId)

        expect(getResultAfterUpdate).toMatchObject({
            deviceId: "deviceId-222222",
            userId: `sip:${user}@test.com`,
            //connectionId: 'update-connectionId-1111111',
            connectionId: updateData.connectionId,
            //accessToken: 'update-accessToken-2222222',
            accessToken: updateData.accessToken,
            //PNSToken: 'update-PNSToken-3333333',
            PNSToken: updateData.PNSToken,
            protocolVersion: "2.0",
            deviceType: 'IOS',
            organizationSid: 'Hummer',
            accountSid: 'accountSid-555555',
            // appId: 'app-id-777777',
            appSid:'app-sid-66666'
        })

        await dbService.delUsersData(userData.userId, userData.deviceId) //retunr void
        let getResultsAfterDelete = await dbService.getUserData(userData.userId, userData.deviceId)

        expect(getResultsAfterDelete).toBe(undefined)
    });

    it('userTable => setUser, getByConnectionId, getByUserId and delUsersData ', async () => {
        let user: string = 'testUser2'
        let userData1: UserDataDto = {
            deviceId: "deviceId-111111",
            userId: `sip:${user}@test.com`,
            connectionId: 'connectionId-111111',
            protocolVersion: "2.0",
            accessToken: 'accessToken-111111',
            PNSToken: 'PNSToken-111111',
            deviceType: 'IOS',
            organizationSid: 'Hummer',
            accountSid: 'accountSid-111111',
            // appId: 'app-id-111111',
            appSid:'app-sid-111111'
        }

        let userData2: UserDataDto = {
            deviceId: "deviceId-222222",
            userId: `sip:${user}@test.com`,
            connectionId: 'connectionId-222222',
            protocolVersion: "2.0",
            accessToken: 'accessToken-222222',
            PNSToken: 'PNSToken-222222',
            deviceType: 'IOS',
            organizationSid: 'Hummer',
            accountSid: 'accountSid-222222',
            // appId: 'app-id-222222',
            appSid:'app-sid-222222'
        }

        let userData3: UserDataDto = {
            deviceId: "deviceId-33333",
            userId: `sip:${user}@test.com`,
            connectionId: 'connectionId-33333',
            protocolVersion: "2.0",
            accessToken: 'accessToken-33333',
            PNSToken: 'PNSToken-33333',
            deviceType: 'IOS',
            organizationSid: 'Hummer',
            accountSid: 'accountSid-33333',
            // appId: 'app-id-33333',
            appSid:'app-sid-33333'
        }
        if(isUsingRealAWSTable) {
            await dbService.setUser(userData1) //return void
            await dbService.setUser(userData2) //return void
            await dbService.setUser(userData3) //return void


            let getByConnectionIdResults: UserDataDto = await dbService.getByConnectionId(userData1.connectionId)
            expect(getByConnectionIdResults).toMatchObject(userData1)

            let getByUserIdResult: Array<UserDataDto> = await dbService.getByUserId(userData1.userId)
            expect(getByUserIdResult.length).toEqual(3)


            await dbService.delUsersData(userData1.userId, userData1.deviceId)
            await dbService.delUsersData(userData2.userId, userData2.deviceId)
            await dbService.delUsersData(userData3.userId, userData3.deviceId)

            let getByUserIdResultAfterDelete: Array<UserDataDto> = await dbService.getByUserId(userData1.userId)
            expect(getByUserIdResultAfterDelete.length).toEqual(0) //return empty array
        } else {
            expect(undefined).toBe(undefined) //This TCs run just when isUsingRealAWSTable set to true
        }

    });

})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
