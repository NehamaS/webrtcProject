import {Injectable, OnModuleInit} from '@nestjs/common';
import * as AWS from "aws-sdk"
import * as AWSMock from "aws-sdk-mock";
import * as _ from "lodash"
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {
    ClientConfiguration,
    DocumentClient,
    GetItemInput,
    GetItemOutput,
    PutItemOutput,
    QueryInput,
    UpdateItemInput,
    UpdateItemOutput,
} from "aws-sdk/clients/dynamodb";
import {UserDataDto} from "../../dto/user.data.dto";
import {DbUtils} from "./utils/db.utils";
import {ACTION_TABLE, SESSION_TABLE, SIP_TABLE, USERS_TABLE} from "../constants";
import {DynamoTables} from "./dynamo.tables";

const REGION: string = 'us-east-1'


AWS.config.credentials = new AWS.EC2MetadataCredentials({
    httpOptions: {timeout: 5000},
    maxRetries: 10
})

//https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#update-property
@Injectable()
export class DynamoDbService implements OnModuleInit {
    private dynamoClient: AWS.DynamoDB.DocumentClient

    private useDynamoDbLocal: boolean
    private dynamoDbRegion: string
    private dynamoDbEndpoint: string
    private dynamoDbAccessKeyId: string
    private dynamoDbSecretAccessKey: string

    constructor(private readonly logger: MculoggerService,
                private readonly configurationService: ConfigurationService
    ) {
    }

    async onModuleInit() {
        this.useDynamoDbLocal = this.configurationService.get("dynamodb-local.enabled", false);
        if (this.useDynamoDbLocal) {
            this.dynamoDbRegion = this.configurationService.get("dynamodb-local.region", 'local');
            this.dynamoDbEndpoint = this.configurationService.get("dynamodb-local.endpoint", 'http://localhost:8000');
            this.dynamoDbAccessKeyId = this.configurationService.get("dynamodb-local.credentials.accessKeyId", 'test');
            this.dynamoDbSecretAccessKey = this.configurationService.get("dynamodb-local.credentials.secretAccessKey", 'test');
        }

        let isAWSMocked: boolean = this.configurationService.get("aws.mock.db", false);
        if (isAWSMocked) {
            this.logger.warn({msg: "Using AWS Mock?", useAwsMock: isAWSMocked});
            let dbUtils = new DbUtils();
            AWSMock.setSDKInstance(AWS);
            this["mockDB"] = new Map<Object, Object>();

            let self = this;

            AWSMock.mock('DynamoDB.DocumentClient', 'put', async (input: GetItemInput, callback: Function) => {
                self.logger.info({table: input.TableName, input: input["Item"]["data"]});
                switch (input.TableName) {
                    case USERS_TABLE: {
                        let user: UserDataDto = <UserDataDto>(input["Item"]["data"]);

                        if ( input["Item"]["connectionId"] === "none"){
                            //empty the connection id
                            input["Item"]["connectionId"] = undefined;
                            input["Item"]["data"]["connectionId"] = undefined;
                        }

                        self["mockDB"].set(dbUtils.makeKey({
                                tlb: input.TableName,
                                userId: user.userId,
                                deviceId: user.deviceId
                            }),
                            input["Item"]);
                        break;
                    }
                    case SESSION_TABLE: {
                        self["mockDB"].set(dbUtils.makeKey({
                            tlb: input.TableName,
                            callId: input["Item"]["callId"]
                        }), input["Item"]);
                        break;
                    }
                    case SIP_TABLE: {
                        self["mockDB"].set(dbUtils.makeKey({
                            tlb: input.TableName,
                            callId: input["Item"]["callId"],
                            type: input["Item"]["type"]
                        }), input["Item"]);
                        break;
                    }
                    case ACTION_TABLE: {
                        self["mockDB"].set(dbUtils.makeKey({
                            tlb: input.TableName,
                            msgId: input["Item"]["msgId"],
                            seq: input["Item"]["seq"]
                        }), input["Item"])
                        break;
                    }
                    default: {
                        self["mockDB"].set(input.TableName, input["Item"]);
                    }
                }
                callback(null, <PutItemOutput>{ttl: 1000, data: input["Item"].data});
            });

            AWSMock.mock('DynamoDB.DocumentClient', 'query', async (input: QueryInput, callback: Function) => {
                let result: Array<any> = new Array<any>();
                switch (input.TableName) {
                    case USERS_TABLE: {
                        for (let entry of self["mockDB"].entries()) {
                            let data: {data: UserDataDto} = entry[1];
                            if (!entry[0].includes(USERS_TABLE)) {
                                /*filter by table name*/
                                continue;
                            }

                            if (input.ExpressionAttributeNames.hasOwnProperty("#connectionId") && //Query by connection id
                                data.data.userId != undefined &&
                                data.data.connectionId == input.ExpressionAttributeValues[":connectionId"]) {
                                result.push(data);
                            } else if (input.ExpressionAttributeNames.hasOwnProperty("#userId") && //Query by user id

                                data.data.userId != undefined &&
                                data.data.userId == input.ExpressionAttributeValues[":userId"]) {
                                result.push(data);
                            }
                        }
                        break;
                    }
                }
                callback(null, {Items: result});
            });

            AWSMock.mock('DynamoDB.DocumentClient', 'get', async (input: GetItemInput, callback: Function) => {
                self.logger.info({table: input.TableName, input: input.Key});
                let result: any | undefined = undefined;
                let key = _.merge({tlb: input.TableName}, input.Key);
                switch (input.TableName) {
                    case USERS_TABLE:
                        key = _.merge({tlb: input.TableName}, input.Key);
                        result = self["mockDB"].get(dbUtils.makeKey(key))
                        break;
                    case SESSION_TABLE:
                        result = self["mockDB"].get(dbUtils.makeKey({tlb: input.TableName, callId: input.Key.callId}));
                        break
                    case ACTION_TABLE:
                    case SIP_TABLE: {
                        key = _.merge({tlb: input.TableName}, input.Key);
                        result = self["mockDB"].get(dbUtils.makeKey(key));
                        break;
                    }
                    default: {
                        result = self["mockDB"].get(input.TableName);
                    }
                }
               callback(null, <GetItemOutput>{Item: result});
            });

            AWSMock.mock('DynamoDB.DocumentClient', 'delete', async (input: GetItemInput, callback: Function) => {
                let result: any | undefined = undefined;
                let key = _.merge({tlb: input.TableName}, input.Key);
                switch (input.TableName) {
                    case USERS_TABLE:
                        key = _.merge({tlb: input.TableName}, input.Key);
                        result = self["mockDB"].delete(dbUtils.makeKey(key));
                        break;
                    case SESSION_TABLE:
                        result = self["mockDB"].delete(dbUtils.makeKey({
                            tlb: input.TableName,
                            callId: input.Key.callId,
                            type: input["item"]["type"]
                        }));
                        break
                    case ACTION_TABLE:
                    case SIP_TABLE: {
                        key = _.merge({tlb: input.TableName}, input.Key);
                        result = self["mockDB"].delete(dbUtils.makeKey(key));
                        break;
                    }
                    default: {
                        result = self["mockDB"].delete(input.TableName);
                    }
                }
                callback(null, <GetItemOutput>{Item: result});
            });

            AWSMock.mock('DynamoDB.DocumentClient', 'update', async (input: UpdateItemInput, callback: Function) => {
                self.logger.info({method: 'update', input: input, table: input.TableName});
                let updateItemOutput :UpdateItemOutput = {}
                switch (input.TableName) {
                    case USERS_TABLE: {

                        let key: string = dbUtils.makeKey({
                            tlb: input.TableName,
                            userId: input.Key.userId,
                            deviceId: input.Key.deviceId
                        })

                        let data  = self["mockDB"].get(key)
                        let userDataDto: UserDataDto
                        if (data === undefined){
                            userDataDto = new UserDataDto()
                        } else {
                            userDataDto = data.data
                        }

                        if (input.ExpressionAttributeValues[":connectionId"] === "none"){
                            userDataDto.connectionId = "none";
                        } else {
                            userDataDto.deviceId =input.Key.deviceId.toString()
                            userDataDto.userId = input.Key.userId.toString()
                            userDataDto.connectionId =input.ExpressionAttributeValues[":connectionId"].toString()
                            userDataDto.deviceType = <"ANDROID"|"IOS"|"WEB_BROWSER"|"WEB_DESKTOP">input.ExpressionAttributeValues[":deviceType"]
                            userDataDto.protocolVersion = input.ExpressionAttributeValues[":protocolVersion"].toString()
                            userDataDto.PNSToken = input.ExpressionAttributeValues[":PNSToken"].toString()
                            // userDataDto.appSid = input.ExpressionAttributeValues[":appSid"].toString()
                        };

                        self["mockDB"].set(key, {connectionId: userDataDto.connectionId, deviceId: userDataDto.deviceId, userId: userDataDto.userId, data: userDataDto});
                        updateItemOutput = <UpdateItemOutput>{connectionId: userDataDto.connectionId, data: userDataDto}
                         break;
                    }
                    default: {
                        break;
                    }
                }
                callback(null, updateItemOutput)
            });
        }

        this.dynamoClient = await this.setDynamoClient()
        this.logger.debug({msg: 'DynamoDBService is up'})
    }

    // Create tables in Local Dynamo DB
    private getCredentials() {
        let credentials = {
            region: this.dynamoDbRegion,
            endpoint: this.dynamoDbEndpoint,
            credentials: {
                accessKeyId: this.dynamoDbAccessKeyId,
                secretAccessKey: this.dynamoDbSecretAccessKey
            }
        }

        return credentials;
    }

    private async createWebRtcUsersTable() {
        this.logger.info({desc: 'create webrtc_users table'})

        let tableName: string = USERS_TABLE;
        let partitionKeyName: string = 'userId';
        let sortKey : string = 'deviceId';
        let globalIndexName: string = 'connectionId-index';
        let globalIndexKey: string = 'connectionId';

        let dynamoTable: DynamoTables = new DynamoTables(tableName, this.getCredentials(), this.dynamoDbEndpoint);
        await dynamoTable.createTableGlobalSecondaryIndexString(tableName, partitionKeyName, sortKey,globalIndexName, globalIndexKey);
    }

    private async createSessionTable() {
        this.logger.info({desc: 'create session table'})

        let tableName: string = SESSION_TABLE;
        let partitionKeyName: string = 'callId';

        let dynamoTable: DynamoTables = new DynamoTables(tableName, this.getCredentials(), this.dynamoDbEndpoint);
        await dynamoTable.createTableWithPartKeyString(tableName, partitionKeyName);
    }

    private async createSipTable() {
        this.logger.info({desc: 'create sip table'})

        let tableName: string = SIP_TABLE;
        let partitionKeyName: string = 'callId';
        let sortKeyName: string = 'type'
        let globalIndexName: string = 'sipIndex'
        let globalSortKey: string = 'isSetAck'

        let dynamoTable: DynamoTables = new DynamoTables(tableName, this.getCredentials(), this.dynamoDbEndpoint);
        await dynamoTable.createSipTable(tableName, partitionKeyName, sortKeyName, globalSortKey, globalIndexName);
    }

    private async deleteTable(dynamodb, name: string) {
        this.logger.info({func: 'deleteTable', table: name});

        let params = {
            TableName: name
        }

        dynamodb.deleteTable(params, function (err, data) {
            if (err) {
                console.error("deleteTable, err:", JSON.stringify(err, null, 2));
            } else {
                console.log("deleteTable, table:", JSON.stringify(data, null, 2));
            }
        });
    }

    private async createTables() {
        this.logger.info({func: 'createTables'});

        AWS.config.update(this.getCredentials());
        let dynamodb = new AWS.DynamoDB({endpoint: this.dynamoDbEndpoint});

        let tableArray: string[] = [];

        tableArray.push(USERS_TABLE);
        tableArray.push(SESSION_TABLE);
        tableArray.push(SIP_TABLE);

        let _this = this;
        dynamodb.listTables({}, function(err, data) {
            if (err) {
                console.log(err, err.stack);
            } else {
                console.log({func: 'createTables', tables: data});

                for (let i = 0; i < tableArray.length; i++) {
                    if (data.TableNames.lastIndexOf(tableArray[i]) != -1) {
                        console.log({func: 'createTables', table: tableArray[i], desc: ' already exist'});

                        // for test only
                        //if (tableArray[i] == USERS_TABLE) {
                            //_this.deleteTable(dynamodb, tableArray[i]);
                        //}
                    }
                    else {
                        switch(tableArray[i]) {
                            case USERS_TABLE:
                                _this.createWebRtcUsersTable();
                                break;
                            case SESSION_TABLE:
                                _this.createSessionTable();
                                break;
                            case SIP_TABLE:
                                _this.createSipTable();
                                break;
                            default:
                                _this.logger.error({func: 'createTables', table: tableArray[i], desc: 'not supported'});
                                break;
                        }
                    }
                }
            }
        });
    }

    private async setDynamoClient(): Promise<AWS.DynamoDB.DocumentClient> {
        try {
            if (this.useDynamoDbLocal) {
                await this.createTables();
            }

            let configuration: ClientConfiguration = await this.getConfiguration()
            return new AWS.DynamoDB.DocumentClient(
                configuration
            );
        } catch (e) {
            this.logger.error({error: e.message ? e.message : e})
        }
    }

    private async getConfiguration(): Promise<ClientConfiguration> {
        try {
            if (this.useDynamoDbLocal) {
                this.logger.info({func: 'getConfiguration', useDynamoDbLocal: this.useDynamoDbLocal})

                return <ClientConfiguration>{
                    region: this.dynamoDbRegion,
                    endpoint: this.dynamoDbEndpoint,
                    credentials: {
                        accessKeyId: this.dynamoDbAccessKeyId,
                        secretAccessKey: this.dynamoDbSecretAccessKey
                    }
                }
            }
            else {
                return <ClientConfiguration>{
                    region: await this.configurationService.get('aws.region', REGION),
                    endpoint: await this.configurationService.get('dynamoDb.endpoint', undefined),
                    apiVersion: "2012-08-10",
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                }
            }
        } catch (e) {
            this.logger.error({msg: `Failed to read credentials`, err: e.message ? e.message : e})
        }
    }

    async put(tableName: string, data: Object, ttl: number): Promise<boolean> {
        try {
            let item = _.merge(data, {ttl: Math.round(Date.now() / 1000) + ttl}) //TTL attribute’s must be a timestamp in Unix epoch time format in seconds
            return await this.putItem(tableName, item)

        } catch (e) {
            this.logger.error({error: e, tableName: tableName, data: data})
            return false
        }
    }

    async update(params: DocumentClient.UpdateItemInput): Promise<boolean> {
        return await this.updateItem(params)
    }

    public async get<T>(tableName: string, key: Object): Promise<T> {
        return await this.getItem(tableName, key)
    }

    //https://dynobase.dev/dynamodb-scan-vs-query/
    async rangeByPrefix<T>(tableName: string, primaryKeyName: string, keyPrefix: string): Promise<Array<T>> {
        return await this.scan(tableName, primaryKeyName, keyPrefix)
    }

    async remove(tableName: string, key: Object): Promise<boolean> {
        return await this.deleteItem(tableName, key)
    }

    //https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Query.html#DDB-Query-request-ExpressionAttributeNames
    //https://dynobase.dev/dynamodb-scan-vs-query/
    async queryDb<T>(queryInput: DocumentClient.QueryInput): Promise<Array<T>> {
        try {
            const data = await this.dynamoClient.query(queryInput).promise();
            this.logger.debug({data: data.Items})
            return <Array<T>>data.Items;
        } catch (e) {
            this.logger.error({error: e.message ? e.message : e, queryInput: queryInput});
            return undefined;
        }
    }

    private async putItem(tableName: string, item: Object): Promise<boolean> {
        try {
            const data = await this.dynamoClient.put({
                TableName: tableName,
                Item: item,
                ReturnValues: "NONE"
            }).promise();
            this.logger.debug({msg: `putItem`, data});
            return true;
        } catch (e) {
            this.logger.error({error: e.message ? e.message : e, tableName: tableName, item: item});
            return false;
        }
    }

    private async getItem<T>(tableName: string, key: Object): Promise<any> {
        try {
            const data: AWS.DynamoDB.GetItemOutput = await this.dynamoClient.get({
                TableName: tableName,
                Key: key
            }).promise();
            return data ? data.Item : undefined;
        } catch (e) {
            this.logger.error({error: e.message ? e.message : e, tableName: tableName, key: key});
            return undefined;
        }
    }

    private async scan<T>(tableName: string, primaryKeyName: string, keyPrefix: string): Promise<Array<T>> {
        try {
            const data: any = await this.dynamoClient.scan({
                TableName: tableName,
                ScanFilter: {
                    [primaryKeyName]: {
                        AttributeValueList: [keyPrefix],
                        ComparisonOperator: "BEGINS_WITH"
                    }
                }
            });
            this.logger.debug({msg: `scanItem`, data})
            return data.Items

        } catch (e) {
            this.logger.error({error: e.message ? e.message : e, tableName: tableName})
            return undefined
        }

    }

    private async deleteItem(tableName: string, key: Object): Promise<boolean> {
        try {
            const data = await this.dynamoClient.delete({
                TableName: tableName,
                Key: key,
                ReturnValues: "ALL_OLD"
            }).promise();
            this.logger.debug({msg: `deleteItem`, data: data, tableName: tableName})
            return true;
        } catch (e) {
            this.logger.error({erorr: e.message ? e.message : e, tableName: tableName, key: key})
            return false

        }
    }

    private async updateItem(params: DocumentClient.UpdateItemInput): Promise<boolean> {
        try {
            const data = await this.dynamoClient.update(params).promise();
            this.logger.debug({msg: `updateItem`, data: data});
            return true;
        } catch (e) {
            this.logger.error({erorr: e.message ? e.message : e, params: params});
            return false;

        }
    }
}
