"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoDbService = void 0;
const common_1 = require("@nestjs/common");
const AWS = __importStar(require("aws-sdk"));
const AWSMock = __importStar(require("aws-sdk-mock"));
const _ = __importStar(require("lodash"));
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const user_data_dto_1 = require("../../dto/user.data.dto");
const db_utils_1 = require("./utils/db.utils");
const constants_1 = require("../constants");
const dynamo_tables_1 = require("./dynamo.tables");
const REGION = 'us-east-1';
AWS.config.credentials = new AWS.EC2MetadataCredentials({
    httpOptions: { timeout: 5000 },
    maxRetries: 10
});
let DynamoDbService = class DynamoDbService {
    constructor(logger, configurationService) {
        this.logger = logger;
        this.configurationService = configurationService;
    }
    async onModuleInit() {
        this.useDynamoDbLocal = this.configurationService.get("dynamodb-local.enabled", false);
        if (this.useDynamoDbLocal) {
            this.dynamoDbRegion = this.configurationService.get("dynamodb-local.region", 'local');
            this.dynamoDbEndpoint = this.configurationService.get("dynamodb-local.endpoint", 'http://localhost:8000');
            this.dynamoDbAccessKeyId = this.configurationService.get("dynamodb-local.credentials.accessKeyId", 'test');
            this.dynamoDbSecretAccessKey = this.configurationService.get("dynamodb-local.credentials.secretAccessKey", 'test');
        }
        let isAWSMocked = this.configurationService.get("aws.mock.db", false);
        if (isAWSMocked) {
            this.logger.warn({ msg: "Using AWS Mock?", useAwsMock: isAWSMocked });
            let dbUtils = new db_utils_1.DbUtils();
            AWSMock.setSDKInstance(AWS);
            this["mockDB"] = new Map();
            let self = this;
            AWSMock.mock('DynamoDB.DocumentClient', 'put', async (input, callback) => {
                self.logger.info({ table: input.TableName, input: input["Item"]["data"] });
                switch (input.TableName) {
                    case constants_1.USERS_TABLE: {
                        let user = (input["Item"]["data"]);
                        if (input["Item"]["connectionId"] === "none") {
                            input["Item"]["connectionId"] = undefined;
                            input["Item"]["data"]["connectionId"] = undefined;
                        }
                        self["mockDB"].set(dbUtils.makeKey({
                            tlb: input.TableName,
                            userId: user.userId,
                            deviceId: user.deviceId
                        }), input["Item"]);
                        break;
                    }
                    case constants_1.SESSION_TABLE: {
                        self["mockDB"].set(dbUtils.makeKey({
                            tlb: input.TableName,
                            callId: input["Item"]["callId"]
                        }), input["Item"]);
                        break;
                    }
                    case constants_1.SIP_TABLE: {
                        self["mockDB"].set(dbUtils.makeKey({
                            tlb: input.TableName,
                            callId: input["Item"]["callId"],
                            type: input["Item"]["type"]
                        }), input["Item"]);
                        break;
                    }
                    case constants_1.ACTION_TABLE: {
                        self["mockDB"].set(dbUtils.makeKey({
                            tlb: input.TableName,
                            msgId: input["Item"]["msgId"],
                            seq: input["Item"]["seq"]
                        }), input["Item"]);
                        break;
                    }
                    default: {
                        self["mockDB"].set(input.TableName, input["Item"]);
                    }
                }
                callback(null, { ttl: 1000, data: input["Item"].data });
            });
            AWSMock.mock('DynamoDB.DocumentClient', 'query', async (input, callback) => {
                let result = new Array();
                switch (input.TableName) {
                    case constants_1.USERS_TABLE: {
                        for (let entry of self["mockDB"].entries()) {
                            let data = entry[1];
                            if (!entry[0].includes(constants_1.USERS_TABLE)) {
                                continue;
                            }
                            if (input.ExpressionAttributeNames.hasOwnProperty("#connectionId") &&
                                data.data.userId != undefined &&
                                data.data.connectionId == input.ExpressionAttributeValues[":connectionId"]) {
                                result.push(data);
                            }
                            else if (input.ExpressionAttributeNames.hasOwnProperty("#userId") &&
                                data.data.userId != undefined &&
                                data.data.userId == input.ExpressionAttributeValues[":userId"]) {
                                result.push(data);
                            }
                        }
                        break;
                    }
                }
                callback(null, { Items: result });
            });
            AWSMock.mock('DynamoDB.DocumentClient', 'get', async (input, callback) => {
                self.logger.info({ table: input.TableName, input: input.Key });
                let result = undefined;
                let key = _.merge({ tlb: input.TableName }, input.Key);
                switch (input.TableName) {
                    case constants_1.USERS_TABLE:
                        key = _.merge({ tlb: input.TableName }, input.Key);
                        result = self["mockDB"].get(dbUtils.makeKey(key));
                        break;
                    case constants_1.SESSION_TABLE:
                        result = self["mockDB"].get(dbUtils.makeKey({ tlb: input.TableName, callId: input.Key.callId }));
                        break;
                    case constants_1.ACTION_TABLE:
                    case constants_1.SIP_TABLE: {
                        key = _.merge({ tlb: input.TableName }, input.Key);
                        result = self["mockDB"].get(dbUtils.makeKey(key));
                        break;
                    }
                    default: {
                        result = self["mockDB"].get(input.TableName);
                    }
                }
                callback(null, { Item: result });
            });
            AWSMock.mock('DynamoDB.DocumentClient', 'delete', async (input, callback) => {
                let result = undefined;
                let key = _.merge({ tlb: input.TableName }, input.Key);
                switch (input.TableName) {
                    case constants_1.USERS_TABLE:
                        key = _.merge({ tlb: input.TableName }, input.Key);
                        result = self["mockDB"].delete(dbUtils.makeKey(key));
                        break;
                    case constants_1.SESSION_TABLE:
                        result = self["mockDB"].delete(dbUtils.makeKey({
                            tlb: input.TableName,
                            callId: input.Key.callId,
                            type: input["item"]["type"]
                        }));
                        break;
                    case constants_1.ACTION_TABLE:
                    case constants_1.SIP_TABLE: {
                        key = _.merge({ tlb: input.TableName }, input.Key);
                        result = self["mockDB"].delete(dbUtils.makeKey(key));
                        break;
                    }
                    default: {
                        result = self["mockDB"].delete(input.TableName);
                    }
                }
                callback(null, { Item: result });
            });
            AWSMock.mock('DynamoDB.DocumentClient', 'update', async (input, callback) => {
                self.logger.info({ method: 'update', input: input, table: input.TableName });
                let updateItemOutput = {};
                switch (input.TableName) {
                    case constants_1.USERS_TABLE: {
                        let key = dbUtils.makeKey({
                            tlb: input.TableName,
                            userId: input.Key.userId,
                            deviceId: input.Key.deviceId
                        });
                        let data = self["mockDB"].get(key);
                        let userDataDto;
                        if (data === undefined) {
                            userDataDto = new user_data_dto_1.UserDataDto();
                        }
                        else {
                            userDataDto = data.data;
                        }
                        if (input.ExpressionAttributeValues[":connectionId"] === "none") {
                            userDataDto.connectionId = "none";
                        }
                        else {
                            userDataDto.deviceId = input.Key.deviceId.toString();
                            userDataDto.userId = input.Key.userId.toString();
                            userDataDto.connectionId = input.ExpressionAttributeValues[":connectionId"].toString();
                            userDataDto.deviceType = input.ExpressionAttributeValues[":deviceType"];
                            userDataDto.protocolVersion = input.ExpressionAttributeValues[":protocolVersion"].toString();
                            userDataDto.PNSToken = input.ExpressionAttributeValues[":PNSToken"].toString();
                        }
                        ;
                        self["mockDB"].set(key, { connectionId: userDataDto.connectionId, deviceId: userDataDto.deviceId, userId: userDataDto.userId, data: userDataDto });
                        updateItemOutput = { connectionId: userDataDto.connectionId, data: userDataDto };
                        break;
                    }
                    default: {
                        break;
                    }
                }
                callback(null, updateItemOutput);
            });
        }
        this.dynamoClient = await this.setDynamoClient();
        this.logger.debug({ msg: 'DynamoDBService is up' });
    }
    getCredentials() {
        let credentials = {
            region: this.dynamoDbRegion,
            endpoint: this.dynamoDbEndpoint,
            credentials: {
                accessKeyId: this.dynamoDbAccessKeyId,
                secretAccessKey: this.dynamoDbSecretAccessKey
            }
        };
        return credentials;
    }
    async createWebRtcUsersTable() {
        this.logger.info({ desc: 'create webrtc_users table' });
        let tableName = constants_1.USERS_TABLE;
        let partitionKeyName = 'userId';
        let sortKey = 'deviceId';
        let globalIndexName = 'connectionId-index';
        let globalIndexKey = 'connectionId';
        let dynamoTable = new dynamo_tables_1.DynamoTables(tableName, this.getCredentials(), this.dynamoDbEndpoint);
        await dynamoTable.createTableGlobalSecondaryIndexString(tableName, partitionKeyName, sortKey, globalIndexName, globalIndexKey);
    }
    async createSessionTable() {
        this.logger.info({ desc: 'create session table' });
        let tableName = constants_1.SESSION_TABLE;
        let partitionKeyName = 'callId';
        let dynamoTable = new dynamo_tables_1.DynamoTables(tableName, this.getCredentials(), this.dynamoDbEndpoint);
        await dynamoTable.createTableWithPartKeyString(tableName, partitionKeyName);
    }
    async createSipTable() {
        this.logger.info({ desc: 'create sip table' });
        let tableName = constants_1.SIP_TABLE;
        let partitionKeyName = 'callId';
        let sortKeyName = 'type';
        let globalIndexName = 'sipIndex';
        let globalSortKey = 'isSetAck';
        let dynamoTable = new dynamo_tables_1.DynamoTables(tableName, this.getCredentials(), this.dynamoDbEndpoint);
        await dynamoTable.createSipTable(tableName, partitionKeyName, sortKeyName, globalSortKey, globalIndexName);
    }
    async deleteTable(dynamodb, name) {
        this.logger.info({ func: 'deleteTable', table: name });
        let params = {
            TableName: name
        };
        dynamodb.deleteTable(params, function (err, data) {
            if (err) {
                console.error("deleteTable, err:", JSON.stringify(err, null, 2));
            }
            else {
                console.log("deleteTable, table:", JSON.stringify(data, null, 2));
            }
        });
    }
    async createTables() {
        this.logger.info({ func: 'createTables' });
        AWS.config.update(this.getCredentials());
        let dynamodb = new AWS.DynamoDB({ endpoint: this.dynamoDbEndpoint });
        let tableArray = [];
        tableArray.push(constants_1.USERS_TABLE);
        tableArray.push(constants_1.SESSION_TABLE);
        tableArray.push(constants_1.SIP_TABLE);
        let _this = this;
        dynamodb.listTables({}, function (err, data) {
            if (err) {
                console.log(err, err.stack);
            }
            else {
                console.log({ func: 'createTables', tables: data });
                for (let i = 0; i < tableArray.length; i++) {
                    if (data.TableNames.lastIndexOf(tableArray[i]) != -1) {
                        console.log({ func: 'createTables', table: tableArray[i], desc: ' already exist' });
                    }
                    else {
                        switch (tableArray[i]) {
                            case constants_1.USERS_TABLE:
                                _this.createWebRtcUsersTable();
                                break;
                            case constants_1.SESSION_TABLE:
                                _this.createSessionTable();
                                break;
                            case constants_1.SIP_TABLE:
                                _this.createSipTable();
                                break;
                            default:
                                _this.logger.error({ func: 'createTables', table: tableArray[i], desc: 'not supported' });
                                break;
                        }
                    }
                }
            }
        });
    }
    async setDynamoClient() {
        try {
            if (this.useDynamoDbLocal) {
                await this.createTables();
            }
            let configuration = await this.getConfiguration();
            return new AWS.DynamoDB.DocumentClient(configuration);
        }
        catch (e) {
            this.logger.error({ error: e.message ? e.message : e });
        }
    }
    async getConfiguration() {
        try {
            if (this.useDynamoDbLocal) {
                this.logger.info({ func: 'getConfiguration', useDynamoDbLocal: this.useDynamoDbLocal });
                return {
                    region: this.dynamoDbRegion,
                    endpoint: this.dynamoDbEndpoint,
                    credentials: {
                        accessKeyId: this.dynamoDbAccessKeyId,
                        secretAccessKey: this.dynamoDbSecretAccessKey
                    }
                };
            }
            else {
                return {
                    region: await this.configurationService.get('aws.region', REGION),
                    endpoint: await this.configurationService.get('dynamoDb.endpoint', undefined),
                    apiVersion: "2012-08-10",
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
                };
            }
        }
        catch (e) {
            this.logger.error({ msg: `Failed to read credentials`, err: e.message ? e.message : e });
        }
    }
    async put(tableName, data, ttl) {
        try {
            let item = _.merge(data, { ttl: Math.round(Date.now() / 1000) + ttl });
            return await this.putItem(tableName, item);
        }
        catch (e) {
            this.logger.error({ error: e, tableName: tableName, data: data });
            return false;
        }
    }
    async update(params) {
        return await this.updateItem(params);
    }
    async get(tableName, key) {
        return await this.getItem(tableName, key);
    }
    async rangeByPrefix(tableName, primaryKeyName, keyPrefix) {
        return await this.scan(tableName, primaryKeyName, keyPrefix);
    }
    async remove(tableName, key) {
        return await this.deleteItem(tableName, key);
    }
    async queryDb(queryInput) {
        try {
            const data = await this.dynamoClient.query(queryInput).promise();
            this.logger.debug({ data: data.Items });
            return data.Items;
        }
        catch (e) {
            this.logger.error({ error: e.message ? e.message : e, queryInput: queryInput });
            return undefined;
        }
    }
    async putItem(tableName, item) {
        try {
            const data = await this.dynamoClient.put({
                TableName: tableName,
                Item: item,
                ReturnValues: "NONE"
            }).promise();
            this.logger.debug({ msg: `putItem`, data });
            return true;
        }
        catch (e) {
            this.logger.error({ error: e.message ? e.message : e, tableName: tableName, item: item });
            return false;
        }
    }
    async getItem(tableName, key) {
        try {
            const data = await this.dynamoClient.get({
                TableName: tableName,
                Key: key
            }).promise();
            return data ? data.Item : undefined;
        }
        catch (e) {
            this.logger.error({ error: e.message ? e.message : e, tableName: tableName, key: key });
            return undefined;
        }
    }
    async scan(tableName, primaryKeyName, keyPrefix) {
        try {
            const data = await this.dynamoClient.scan({
                TableName: tableName,
                ScanFilter: {
                    [primaryKeyName]: {
                        AttributeValueList: [keyPrefix],
                        ComparisonOperator: "BEGINS_WITH"
                    }
                }
            });
            this.logger.debug({ msg: `scanItem`, data });
            return data.Items;
        }
        catch (e) {
            this.logger.error({ error: e.message ? e.message : e, tableName: tableName });
            return undefined;
        }
    }
    async deleteItem(tableName, key) {
        try {
            const data = await this.dynamoClient.delete({
                TableName: tableName,
                Key: key,
                ReturnValues: "ALL_OLD"
            }).promise();
            this.logger.debug({ msg: `deleteItem`, data: data, tableName: tableName });
            return true;
        }
        catch (e) {
            this.logger.error({ erorr: e.message ? e.message : e, tableName: tableName, key: key });
            return false;
        }
    }
    async updateItem(params) {
        try {
            const data = await this.dynamoClient.update(params).promise();
            this.logger.debug({ msg: `updateItem`, data: data });
            return true;
        }
        catch (e) {
            this.logger.error({ erorr: e.message ? e.message : e, params: params });
            return false;
        }
    }
};
DynamoDbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService])
], DynamoDbService);
exports.DynamoDbService = DynamoDbService;
//# sourceMappingURL=dynamo.db.service.js.map