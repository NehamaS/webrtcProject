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
exports.DbService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const constants_1 = require("../constants");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const dynamo_db_service_1 = require("./dynamo.db.service");
const _ = __importStar(require("lodash"));
let DbService = class DbService {
    constructor(logger, configurationService, dynamoDBService) {
        this.logger = logger;
        this.configurationService = configurationService;
        this.dynamoDBService = dynamoDBService;
    }
    async onApplicationBootstrap() {
        try {
            this.actionTableName = await this.configurationService.get('dynamoDb.actionTable.tableName', constants_1.ACTION_TABLE);
            this.actionTableTtl = await this.configurationService.get('dynamoDb.actionTable.ttl', 7200);
            this.sessionTableName = await this.configurationService.get('dynamoDb.sessionTable.tableName', constants_1.SESSION_TABLE);
            this.sessionTableTtl = await this.configurationService.get('dynamoDb.sessionTable.ttl', 7200);
            this.usersTableName = await this.configurationService.get('dynamoDb.usersTable.tableName', constants_1.USERS_TABLE);
            this.usersTableTtl = await this.configurationService.get('dynamoDb.usersTable.ttl', 86400);
        }
        catch (e) {
            this.logger.error({ msg: `${e.message}` });
        }
    }
    async setAction(callId, seq, action) {
        this.logger.debug({ func: 'setAction', msgId: callId, seq: seq, action: action });
        let key = { msgId: callId, seq: seq };
        let item = { data: action };
        let data = _.merge(key, item);
        return await this.dynamoDBService.put(this.actionTableName, data, this.userTableTtl);
    }
    async getAction(msgId, seq) {
        let key = { msgId: msgId, seq: seq };
        let item = await this.dynamoDBService.get(this.actionTableName, key);
        if (undefined === item) {
            this.logger.error({ msg: `Failed to get data`, key: key });
            return undefined;
        }
        switch (item.data) {
            case constants_1.START_ACTION:
                return constants_1.ANSWER_ACTION;
            case constants_1.HOLD_ACTION:
                return constants_1.HOLD_ACTION_ACK;
            case constants_1.RESUME_ACTION:
                return constants_1.RESUME_ACTION_ACK;
            case constants_1.MODIFY_ACTION:
                return constants_1.MODIFY_ACTION_ACK;
            default:
                return constants_1.UNDEFINED_ACTION;
        }
    }
    async delAction(msgId, seq) {
        let key = { msgId: msgId, seq: seq };
        return await this.dynamoDBService.remove(this.actionTableName, key);
    }
    async setSessionData(sessionData) {
        this.logger.debug({ func: 'setSessionData', sessionData: sessionData });
        let key = { callId: sessionData.callId };
        let item = { data: sessionData };
        let data = _.merge(key, item);
        return await this.dynamoDBService.put(this.sessionTableName, data, this.sessionTableTtl);
    }
    async getSessionData(callId) {
        let key = { callId: callId };
        let item = await this.dynamoDBService.get(this.sessionTableName, key);
        if (undefined === item) {
            this.logger.error({ msg: `getSessionData failed to get data`, key: key });
            return undefined;
        }
        return item.data;
    }
    async delSessionData(callId) {
        let key = { callId: callId };
        return await this.dynamoDBService.remove(this.sessionTableName, key);
    }
    async setUser(userData) {
        this.logger.info({ func: 'setUser', userData: userData });
        try {
            let key = { userId: this.extractUser(userData.userId), deviceId: userData.deviceId };
            let item = { data: userData };
            let data = _.merge(key, { connectionId: userData.connectionId }, item);
            this.logger.info({ action: 'setUser in webrtc_user', data: data });
            return await this.dynamoDBService.put(this.usersTableName, data, this.usersTableTtl);
        }
        catch (e) {
            this.logger.error({ error: e.message ? e.message : e, userData: userData });
            return false;
        }
    }
    async updateUsersData(userData) {
        try {
            let key = { userId: this.extractUser(userData.userId), deviceId: userData.deviceId };
            let updateParameters = this.genUsersDataQuery(key, userData);
            this.logger.debug({ action: 'updateUsersData', updateParameters: updateParameters });
            return await this.dynamoDBService.update(updateParameters);
        }
        catch (e) {
            this.logger.error({ error: e.message });
            return false;
        }
    }
    async getByConnectionId(connectionId) {
        let query = {
            TableName: this.usersTableName,
            ExpressionAttributeNames: {
                "#connectionId": "connectionId",
            },
            ExpressionAttributeValues: {
                ":connectionId": connectionId
            },
            KeyConditionExpression: "#connectionId = :connectionId",
            IndexName: 'connectionId-index'
        };
        let result = await this.dynamoDBService.queryDb(query);
        this.logger.info({ action: "getByConnectionId", query: query, result: result });
        if (result == undefined) {
            return undefined;
        }
        return result.length > 0 ? result[0].data : undefined;
    }
    async getByUserId(userId) {
        let query = {
            TableName: this.usersTableName,
            ExpressionAttributeNames: {
                "#userId": "userId",
            },
            ExpressionAttributeValues: {
                ":userId": this.extractUser(userId)
            },
            KeyConditionExpression: "#userId = :userId",
        };
        let result = await this.dynamoDBService.queryDb(query);
        let data = new Array();
        if (result != undefined) {
            result.forEach(element => {
                data.push(element.data);
            });
        }
        return data;
    }
    async getUserData(userId, deviceId) {
        try {
            if (!userId || !deviceId) {
                this.logger.error({ action: 'getUserData', msg: `Failed to get data deviceId or userId undefined`, });
                return undefined;
            }
            this.logger.debug({ action: "getUserData", userId: userId, deviceId: deviceId });
            let key = {
                userId: this.extractUser(userId),
                deviceId: deviceId
            };
            let item = await this.dynamoDBService.get(this.usersTableName, key);
            if (undefined === item) {
                this.logger.error({ msg: `Failed to get data`, key: key });
                return undefined;
            }
            return item.data;
        }
        catch (e) {
            this.logger.error({ action: "getUserData", userId: userId, deviceId: deviceId, error: e });
            return undefined;
        }
    }
    async delUsersData(userId, deviceId) {
        let key = { userId: this.extractUser(userId), deviceId: deviceId };
        return await this.dynamoDBService.remove(this.usersTableName, key);
    }
    genUsersDataQuery(key, userData) {
        let exp = {
            TableName: this.usersTableName,
            Key: key,
            ReturnValues: "ALL_NEW",
            UpdateExpression: 'set',
            ExpressionAttributeNames: { "#data": "data" },
            ExpressionAttributeValues: {}
        };
        Object.entries(userData).forEach(([key, item]) => {
            if (item) {
                exp.UpdateExpression += `  #data.#${key} = :${key},`;
                exp.ExpressionAttributeNames[`#${key}`] = key;
                exp.ExpressionAttributeValues[`:${key}`] = item;
                if (key === 'connectionId') {
                    exp.UpdateExpression += `  #${key} = :${key},`;
                }
            }
        });
        exp.UpdateExpression = exp.UpdateExpression.slice(0, -1);
        this.logger.debug({ action: 'genUsersDataQuery', returnQuery: exp });
        return exp;
    }
    extractUser(user) {
        if (!user && (user.indexOf('sip:') !== -1 || user.indexOf('tel:') !== -1)) {
            return user.substring(4);
        }
        return user;
    }
};
DbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService,
        dynamo_db_service_1.DynamoDbService])
], DbService);
exports.DbService = DbService;
//# sourceMappingURL=db.service.js.map