import {Injectable, OnApplicationBootstrap} from '@nestjs/common';
import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {DynamoDbService} from "./dynamo.db.service";
import * as _ from 'lodash'
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {RequestDTO} from "../../callserviceapi/sip/common/sipMessageDTO";
import {SipSession} from "../../callserviceapi/sip/common/sipSessionDTO";
import {SIP_TABLE} from "../constants";

export interface IRestcomMethods {
    setUserSession(session: SipSession): Promise<boolean>

    getUserSession(callId: string): Promise<SipSession>

    deleteUserSession(callId: string): Promise<boolean>

    updateUserSession(callId: string, seqNumber: number): Promise<boolean>

    setSipRequest(callId: string, cSeqNum: string, request: RequestDTO): Promise<boolean>

    getSipRequest(callId: string, cSeqNum: string): Promise<RequestDTO | undefined>

    deleteSipRequest(callId: string, cSeqNum: string): Promise<boolean>

    getAck(callId: string): Promise<boolean>

    deleteAck(callId: string): Promise<boolean>
}

interface Key {
    type: string,
    callId: string
}

@Injectable()
export class RestcommDbService implements OnApplicationBootstrap, IRestcomMethods {

    private sipTableName: string
    private userSessionType: string
    private userSessionTtl: number
    private setSipRequestType: string
    private setSipRequestTtl: number
    private setAckType: string
    private setAckTtl: number


    constructor(private readonly logger: MculoggerService,
                private readonly configurationService: ConfigurationService,
                private readonly dynamoDBService: DynamoDbService) {
        this.logger.debug("RestComDbService, started");
    }

    async onApplicationBootstrap() {
        try {
            this.sipTableName = await this.configurationService.get('dynamoDb.sipTable.tableName', SIP_TABLE)
            this.userSessionType = await this.configurationService.get('dynamoDb.sipTable.userSession.type', 'userSession')
            this.userSessionTtl = await this.configurationService.get('dynamoDb.sipTable.userSession.ttl', 86400)
            this.setSipRequestType = await this.configurationService.get('dynamoDb.sipTable.setSipRequest.type', 'setSipRequest')
            this.setSipRequestTtl = await this.configurationService.get('dynamoDb.sipTable.setSipRequest.ttl', 35)
            this.setAckType = await this.configurationService.get('dynamoDb.sipTable.setAck.type', 'setAck')
            this.setAckTtl = await this.configurationService.get('dynamoDb.sipTable.setAck.ttl', 35)
        } catch (e) {
            this.logger.error({msg: `${e.message}`})
        }
    }

    public async setUserSession(session: SipSession): Promise<boolean> {
        let key = {type: this.userSessionType, callId: session.callId}
        let item: { data: SipSession } = {data: session}
        let data = _.merge(key, item)
        return await this.dynamoDBService.put(this.sipTableName, data, this.userSessionTtl)
    }

    public async getUserSession(callId: string): Promise<SipSession> {
        let key: Key = {type: this.userSessionType, callId: callId}
        try {

            let result: { data: SipSession } = await this.dynamoDBService.get(this.sipTableName, key)
            if (undefined === result) {
                this.logger.error({msg: `getUserSession failed to get data`, key: key})
                return undefined
            }
            return result.data;
        } catch (e) { // case the casting failure
            this.logger.error({msg: `failed to get data`, key: key, error: e.message})
            return undefined
        }
    }

    public async deleteUserSession(callId: string): Promise<boolean> {
        let key: Key = {type: this.userSessionType, callId: callId}
        return await this.dynamoDBService.remove(this.sipTableName, key)
      }

    public async updateUserSession(callId: string, seqNumber: number): Promise<boolean> {
        let key: Key = {type: this.userSessionType, callId: callId}
        let updateAttribute: DocumentClient.UpdateItemInput = {
            TableName: this.sipTableName,
            Key: key,
            UpdateExpression: "SET #data.#seqNumber = :g",
            ExpressionAttributeNames: {"#data": "data", "#seqNumber": "seqNumber"},
            ExpressionAttributeValues: {":g": seqNumber},
            ReturnValues: "ALL_NEW"
        }

        return await this.dynamoDBService.update(updateAttribute)
      }

    public async updateParamsUserSession(keyValue: string, sipSession: SipSession): Promise<boolean> {
        try {
            let key: Key = {type: this.userSessionType, callId: keyValue}
            let updateParameters: DocumentClient.UpdateItemInput = this.genDataQuery(key, sipSession);
            this.logger.debug({action: 'updateAllUserSession', updateParameters: updateParameters})
            return await this.dynamoDBService.update(updateParameters)
        } catch (e) {
            this.logger.error({error: e.message})
            return false
        }
    }

    private genDataQuery(key: Key, userData: SipSession): DocumentClient.UpdateItemInput {

        let exp: DocumentClient.UpdateItemInput = {
            TableName: this.sipTableName,
            Key: key,
            ReturnValues: "ALL_NEW",
            UpdateExpression: 'set',
            ExpressionAttributeNames: {"#data": "data"},
            ExpressionAttributeValues: {}
        }
        Object.entries(userData).forEach(([key, item]) => {
            if(item) { //build UpdateItemInput just in case there is value/item
                exp.UpdateExpression += `  #data.#${key} = :${key},`;
                exp.ExpressionAttributeNames[`#${key}`] = key;
                exp.ExpressionAttributeValues[`:${key}`] = item
                if (key === 'connectionId') { //update connectionId - shall be updated in both levels
                    exp.UpdateExpression += `  #${key} = :${key},`
                }
            }
        })
        exp.UpdateExpression = exp.UpdateExpression.slice(0, -1); //remove ,
        this.logger.debug({action: 'genUsersDataQuery', returnQuery: exp})
        return exp
    }

    public async setSipRequest(callId: string, cSeqNum: string, request: RequestDTO): Promise<boolean> {
        let key: Key = {type: this.setSipRequestType, callId: this.getCallId(callId, cSeqNum)}
        let item: { data: RequestDTO } = {data: request}
        let data = _.merge(key, item)
        return await this.dynamoDBService.put(this.sipTableName, data, this.setSipRequestTtl)
      }

    private getCallId(callId: string, cSeqNum: string): string {
        return callId + "_" + cSeqNum
    }

    public async getSipRequest(callId: string, cSeqNum: string): Promise<RequestDTO> {
        let key: Key = {
            type: this.setSipRequestType,
            callId: this.getCallId(callId, cSeqNum)
        }
        let item: { data: RequestDTO } = await this.dynamoDBService.get(this.sipTableName, key)
        return (undefined === item) ? undefined : item.data
    }

    public async deleteSipRequest(callId: string, cSeqNum: string): Promise<boolean> {
        let key: Key = {
            type: this.setSipRequestType,
            callId: this.getCallId(callId, cSeqNum)
        }
        return await this.dynamoDBService.remove(this.sipTableName, key)
    }

    public async setAck(callId: string, value: 'false' | 'true') {
        let isSetAck: { isSetAck: 'false' | 'true' } = {isSetAck: value}
        let data = _.merge({type: this.setAckType, callId: callId}, isSetAck)
        let result: boolean = await this.dynamoDBService.put(this.sipTableName, data, this.setAckTtl)
        if (result === false) {
            this.logger.error({msg: `setAck failed to save session data: ${JSON.stringify(data)}`})
        }
    }

    public async getAck(callId: string): Promise<boolean> {
        let key: Key = {type: this.setAckType, callId}
        let data: { isSetAck: 'true' | 'false' } | undefined = await this.dynamoDBService.get(this.sipTableName, key)
        if (data === undefined) {
            return false
        } else {
            return data.isSetAck === 'true' ? true : false
        }
    }

    public async deleteAck(callId: string): Promise<boolean> {
        let key: Key = {type: this.setAckType, callId}
        return await this.dynamoDBService.remove(this.sipTableName, key)
      }
}
