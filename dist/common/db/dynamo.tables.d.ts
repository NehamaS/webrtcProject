export declare class DynamoTables {
    private dynamodb;
    constructor(tableName: string, credentials: any, endpoint?: string);
    private createTable;
    deleteTable(tableName: string): Promise<void>;
    createTableWithPartKeyString(tableName: string, partitionKeyName: string): Promise<void>;
    createTableWithPartAndSortString(tableName: string, partitionKeyName: string, sortKeyName: string): Promise<void>;
    createTableWithPartAndSortNumber(tableName: string, partitionKeyName: string, sortKeyName: string): Promise<void>;
    createTableLocalSecondaryIndex(tableName: string, partitionKeyName: string, sortKeyName: string, localIndexName: string, localSortKey: string): Promise<void>;
    createTableGlobalSecondaryIndexNumber(tableName: string, partitionKeyName: string, sortKeyName: string, globlIndexName: string, globalSortKey: string): Promise<void>;
    createTableGlobalSecondaryIndexString(tableName: string, partitionKeyName: string, sortKeyName: string, globlIndexName: string, globalSortKey: string): Promise<void>;
    createTablePartitionKeyGlobalSecondaryIndex(tableName: string, partitionKeyName: string, globalIndexName: string, globalKey: string): Promise<void>;
    createUserTablePartitionKeyTwoGlobalSecondaryIndex(tableName: string, partitionKeyName: string, firstGlobalIndexName: string, firstGlobalKey: string, secondGlobalIndexName: string, secondGlobalKey: string): Promise<void>;
    createSipTable(tableName: string, partitionKeyName: string, sortKeyName: string, globalSortKey: string, globlIndexName: string): Promise<void>;
}
