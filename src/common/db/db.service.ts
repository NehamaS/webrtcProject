import {Injectable, OnApplicationBootstrap} from '@nestjs/common';
import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {
    ACTION_TABLE,
    ANSWER_ACTION,
    HOLD_ACTION,
    HOLD_ACTION_ACK, MODIFY_ACTION,
    MODIFY_ACTION_ACK,
    RESUME_ACTION,
    RESUME_ACTION_ACK, SESSION_TABLE, START_ACTION, UNDEFINED_ACTION, USERS_TABLE
} from "../constants";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {DynamoDbService} from "./dynamo.db.service";
import * as _ from "lodash";
import {DocumentClient} from "aws-sdk/clients/dynamodb";
import {WsRequestDto} from "../../dto/ws.request.dto";
import {UserDataDto} from "../../dto/user.data.dto";
import {SessionDto} from "../../dto/session.dto";

// export enum Actions {
//     ANSWER_ACTION,
//     HOLD_ACTION,
//     HOLD_ACTION_ACK,
//     MODIFY_ACTION,
//     MODIFY_ACTION_ACK,
//     RESUME_ACTION,
//     RESUME_ACTION_ACK,
//     START_ACTION,
//     UNDEFINED_ACTION
// }

interface IDbService {
    setAction(msgId: string, seq: string, action: string): Promise<boolean>

    getAction(msgId: string, seq: string): Promise<string>

    delAction(msgId: string, seq: string): Promise<boolean>

    setUser(userData: UserDataDto): Promise<boolean> //On Register

    getUserData(userId: string, deviceId: string): Promise<UserDataDto>

    getByConnectionId(connectionId: string): Promise<UserDataDto>  //On Start Call - to get userId and deviceId

    getByUserId(userId: string): Promise<Array<UserDataDto>> //Getting all PNS for a user

    updateUsersData(userData: UserDataDto): Promise<boolean> //Updated tokens in case of refresh

    delUsersData(userId: string, deviceId: string): Promise<boolean> //On UnRegister

    setSessionData(callData: SessionDto): Promise<boolean>

    getSessionData(callId: string, seq: number): Promise<SessionDto>

    delSessionData(callId: string, seq: number): Promise<boolean>
}

interface actionTableKey {
    msgId: string,
    seq: string
}

interface usersTableKey {
    userId: string
    deviceId: string
}

interface sessionTableKey {
    callId: string
}

@Injectable()
export class DbService implements OnApplicationBootstrap, IDbService {

    private userTableTtl: number
    private actionTableName: string
    private actionTableTtl: number

    private usersTableName: string
    private usersTableTtl: number
    private sessionTableName: string
    private sessionTableTtl: number


    constructor(private readonly logger: MculoggerService,
                private readonly configurationService: ConfigurationService,
                private readonly dynamoDBService: DynamoDbService) {
    }


    async onApplicationBootstrap() {
        try {
            this.actionTableName = await this.configurationService.get('dynamoDb.actionTable.tableName', ACTION_TABLE)
            this.actionTableTtl = await this.configurationService.get('dynamoDb.actionTable.ttl', 7200)
            this.sessionTableName = await this.configurationService.get('dynamoDb.sessionTable.tableName', SESSION_TABLE)
            this.sessionTableTtl = await this.configurationService.get('dynamoDb.sessionTable.ttl', 7200)
            this.usersTableName = await this.configurationService.get('dynamoDb.usersTable.tableName', USERS_TABLE) //key = {msgId: string, seq: number}
            this.usersTableTtl = await this.configurationService.get('dynamoDb.usersTable.ttl', 86400)


        } catch (e) {
            this.logger.error({msg: `${e.message}`})
        }
    }

    public async setAction(callId: string, seq: string, action: string): Promise<boolean> {
        this.logger.debug({func: 'setAction', msgId: callId, seq: seq, action: action});
        let key: actionTableKey = {msgId: callId, seq: seq}
        let item: { data: string } = {data: action}
        let data = _.merge(key, item)
        return await this.dynamoDBService.put(this.actionTableName, data, this.userTableTtl)
    }

    public async getAction(msgId: string, seq: string): Promise<string> {
        let key: actionTableKey = {msgId: msgId, seq: seq}
        let item: { data: string } = await this.dynamoDBService.get(this.actionTableName, key)
        if (undefined === item) {
            this.logger.error({msg: `Failed to get data`, key: key})
            return undefined
        }
        switch (item.data) {
            case START_ACTION:
                return ANSWER_ACTION;
            case HOLD_ACTION:
                return HOLD_ACTION_ACK;
            case RESUME_ACTION:
                return RESUME_ACTION_ACK;
            case MODIFY_ACTION:
                return MODIFY_ACTION_ACK;
            default:
                return UNDEFINED_ACTION;
        }
    }

    public async delAction(msgId: string, seq: string): Promise<boolean> {
        let key: actionTableKey = {msgId: msgId, seq: seq}
        return await this.dynamoDBService.remove(this.actionTableName, key)
    }


    //CallId Table
    async setSessionData(sessionData: SessionDto): Promise<boolean> {
        this.logger.debug({func: 'setSessionData', sessionData: sessionData});
        let key: sessionTableKey = {callId: sessionData.callId}
        let item: { data: SessionDto } = {data: sessionData}
        let data = _.merge(key, item)
        return await this.dynamoDBService.put(this.sessionTableName, data, this.sessionTableTtl)
    }

    async getSessionData(callId: string): Promise<SessionDto> {
        let key: sessionTableKey = {callId: callId}

        let item: { data: SessionDto } = await this.dynamoDBService.get(this.sessionTableName, key)
        if (undefined === item) {
            this.logger.error({msg: `getSessionData failed to get data`, key: key})
            return undefined
        }
        return item.data
    }

    async delSessionData(callId: string): Promise<boolean> {
        let key: sessionTableKey = {callId: callId}
        return await this.dynamoDBService.remove(this.sessionTableName, key)
    }


    //UsersTable
    async setUser(userData: UserDataDto): Promise<boolean> {
        this.logger.info({func: 'setUser', userData: userData});
        try {
            let key: usersTableKey = {userId: this.extractUser(userData.userId), deviceId: userData.deviceId}
            let item: { data: UserDataDto } = {data: userData}
            let data = _.merge(key, {connectionId: userData.connectionId}, item) //save the global indexes in basic attribute
            this.logger.info({action: 'setUser in webrtc_user', data: data })
            return await this.dynamoDBService.put(this.usersTableName, data, this.usersTableTtl)
        } catch (e) {
            this.logger.error({error: e.message ? e.message : e, userData: userData})
            return false
        }

    }

    async updateUsersData(userData: UserDataDto): Promise<boolean> {
        try {
            let key: usersTableKey = {userId: this.extractUser(userData.userId), deviceId: userData.deviceId}

            let updateParameters: DocumentClient.UpdateItemInput = this.genUsersDataQuery(key, userData)
            this.logger.debug({action: 'updateUsersData', updateParameters: updateParameters})
            return await this.dynamoDBService.update(updateParameters)
        } catch (e) {
            this.logger.error({error: e.message})
            return false
        }
    }

    async getByConnectionId(connectionId: string): Promise<UserDataDto> { //ConnectionId is global index
        let query: DocumentClient.QueryInput = {
            TableName: this.usersTableName,
            ExpressionAttributeNames: {
                "#connectionId": "connectionId",
            },
            ExpressionAttributeValues: {
                ":connectionId": connectionId
            },
            KeyConditionExpression: "#connectionId = :connectionId",
            IndexName: 'connectionId-index'

        }

        let result: Array<any> = await this.dynamoDBService.queryDb(query)
        this.logger.info({action: "getByConnectionId", query: query, result: result })
        if (result == undefined) {
            return undefined;
        }

        return result.length > 0 ? result[0].data : undefined //For each record there is uniq connectionId - so result array with one element
    }

    async getByUserId(userId: string): Promise<Array<UserDataDto>> { //userId is partitionKey
        let query: DocumentClient.QueryInput = {
            TableName: this.usersTableName,
            ExpressionAttributeNames: {
                "#userId": "userId",
            },
            ExpressionAttributeValues: {
                ":userId": this.extractUser(userId)
            },
            KeyConditionExpression: "#userId = :userId",
        }

        let result: Array<any> = await this.dynamoDBService.queryDb(query)
        let data: Array<UserDataDto> = new Array<UserDataDto>()

        if (result != undefined) {
            result.forEach(element => {
                data.push(element.data)
            })
        }

        return data
    }

    async getUserData(userId: string, deviceId: string): Promise<UserDataDto> {
        try {
            if(!userId || !deviceId) {
                this.logger.error({action: 'getUserData', msg: `Failed to get data deviceId or userId undefined`, })
                return undefined
            }
            this.logger.debug({action: "getUserData", userId: userId, deviceId: deviceId})

            let key: usersTableKey = {
                userId: this.extractUser(userId),
                deviceId: deviceId
            }
            let item: { data: UserDataDto } = await this.dynamoDBService.get(this.usersTableName, key)
            if (undefined === item) {
                this.logger.error({msg: `Failed to get data`, key: key})
                return undefined
            }

            return item.data
        } catch (e) {
            this.logger.error({action: "getUserData", userId: userId, deviceId: deviceId, error: e })
            return undefined
        }

    }

    async delUsersData(userId: string, deviceId: string): Promise<boolean> { //shall be done just in case of unregister
        let key: usersTableKey = {userId: this.extractUser(userId), deviceId: deviceId}
        return await this.dynamoDBService.remove(this.usersTableName, key)
    }

    private genUsersDataQuery(key: usersTableKey, userData: UserDataDto): DocumentClient.UpdateItemInput {

        let exp: DocumentClient.UpdateItemInput = {
            TableName: this.usersTableName,
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

    private extractUser(user: string): string {
        if (!user && (user.indexOf('sip:') !== -1 || user.indexOf('tel:') !== -1)) {
            return user.substring(4);
        }
        return user
    }
}
