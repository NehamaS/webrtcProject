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
exports.RestcommDbService = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const configuration_service_1 = require("service-infrastructure/common/config/configuration.service");
const dynamo_db_service_1 = require("./dynamo.db.service");
const _ = __importStar(require("lodash"));
const constants_1 = require("../constants");
let RestcommDbService = class RestcommDbService {
    constructor(logger, configurationService, dynamoDBService) {
        this.logger = logger;
        this.configurationService = configurationService;
        this.dynamoDBService = dynamoDBService;
        this.logger.debug("RestComDbService, started");
    }
    async onApplicationBootstrap() {
        try {
            this.sipTableName = await this.configurationService.get('dynamoDb.sipTable.tableName', constants_1.SIP_TABLE);
            this.userSessionType = await this.configurationService.get('dynamoDb.sipTable.userSession.type', 'userSession');
            this.userSessionTtl = await this.configurationService.get('dynamoDb.sipTable.userSession.ttl', 86400);
            this.setSipRequestType = await this.configurationService.get('dynamoDb.sipTable.setSipRequest.type', 'setSipRequest');
            this.setSipRequestTtl = await this.configurationService.get('dynamoDb.sipTable.setSipRequest.ttl', 35);
            this.setAckType = await this.configurationService.get('dynamoDb.sipTable.setAck.type', 'setAck');
            this.setAckTtl = await this.configurationService.get('dynamoDb.sipTable.setAck.ttl', 35);
        }
        catch (e) {
            this.logger.error({ msg: `${e.message}` });
        }
    }
    async setUserSession(session) {
        let key = { type: this.userSessionType, callId: session.callId };
        let item = { data: session };
        let data = _.merge(key, item);
        return await this.dynamoDBService.put(this.sipTableName, data, this.userSessionTtl);
    }
    async getUserSession(callId) {
        let key = { type: this.userSessionType, callId: callId };
        try {
            let result = await this.dynamoDBService.get(this.sipTableName, key);
            if (undefined === result) {
                this.logger.error({ msg: `getUserSession failed to get data`, key: key });
                return undefined;
            }
            return result.data;
        }
        catch (e) {
            this.logger.error({ msg: `failed to get data`, key: key, error: e.message });
            return undefined;
        }
    }
    async deleteUserSession(callId) {
        let key = { type: this.userSessionType, callId: callId };
        return await this.dynamoDBService.remove(this.sipTableName, key);
    }
    async updateUserSession(callId, seqNumber) {
        let key = { type: this.userSessionType, callId: callId };
        let updateAttribute = {
            TableName: this.sipTableName,
            Key: key,
            UpdateExpression: "SET #data.#seqNumber = :g",
            ExpressionAttributeNames: { "#data": "data", "#seqNumber": "seqNumber" },
            ExpressionAttributeValues: { ":g": seqNumber },
            ReturnValues: "ALL_NEW"
        };
        return await this.dynamoDBService.update(updateAttribute);
    }
    async updateParamsUserSession(keyValue, sipSession) {
        try {
            let key = { type: this.userSessionType, callId: keyValue };
            let updateParameters = this.genDataQuery(key, sipSession);
            this.logger.debug({ action: 'updateAllUserSession', updateParameters: updateParameters });
            return await this.dynamoDBService.update(updateParameters);
        }
        catch (e) {
            this.logger.error({ error: e.message });
            return false;
        }
    }
    genDataQuery(key, userData) {
        let exp = {
            TableName: this.sipTableName,
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
    async setSipRequest(callId, cSeqNum, request) {
        let key = { type: this.setSipRequestType, callId: this.getCallId(callId, cSeqNum) };
        let item = { data: request };
        let data = _.merge(key, item);
        return await this.dynamoDBService.put(this.sipTableName, data, this.setSipRequestTtl);
    }
    getCallId(callId, cSeqNum) {
        return callId + "_" + cSeqNum;
    }
    async getSipRequest(callId, cSeqNum) {
        let key = {
            type: this.setSipRequestType,
            callId: this.getCallId(callId, cSeqNum)
        };
        let item = await this.dynamoDBService.get(this.sipTableName, key);
        return (undefined === item) ? undefined : item.data;
    }
    async deleteSipRequest(callId, cSeqNum) {
        let key = {
            type: this.setSipRequestType,
            callId: this.getCallId(callId, cSeqNum)
        };
        return await this.dynamoDBService.remove(this.sipTableName, key);
    }
    async setAck(callId, value) {
        let isSetAck = { isSetAck: value };
        let data = _.merge({ type: this.setAckType, callId: callId }, isSetAck);
        let result = await this.dynamoDBService.put(this.sipTableName, data, this.setAckTtl);
        if (result === false) {
            this.logger.error({ msg: `setAck failed to save session data: ${JSON.stringify(data)}` });
        }
    }
    async getAck(callId) {
        let key = { type: this.setAckType, callId };
        let data = await this.dynamoDBService.get(this.sipTableName, key);
        if (data === undefined) {
            return false;
        }
        else {
            return data.isSetAck === 'true' ? true : false;
        }
    }
    async deleteAck(callId) {
        let key = { type: this.setAckType, callId };
        return await this.dynamoDBService.remove(this.sipTableName, key);
    }
};
RestcommDbService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        configuration_service_1.ConfigurationService,
        dynamo_db_service_1.DynamoDbService])
], RestcommDbService);
exports.RestcommDbService = RestcommDbService;
//# sourceMappingURL=restcomm.db.service.js.map