import {Test, TestingModule} from '@nestjs/testing';
import {DynamoDbService} from '../../../src/common/db/dynamo.db.service';
import {DynamoTables} from "../../../src/common/db/dynamo.tables";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigServiceMock, DynamoClientMock, MculoggerServiceMock} from "../mocks";
import {INestApplication} from "@nestjs/common";
import {ClientConfiguration, DocumentClient} from "aws-sdk/clients/dynamodb";


const isUsingRealAWSTable: boolean = false //when setting to ture => will work with dynamodb on dev

if (!isUsingRealAWSTable) {
    jest.spyOn(DynamoDbService.prototype as any, 'putItem').mockImplementation(async (tableName, item) => await DynamoClientMock.putItem(tableName, item));
    jest.spyOn(DynamoDbService.prototype as any, 'getItem').mockImplementation(async (tableName, key) => await DynamoClientMock.getItem(tableName, key));
    jest.spyOn(DynamoDbService.prototype as any, 'deleteItem').mockImplementation(async (tableName, key) => await DynamoClientMock.deleteItem(tableName, key));
    jest.spyOn(DynamoDbService.prototype as any, 'scan').mockImplementation(async (tableName, primaryKeyName, keyPrefix) => await DynamoClientMock.scan(tableName, primaryKeyName, keyPrefix));
}


describe('DynamoDBService - with partitionKey and sortKey as a primary keys', () => {
    let dbService: DynamoDbService
    let app: INestApplication;
    let dynamoTables: DynamoTables
    let region: string = ConfigServiceMock.get('aws.region')
    let accessKeyId: string = ConfigServiceMock.get('dynamoDb.credentials.accessKeyId')
    let secretAccessKey: string = ConfigServiceMock.get('dynamoDb.credentials.secretAccessKey')
    let endpoint: string = ConfigServiceMock.get('dynamoDb.endpoint')

    let tableName: string = 'MusicCollection'
    let partitionKeyName: string = 'Artist'
    let sortKey: string = 'SongTitle'

    jest.setTimeout(10000)

    let credentials: ClientConfiguration = {
        credentials: {
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        },
        region: region
    }

    beforeAll(async () => {
        if (isUsingRealAWSTable) {
            dynamoTables = new DynamoTables(tableName, credentials, endpoint)
            await dynamoTables.createTableWithPartAndSortString(tableName, partitionKeyName, sortKey)
        }
    })


    afterAll(async () => {
        try {
            if (isUsingRealAWSTable) {
                await dynamoTables.deleteTable(tableName)
            }
        } catch (e) {
            console.info(e)
        }

        await app.close()
    })

    beforeEach(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [DynamoDbService,
                {provide: ConfigurationService, useValue: ConfigServiceMock},
                {provide: MculoggerService, useValue: MculoggerServiceMock},
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();

        dbService = await moduleRef.get<DynamoDbService>(DynamoDbService);
    });

    it('should be defined', () => {
        expect(dbService).toBeDefined();
    });

    it('Put object in dynamodb', async () => {

        let data = {
            [partitionKeyName]: 'David',
            [sortKey]: 'Halelloya',
            Gander: 'Male',
            Age: 36

        }
        let results = await dbService.put(tableName, data, 1000)
        expect(results).toBe(true)
    });

    it('Put and Get object from dynamodb', async () => {
        // expect(factory.getDB()).toHaveBeenCalledTimes(1)
        let data1 = {
            [partitionKeyName]: 'Eran',
            [sortKey]: 'Haleloya',
            Gander: 'Male',
            Age: 36
        }

        let data2 = {
            [partitionKeyName]: 'Eran',
            [sortKey]: 'Shalom',
            Gander: 'Male',
            Age: 36
        }


        let putResults2 = await dbService.put(tableName, data2, 1000)
        let getResult = await dbService.get(tableName, {
                [partitionKeyName]: 'Eran',
                [sortKey]: 'Shalom'
            }
        )
        expect(putResults2).toBe(true)
        expect(getResult).toMatchObject({
            "ttl": expect.any(Number),
            [partitionKeyName]: 'Eran',
            [sortKey]: 'Shalom',
            Gander: 'Male',
            Age: 36
        }) //the ttl has diffrent value
        console.info(JSON.stringify(getResult))
    });

    it('Put, Update and Get object from dynamodb', async () => {
        // expect(factory.getDB()).toHaveBeenCalledTimes(1)


        let partitionKeyValue: string = 'David'
        let sortKeyValue: string = 'The best town'
        // let action: AttributeAction = AttributeAction.ADD

        let data1 = {
            [partitionKeyName]: partitionKeyValue,
            [sortKey]: sortKeyValue,
            Gander: 'Male',
            Age: 36
        }

        let key = {
            [partitionKeyName]: partitionKeyValue,
            [sortKey]: sortKeyValue,
        }

        //Add new attribute
        let addAttribute: DocumentClient.UpdateItemInput = {
            TableName: tableName,
            Key: key,
            UpdateExpression: "SET #ri = :g",
            ExpressionAttributeNames: {"#ri": "NewAttribute"},
            ExpressionAttributeValues: {":g": "updateByScript"},
            ReturnValues: "ALL_NEW"
        }

        //Apdate attribute
        let updateAttribute: DocumentClient.UpdateItemInput = {
            TableName: tableName,
            Key: key,
            UpdateExpression: "SET #ri = :g",
            ExpressionAttributeNames: {"#ri": "Gander"},
            ExpressionAttributeValues: {":g": "Female"},
            ReturnValues: "ALL_NEW"
        }

        let putResults = await dbService.put(tableName, data1, 1000)
        expect(putResults).toBe(true)

        if (isUsingRealAWSTable) { //Update is checking just by real aws dynamo db
            let update1 = await dbService.update(addAttribute)
            let update2 = await dbService.update(updateAttribute)

            await sleep(3000) //in order table will be update

            let getResult = await dbService.get(tableName, {
                    [partitionKeyName]: partitionKeyValue,
                    [sortKey]: 'The best town',
                }
            )

            expect(update1).toBe(true)
            expect(update2).toBe(true)
            expect(getResult).toMatchObject({
                "ttl": expect.any(Number),
                [partitionKeyName]: partitionKeyValue,
                [sortKey]: sortKeyValue,
                Gander: 'Female', //update value
                Age: 36,
                NewAttribute: "updateByScript"

            }) //the ttl has diffrent value
            console.info(JSON.stringify(getResult))
        }

    });

    it('Put and Get Delete and GEt object from dynamodb', async () => {

        let data = {
            [partitionKeyName]: 'Alexsandra',
            [sortKey]: 'Haleloya',
            Gander: 'Female',
            Age: 30
        }

        let putResults = await dbService.put(tableName, data, 1000)
        let getResult1 = await dbService.get(tableName,
            {
                [partitionKeyName]: 'Alexsandra',
                [sortKey]: 'Haleloya'
            }
        )
        await dbService.remove(tableName,
            {
                [partitionKeyName]: 'Alexsandra',
                [sortKey]: 'Haleloya'
            })
        let getResult2 = await dbService.get(tableName, {
            [partitionKeyName]: 'Alexsandra',
            [sortKey]: 'Haleloya'
        })
        expect(putResults).toBe(true)
        expect(getResult1).toMatchObject({
            "ttl": expect.any(Number),
            [partitionKeyName]: 'Alexsandra',
            [sortKey]: 'Haleloya',
            Gander: 'Female',
            Age: 30
        }) //the ttl has diffent value
        expect(getResult2).toBe(undefined)
    });

    it('rangeByPrefix - Put with the same prefix and Get "rangeByPrefix"', async () => {

        let data1 = {
            [partitionKeyName]: 'Gerege',
            [sortKey]: 'Haleloya',
            Gander: 'Male',
            Age: 30
        }

        let data2 = {
            [partitionKeyName]: 'Gerege Mosh',
            [sortKey]: 'Shalom',
            Gander: 'Male',
            Age: 30
        }

        let data3 = {
            [partitionKeyName]: 'Gerege',
            [sortKey]: 'Good Days',
            Gander: 'Male',
            Age: 30
        }


        // expect(factory.getDB()).toHaveBeenCalledTimes(1)
        await dbService.put(tableName, data1, 1000)
        await dbService.put(tableName, data2, 1000)
        await dbService.put(tableName, data3, 1000)

        sleep(5000)

        let getResult: Array<Object> = await dbService.rangeByPrefix(tableName, partitionKeyName, 'Gerege')

        console.log(getResult.length)
        expect(getResult.length).toEqual(3)

    });

    it('query by partitionKey - Put several record with same partitionKeyName and run a query to get all records with this value"', async () => {

        let data1 = {
            [partitionKeyName]: 'Avraham',
            [sortKey]: 'Haleloya1',
            Gander: 'Male',
            Age: 32
        }

        let data2 = {
            [partitionKeyName]: 'Avraham',
            [sortKey]: 'Haleloya2',
            Gander: 'Male',
            Age: 36
        }

        let data3 = { //same as data2 - verify write over data2
            [partitionKeyName]: 'Avraham',
            [sortKey]: 'Haleloya2',
            Gander: 'Male',
            Age: 30
        }

        let queryParms: DocumentClient.QueryInput = {
            TableName: tableName,
            KeyConditionExpression: `#partitionKeyName = :partitionKeyName`,
            // KeyConditionExpression: `#global = :value`,
            ExpressionAttributeValues: {
                ":partitionKeyName": 'Avraham', //SongTitle is
            },
            ExpressionAttributeNames: {
                "#partitionKeyName": partitionKeyName
            }
        }


        if (isUsingRealAWSTable){
            // expect(factory.getDB()).toHaveBeenCalledTimes(1)
            await dbService.put(tableName, data1, 1000)
            await dbService.put(tableName, data2, 1000)
            await dbService.put(tableName, data3, 1000)

            sleep(5000)

            let getResult: Array<Object> = await dbService.queryDb(queryParms)

            console.log(getResult.length)
            expect(getResult.length).toEqual(2)
        } else {
            //TC relevant just in case of real DynamoDb
        }


    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
});

// //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.html
describe('DbServiccreateTableGlobalSecondaryIndex - with partitionKey and sortKey as a primary keys and global index', () => {
    let dbService: DynamoDbService
    let app: INestApplication;
    let dynamoTables: DynamoTables
    let region: string = ConfigServiceMock.get('aws.region')
    let accessKeyId: string = ConfigServiceMock.get('dynamoDb.credentials.accessKeyId')
    let secretAccessKey: string = ConfigServiceMock.get('dynamoDb.credentials.secretAccessKey')

    let endpoint: string = ConfigServiceMock.get('dynamoDb.endpoint')

    let tableName: string = 'GameScores'
    let partitionKeyName: string = 'UserId'
    let sortKey: string = 'GameTitle'
    let globlIndexName: string = 'GameTitleIndex'
    let globaleSortKey: string = 'TopScore'

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
            await dynamoTables.createTableGlobalSecondaryIndexNumber(tableName, partitionKeyName, sortKey, globlIndexName, globaleSortKey)
        }
    })

    afterAll(async () => {
        try {
            if (isUsingRealAWSTable) {
                await dynamoTables.deleteTable(tableName)
            }
        } catch (e) {
            console.info(e)
        }
        await app.close()
    })

    beforeEach(async () => {
        const moduleRef: TestingModule = await Test.createTestingModule({
            providers: [DynamoDbService,
                {provide: ConfigurationService, useValue: ConfigServiceMock},
                {provide: MculoggerService, useValue: MculoggerServiceMock},
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        await app.init();

        dbService = await moduleRef.get<DynamoDbService>(DynamoDbService);

    });

    it('should be defined', () => {
        expect(dbService).toBeDefined();
    });

    it('Put and Get object from dynamodb - Get by partitionKeyName and sortKey', async () => {
        // expect(factory.getDB()).toHaveBeenCalledTimes(1)
        let data1 = {
            [partitionKeyName]: '102',
            [sortKey]: 'Allen Adventure',
            [globaleSortKey]: 192,
            TopScoredDateTime: new Date().toISOString(),
            Wins: 32,
            Losses: 192
        }

        let data2 = {
            [partitionKeyName]: '102',
            [sortKey]: 'Galaxy Invaders',
            [globaleSortKey]: 0,
            TopScoredDateTime: new Date().toISOString(),
            Wins: 0,
            Losses: 5
        }


        let putResults2 = await dbService.put(tableName, data2, 1000)
        let getResuts = await dbService.get(tableName, {
                [partitionKeyName]: '102',
                [sortKey]: 'Galaxy Invaders'
            }
        )
        expect(putResults2).toBe(true)
        expect(getResuts).toMatchObject({
            "ttl": expect.any(Number),
            [partitionKeyName]: '102',
            [sortKey]: 'Galaxy Invaders',
            [globaleSortKey]: 0,
            TopScoredDateTime: expect.any(String),
            Wins: 0,
            Losses: 5
        }) //the ttl has diffent value
        console.info(JSON.stringify(getResuts))
    });

    it('Put and query  from dynamodb - Get by Global Secondary Indexes', async () => {//speed up queries on non-key attributes
        // expect(factory.getDB()).toHaveBeenCalledTimes(1)
        let data1 = {
            [partitionKeyName]: '102',
            [sortKey]: 'Allen Adventure',
            [globaleSortKey]: 192,
            TopScoredDateTime: new Date().toISOString(),
            Wins: 32,
            Losses: 192
        }

        let data2 = {
            [partitionKeyName]: '102',
            [sortKey]: 'Galaxy Invaders',
            [globaleSortKey]: 0,
            TopScoredDateTime: new Date().toISOString(),
            Wins: 0,
            Losses: 5
        }

        let putResults1 = await dbService.put(tableName, data1, 1000)
        let putResults2 = await dbService.put(tableName, data2, 1000)
        expect(putResults1).toBe(true)
        expect(putResults2).toBe(true)

        if (isUsingRealAWSTable) { //Query check just with real aws table
            sleep(3000) //to update the table

            //https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Query.html
            let query: DocumentClient.QueryInput = {
                TableName: tableName,
                // KeyConditionExpression: `#global = :value and #sortkey = :sortKey`,
                KeyConditionExpression: `#global = :value`,
                ExpressionAttributeValues: {
                    ":value": 0
                    // ":sortKey": 'Galaxy Invaders'
                },
                ExpressionAttributeNames: {"#global": globaleSortKey
                    // , "#sortkey": sortKey
                },
                IndexName: globlIndexName
            }

            let result = await dbService.queryDb(query)
            console.info(result)

            expect(result[0]).toMatchObject({
                [partitionKeyName]: '102',
                [sortKey]: 'Galaxy Invaders',
                [globaleSortKey]: 0,
            }) //the ttl has diffent value
        }

    });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})
