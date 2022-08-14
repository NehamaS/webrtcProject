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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamoTables = void 0;
const AWS = __importStar(require("aws-sdk"));
const _ = __importStar(require("lodash"));
class DynamoTables {
    constructor(tableName, credentials, endpoint) {
        AWS.config.update(_.merge({ tableName: tableName }, credentials));
        this.dynamodb = new AWS.DynamoDB({ endpoint: endpoint });
    }
    async createTable(params) {
        await this.dynamodb.createTable(params)
            .promise()
            .then(data => {
            console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
        })
            .catch((e) => {
            console.warn(e.message);
        });
    }
    async deleteTable(tableName) {
        try {
            await this.dynamodb.deleteTable({ TableName: tableName });
        }
        catch (e) {
            console.warn(e.message);
        }
    }
    async createTableWithPartKeyString(tableName, partitionKeyName) {
        let params = {
            TableName: tableName,
            AttributeDefinitions: [
                { AttributeName: partitionKeyName, AttributeType: "S" },
            ],
            KeySchema: [
                { AttributeName: partitionKeyName, KeyType: "HASH" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
        };
        await this.createTable(params);
    }
    async createTableWithPartAndSortString(tableName, partitionKeyName, sortKeyName) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: sortKeyName,
                    AttributeType: "S"
                }
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                },
                {
                    AttributeName: sortKeyName,
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
        };
        await this.createTable(params);
    }
    async createTableWithPartAndSortNumber(tableName, partitionKeyName, sortKeyName) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: sortKeyName,
                    AttributeType: "N"
                }
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                },
                {
                    AttributeName: sortKeyName,
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
        };
        await this.createTable(params);
    }
    async createTableLocalSecondaryIndex(tableName, partitionKeyName, sortKeyName, localIndexName, localSortKey) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: localSortKey,
                    AttributeType: "S"
                },
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: sortKeyName,
                    AttributeType: "S"
                }
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                },
                {
                    AttributeName: sortKeyName,
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            LocalSecondaryIndexes: [
                {
                    IndexName: localIndexName,
                    KeySchema: [
                        {
                            AttributeName: partitionKeyName,
                            KeyType: "HASH"
                        },
                        {
                            AttributeName: localSortKey,
                            KeyType: "RANGE"
                        }
                    ],
                }
            ]
        };
        await this.createTable(params);
    }
    async createTableGlobalSecondaryIndexNumber(tableName, partitionKeyName, sortKeyName, globlIndexName, globalSortKey) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: sortKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: globalSortKey,
                    AttributeType: "N"
                },
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                }
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                },
                {
                    AttributeName: sortKeyName,
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: globlIndexName,
                    KeySchema: [
                        {
                            AttributeName: globalSortKey,
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "INCLUDE",
                        NonKeyAttributes: [
                            partitionKeyName
                        ]
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                }
            ]
        };
        try {
            await this.createTable(params);
        }
        catch (e) {
            console.error(e);
        }
    }
    async createTableGlobalSecondaryIndexString(tableName, partitionKeyName, sortKeyName, globlIndexName, globalSortKey) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: sortKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: globalSortKey,
                    AttributeType: "S"
                },
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                }
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                },
                {
                    AttributeName: sortKeyName,
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: globlIndexName,
                    KeySchema: [
                        {
                            AttributeName: globalSortKey,
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                }
            ]
        };
        try {
            await this.createTable(params);
        }
        catch (e) {
            console.error(e);
        }
    }
    async createTablePartitionKeyGlobalSecondaryIndex(tableName, partitionKeyName, globalIndexName, globalKey) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: globalKey,
                    AttributeType: "S"
                },
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: globalIndexName,
                    KeySchema: [
                        {
                            AttributeName: globalKey,
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                }
            ]
        };
        try {
            await this.createTable(params);
        }
        catch (e) {
            console.error(e);
        }
    }
    async createUserTablePartitionKeyTwoGlobalSecondaryIndex(tableName, partitionKeyName, firstGlobalIndexName, firstGlobalKey, secondGlobalIndexName, secondGlobalKey) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: firstGlobalKey,
                    AttributeType: "S"
                },
                {
                    AttributeName: secondGlobalKey,
                    AttributeType: "S"
                },
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: firstGlobalIndexName,
                    KeySchema: [
                        {
                            AttributeName: firstGlobalKey,
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                },
                {
                    IndexName: secondGlobalIndexName,
                    KeySchema: [
                        {
                            AttributeName: secondGlobalKey,
                            KeyType: "HASH"
                        }
                    ],
                    Projection: {
                        ProjectionType: "ALL"
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                }
            ]
        };
        try {
            await this.createTable(params);
        }
        catch (e) {
            console.error(e);
        }
    }
    async createSipTable(tableName, partitionKeyName, sortKeyName, globalSortKey, globlIndexName) {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: partitionKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: sortKeyName,
                    AttributeType: "S"
                },
                {
                    AttributeName: globalSortKey,
                    AttributeType: "S"
                }
            ],
            TableName: tableName,
            KeySchema: [
                {
                    AttributeName: partitionKeyName,
                    KeyType: "HASH"
                },
                {
                    AttributeName: sortKeyName,
                    KeyType: "RANGE"
                }
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            GlobalSecondaryIndexes: [
                {
                    IndexName: globlIndexName,
                    KeySchema: [
                        {
                            AttributeName: partitionKeyName,
                            KeyType: "HASH"
                        },
                        {
                            AttributeName: globalSortKey,
                            KeyType: "RANGE"
                        }
                    ],
                    Projection: {
                        ProjectionType: "INCLUDE",
                        NonKeyAttributes: [
                            partitionKeyName
                        ]
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }
                }
            ]
        };
        try {
            await this.createTable(params);
        }
        catch (e) {
            console.error(e);
        }
    }
}
exports.DynamoTables = DynamoTables;
//# sourceMappingURL=dynamo.tables.js.map