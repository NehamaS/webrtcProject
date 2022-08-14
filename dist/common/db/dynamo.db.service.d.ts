import { OnModuleInit } from '@nestjs/common';
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
export declare class DynamoDbService implements OnModuleInit {
    private readonly logger;
    private readonly configurationService;
    private dynamoClient;
    private useDynamoDbLocal;
    private dynamoDbRegion;
    private dynamoDbEndpoint;
    private dynamoDbAccessKeyId;
    private dynamoDbSecretAccessKey;
    constructor(logger: MculoggerService, configurationService: ConfigurationService);
    onModuleInit(): Promise<void>;
    private getCredentials;
    private createWebRtcUsersTable;
    private createSessionTable;
    private createSipTable;
    private deleteTable;
    private createTables;
    private setDynamoClient;
    private getConfiguration;
    put(tableName: string, data: Object, ttl: number): Promise<boolean>;
    update(params: DocumentClient.UpdateItemInput): Promise<boolean>;
    get<T>(tableName: string, key: Object): Promise<T>;
    rangeByPrefix<T>(tableName: string, primaryKeyName: string, keyPrefix: string): Promise<Array<T>>;
    remove(tableName: string, key: Object): Promise<boolean>;
    queryDb<T>(queryInput: DocumentClient.QueryInput): Promise<Array<T>>;
    private putItem;
    private getItem;
    private scan;
    private deleteItem;
    private updateItem;
}
