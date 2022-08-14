import { OnApplicationBootstrap } from '@nestjs/common';
import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { DynamoDbService } from "./dynamo.db.service";
import { UserDataDto } from "../../dto/user.data.dto";
import { SessionDto } from "../../dto/session.dto";
interface IDbService {
    setAction(msgId: string, seq: string, action: string): Promise<boolean>;
    getAction(msgId: string, seq: string): Promise<string>;
    delAction(msgId: string, seq: string): Promise<boolean>;
    setUser(userData: UserDataDto): Promise<boolean>;
    getUserData(userId: string, deviceId: string): Promise<UserDataDto>;
    getByConnectionId(connectionId: string): Promise<UserDataDto>;
    getByUserId(userId: string): Promise<Array<UserDataDto>>;
    updateUsersData(userData: UserDataDto): Promise<boolean>;
    delUsersData(userId: string, deviceId: string): Promise<boolean>;
    setSessionData(callData: SessionDto): Promise<boolean>;
    getSessionData(callId: string, seq: number): Promise<SessionDto>;
    delSessionData(callId: string, seq: number): Promise<boolean>;
}
export declare class DbService implements OnApplicationBootstrap, IDbService {
    private readonly logger;
    private readonly configurationService;
    private readonly dynamoDBService;
    private userTableTtl;
    private actionTableName;
    private actionTableTtl;
    private usersTableName;
    private usersTableTtl;
    private sessionTableName;
    private sessionTableTtl;
    constructor(logger: MculoggerService, configurationService: ConfigurationService, dynamoDBService: DynamoDbService);
    onApplicationBootstrap(): Promise<void>;
    setAction(callId: string, seq: string, action: string): Promise<boolean>;
    getAction(msgId: string, seq: string): Promise<string>;
    delAction(msgId: string, seq: string): Promise<boolean>;
    setSessionData(sessionData: SessionDto): Promise<boolean>;
    getSessionData(callId: string): Promise<SessionDto>;
    delSessionData(callId: string): Promise<boolean>;
    setUser(userData: UserDataDto): Promise<boolean>;
    updateUsersData(userData: UserDataDto): Promise<boolean>;
    getByConnectionId(connectionId: string): Promise<UserDataDto>;
    getByUserId(userId: string): Promise<Array<UserDataDto>>;
    getUserData(userId: string, deviceId: string): Promise<UserDataDto>;
    delUsersData(userId: string, deviceId: string): Promise<boolean>;
    private genUsersDataQuery;
    private extractUser;
}
export {};
