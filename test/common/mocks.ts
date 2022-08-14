import * as _ from "lodash"
import {DynamoDbService} from "../../src/common/db/dynamo.db.service";
import {ACTION_TABLE, SESSION_TABLE, SIP_TABLE, USERS_TABLE} from "../../src/common/constants";
import {ApiGwDto} from "../../src/dto/api.gw.dto";

let objectMap: Map<string, Object> = new Map<string, Object>()

export const DynamoClientMock = {
    putItem: jest.fn().mockImplementation(async (tableName, item): Promise<any> => {
        let data: Object = (undefined !== item.Item) ? item.Item : item
        let key: string = getKey(item, tableName)
        objectMap.set(key, data)
        return true
    }),
    updateItem: jest.fn().mockImplementation(async (params): Promise<any> => {
        let key = JSON.stringify(params.Key)
        let value = objectMap.get(key)
        let attribute = params.ExpressionAttributeNames['#ri']
        let attValue = params.ExpressionAttributeValues[':g']
        value[attribute] = attValue
        objectMap.set(key, value)
        return true
    }),
    getItem: jest.fn().mockImplementation(async (tableName, key): Promise<any> => {
        return await objectMap.get(JSON.stringify(key))
    }),
    deleteItem: jest.fn().mockImplementation((tableName, key: Object) => {
        objectMap.delete(JSON.stringify(key))
    }),
    scan: jest.fn().mockImplementation((tableName, primeryKeyName, keyPrefix) => {
            let localArray = new Array<Object>()
            objectMap.forEach((value: Object, key: string) => {
                if (key.includes(keyPrefix)) {
                    localArray.push(value)
                }
            })
            return localArray
        }
    )
}

export const DynamoDBServiceMock = {

    put: jest.fn().mockImplementation(async (tableName: string, data: Object, ttl: number): Promise<boolean> => {
        let item = _.merge(data, {ttl: ttl})
        // let data: Object = (undefined !== item.Item) ? item.Item : item
        let key: string = getKey(item, tableName)
        objectMap.set(key, item)
        return true
    }),
    update: jest.fn().mockImplementation(async (params): Promise<boolean> => {

        let key = JSON.stringify(params.Key)
        let value = objectMap.get(key)

        if (params.TableName == SIP_TABLE) {
            let data: string = params.ExpressionAttributeNames['#data']
            let seqNum: string = params.ExpressionAttributeNames['#seqNumber']
            let attValue = params.ExpressionAttributeValues[':g']
            value[data][seqNum] = attValue
        } else if (params.TableName == USERS_TABLE) {
            let data: string = params.ExpressionAttributeNames['#data']
            let psn: string = params.ExpressionAttributeNames['#PNSToken']
            let connectionId: string = params.ExpressionAttributeNames['#connectionId']
            let accessToken: string = params.ExpressionAttributeNames['#accessToken']
            value[data][accessToken] = params.ExpressionAttributeValues[':accessToken']
            value[data][psn] = params.ExpressionAttributeValues[':PNSToken']
            value[data][connectionId] = params.ExpressionAttributeValues[':connectionId']
        } else {
            console.error('unknown table name - fix the test')
            return false
        }
        objectMap.set(key, value)
        return true
    }),
    get: jest.fn().mockImplementation(async (tableName, key): Promise<any> => {
        return await objectMap.get(JSON.stringify(key))
    }),
    remove: jest.fn().mockImplementation(async (tableName, key: Object): Promise<boolean> => {
        await objectMap.delete(JSON.stringify(key))
        return true
    })
}

const getKey = (value, tableName: string): string => {
    let data: Object = (undefined !== value.Item) ? value.Item : value
    let key: Object
    if ( tableName == SESSION_TABLE) {
        let element = Object.keys(data)[0]
        key = {
            [element]: data[element]
        }
    } else {
        let element1 = Object.keys(data)[0]
        let element2 = Object.keys(data)[1]
        key = {
            [element1]: data[element1],
            [element2]: data[element2]
        }
    }

    return JSON.stringify(key)
}

export const ConfigServiceMock = {
    get: jest.fn().mockImplementation((key: string, defaultval: string) => {
        switch (key) {
            //dev endpoint:
            // aws --endpoint http://10.106.9.63:31566 dynamodb list-tables
            case 'dynamoDb.credentials.accessKeyId':
                return "test";
            case 'dynamoDb.credentials.secretAccessKey':
                return "test";
            case 'aws.region':
                return "us-east-1"
            case 'dynamoDb.tableName':
                return "testTable";
            case 'dynamoDb.sipTable.userSession.type':
                return 'userSession'
            case 'dynamoDb.sipTable.userSession.ttl':
                return 86400
            case 'dynamoDb.sipTable.setSipRequest.type':
                return 'setSipRequest'
            case 'dynamoDb.sipTable.setSipRequest.ttl':
                return 35
            case 'dynamoDb.sipTable.setAck.type':
                return 'setAck'
            case 'dynamoDb.sipTable.setAck.ttl':
                return 35
            case 'dynamoDb.sipTable.tableName':
                return SIP_TABLE
            case 'dynamoDb.endpoint':
                return 'http://10.106.9.63:31566'
            case 'dynamoDb.actionTable.tableName':
                return ACTION_TABLE
            case 'dynamoDb.actionTable.ttl':
                return 86400
            case 'dynamoDb.sessionTable.tableName':
                return SESSION_TABLE
            case 'dynamoDb.sessionTable.ttl':
                return 1800
            case 'dynamoDb.usersTable.tableName': //users table
                return USERS_TABLE
            case 'dynamoDb.usersTable.ttl':
                return 86400
            case 'sendWsMessage.retries':
                return 3
            case 'sendWsMessage.minTimeout':
                return 2000
            default:
                return defaultval;
        }
    })
};

export const MculoggerServiceMock = {
    info: jest.fn().mockImplementation((...args) => {
        console.info(args);
    }),
    debug: jest.fn().mockImplementation((...args) => {
        console.debug(args);
    }),
    error: jest.fn().mockImplementation((...args) => {
        console.error(args);
    }),
    verbose: jest.fn().mockImplementation((...args) => {
    })
};
