import {Test, TestingModule} from '@nestjs/testing';
import {DynamoDbService} from '../../../src/common/db/dynamo.db.service';
import {DynamoTables} from "../../../src/common/db/dynamo.tables";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigServiceMock, DynamoDBServiceMock, MculoggerServiceMock} from "../mocks";
import {INestApplication} from "@nestjs/common";
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {RestcommDbService} from "../../../src/common/db/restcomm.db.service";
import {SipSession} from "../../../src/callserviceapi/sip/common/sipSessionDTO";
import {RequestDTO} from "../../../src/callserviceapi/sip/common/sipMessageDTO";
import {SIP_TABLE} from "../../../src/common/constants";


const isUsingRealAWSTable: boolean = false //when setting to ture => will work with dynamodb on dev


// //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
describe('sipTable - with partitionKey and sortKey as a primary keys and global index', () => {
    let dbService: DynamoDbService
    let restComDbService: RestcommDbService
    let app: INestApplication;
    let dynamoTables: DynamoTables
    let region: string = ConfigServiceMock.get('aws.region')
    let accessKeyId: string = ConfigServiceMock.get('dynamoDb.credentials.accessKeyId')
    let secretAccessKey: string = ConfigServiceMock.get('dynamoDb.credentials.secretAccessKey')

    let endpoint: string = ConfigServiceMock.get('dynamoDb.endpoint')

    let tableName: string = SIP_TABLE
    let partitionKeyName: string = 'callId'
    let sortKeyName: string = 'type'
    let globalIndexName: string = 'sipIndex'
    let globalSortKey: string = 'isSetAck'

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
            await dynamoTables.createSipTable(tableName, partitionKeyName, sortKeyName, globalSortKey, globalIndexName)
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
        if(isUsingRealAWSTable){
            moduleRef = await Test.createTestingModule({
                providers: [RestcommDbService,DynamoDbService,
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        } else {
            moduleRef = await Test.createTestingModule({
                providers: [RestcommDbService,
                    {provide: DynamoDbService, useValue: DynamoDBServiceMock},
                    {provide: ConfigurationService, useValue: ConfigServiceMock},
                    {provide: MculoggerService, useValue: MculoggerServiceMock},
                ],
            }).compile();
        }

        app = moduleRef.createNestApplication();
        await app.init();

        dbService = await moduleRef.get<DynamoDbService>(DynamoDbService);
        restComDbService = await moduleRef.get<RestcommDbService>(RestcommDbService);

    });

    it('should be defined', () => {
        expect(dbService).toBeDefined();
    });


    it('setUserSession, updateUserSession, getUserSession and deleteUserSession', async () => {
        let callId: string = '1111111'
        let session: SipSession = {
            callId: callId,
            from: {uri: 'sip@test.com'},
            to: {uri: 'sipDist@test2.com'},
            destContact: [{uri: 'contact@contact.com'}],
            seqNumber: 1
        }

        let putResult = await restComDbService.setUserSession(session) //return void
        await restComDbService.updateUserSession(callId, 200)
        let getResult = await restComDbService.getUserSession(callId)
        let deletResult = await restComDbService.deleteUserSession(callId) //retunr void
        let getResultsAfterDelete = await restComDbService.getUserSession(callId)

        expect(getResult).toMatchObject({
            // ttl: expect.any(Number),
            callId: callId,
            from: {uri: 'sip@test.com'},
            to: {uri: 'sipDist@test2.com'},
            destContact: [{uri: 'contact@contact.com'}],
            seqNumber: 200 //After Update seqNumner
        }) //the ttl has diffent value
        console.info(JSON.stringify(getResult))

        expect(getResultsAfterDelete).toBe(undefined)
    });

    it('setSipRequest and getSipRequest and deleteSipRequest', async () => {
        let callId: string = '22222'
        let cSeqNum: string = '1'
        let session: RequestDTO = {
            method: 'INVITE',
            uri: 'sip@sipuri.com',
            version: '2.0',
            headers: {
                to: {uri: 'sipDist@test2.com'},
                from: {uri: 'sip@test.com'},
                "call-id": callId,
                cseq: {method: 'INVITE', seq: 1},
                contact: [{uri: 'contact@contact.com'}],
                authorization: 'authrizatio111111'
            }
        }

        let putResult = await restComDbService.setSipRequest(callId, cSeqNum, session) //return void
        let getResult = await restComDbService.getSipRequest(callId, cSeqNum)
        let deletResult = await restComDbService.deleteSipRequest(callId, cSeqNum) //retunr void
        let getResultsAfterDelete = await restComDbService.getSipRequest(callId, cSeqNum)

        expect(getResult).toMatchObject(session)
        console.info(JSON.stringify(getResult))

        expect(getResultsAfterDelete).toBe(undefined)
    });

    it('setAck and getAck and deleteAck', async () => {
        let callId: string = '22222'
        let value: 'true' | 'false' = 'true'

        let putResult = await restComDbService.setAck(callId, value) //return void
        let getResult = await restComDbService.getAck(callId)
        let deletResult = await restComDbService.deleteAck(callId) //retunr void
        let getResultsAfterDelete = await restComDbService.getAck(callId)

        expect(getResult).toBe(true) //the ttl has diffent value
        console.info(JSON.stringify(getResult))

        expect(getResultsAfterDelete).toBe(false)//in case of undefined retrun 'false'
    });


    xit('Put and Get object from dynamodb - Get by partitionKeyName and sortKey', async () => {
        // expect(factory.getDB()).toHaveBeenCalledTimes(1)
        let data1 = {
            [partitionKeyName]: 'callid-1111',
            [sortKeyName]: 'setAck',
            [globalSortKey]: 'true',
        }

        let data2 = {
            [partitionKeyName]: 'callid-2222',
            [sortKeyName]: 'setAck',
            [globalSortKey]: 'false',
        }


        let putResult = await dbService.put(tableName, data1, 1000)
        let getResult = await dbService.get(tableName, {
                [partitionKeyName]: 'callid-1111',
                [sortKeyName]: 'setAck'
            }
        )
        expect(putResult).toBe(true)
        expect(getResult).toMatchObject({
            "ttl": expect.any(Number),
            [partitionKeyName]: 'callid-1111',
            [sortKeyName]: 'setAck',
            [globalSortKey]: 'true',
        }) //the ttl has diffent value
        console.info(JSON.stringify(getResult))
    });

    xit('Put and query  from dynamodb - Get by Global Secondary Indexes', async () => {//speed up queries on non-key attributes
        // expect(factory.getDB()).toHaveBeenCalledTimes(1)
        let data1 = {

            [partitionKeyName]: 'callid-3333',
            [sortKeyName]: 'setAck',
            [globalSortKey]: 'true',
        }

        let data2 = {
            [partitionKeyName]: 'callid-4444',
            [sortKeyName]: 'setAck',
            [globalSortKey]: 'false',
        }


        let putResults1 = await dbService.put(tableName, data1, 1000)
        let putResults2 = await dbService.put(tableName, data2, 1000)
        expect(putResults1).toBe(true)
        expect(putResults2).toBe(true)

        if (isUsingRealAWSTable) { //Query check just with real aws table
            await sleep(3000) //to update the table

            //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
            let query: DocumentClient.QueryInput = {
                TableName: tableName,
                KeyConditionExpression: `#global = :sortKey and #sortkey = :value`,
                // KeyConditionExpression: `#global = :value`,
                ExpressionAttributeValues: {
                    ":value": 'callid-4444',
                    ":sortKey": 'false'
                },
                ExpressionAttributeNames: {
                    "#global": globalSortKey,
                    "#sortkey": partitionKeyName
                },
                IndexName: globalIndexName
            }

            let result = await dbService.queryDb(query)
            console.info(result)

            expect(result[0]).toMatchObject({
                [partitionKeyName]: 'callid-4444',
                [sortKeyName]: 'setAck',
                [globalSortKey]: 'false',
            }) //the ttl has diffent value
        }

    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})
