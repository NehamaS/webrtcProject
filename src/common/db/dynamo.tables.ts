import * as AWS from "aws-sdk";
import * as _ from "lodash"
import {DynamoDB} from "aws-sdk";

/*
  This method for unit test only - create a table
  To Get credentials detail, login to aws console => IAM => Create a user with "AdministratorAccess"
  in case you gave already a user:
  Select the user => "Security credentials" => Select credentials or "Create access key"

  for region => select the region you login with
   */

//https://docs.aws.amazon.com/cli/latest/reference/dynamodb/create-table.html

export class DynamoTables {

    private dynamodb: AWS.DynamoDB

    constructor(tableName: string, credentials, endpoint?: string) {

        AWS.config.update(_.merge({tableName: tableName}, credentials))
        this.dynamodb = new AWS.DynamoDB({endpoint: endpoint})
    }

    private async createTable(params): Promise<void> {
        await this.dynamodb.createTable(params)
            .promise()
            .then(data => {
                console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
            })
            .catch((e) => {
                console.warn(e.message)
            })
    }

    async deleteTable(tableName: string): Promise<void> {
        try {
            await this.dynamodb.deleteTable({TableName: tableName})
        } catch (e) {
            console.warn(e.message)
        }

    }

    async createTableWithPartKeyString(tableName: string, partitionKeyName: string): Promise<void> {

        let params = {
            TableName: tableName,
            AttributeDefinitions: [ //* The data type for the attribute, where:    S - the attribute is of type String    N - the attribute is of type Number    B - the attribute is of type Binary
                {AttributeName: partitionKeyName, AttributeType: "S"},

            ],
            KeySchema: [
                {AttributeName: partitionKeyName, KeyType: "HASH"},  //Partition key

            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            }
        };

        await this.createTable(params)
    }

    async createTableWithPartAndSortString(tableName: string, partitionKeyName: string, sortKeyName: string): Promise<void> {

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

        }
        await this.createTable(params)
    }

    async createTableWithPartAndSortNumber(tableName: string, partitionKeyName: string, sortKeyName: string): Promise<void> {

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

        }
        await this.createTable(params)
    }


    /*
    Local secondary index
    — An index that has the same partition key as the base table, but a different sort key.
     A local secondary index is "local" in the sense that every partition of a local secondary index is scoped to a base table partition that has the same partition key value.
    */
    async createTableLocalSecondaryIndex(tableName: string, partitionKeyName: string, sortKeyName: string, localIndexName: string, localSortKey: string): Promise<void> {
        let params = {
            AttributeDefinitions: [
                {
                    AttributeName: localSortKey, //"AlbumTitle",
                    AttributeType: "S"
                },
                {
                    AttributeName: partitionKeyName, //"Artist",
                    AttributeType: "S"
                },
                {
                    AttributeName: sortKeyName, //"SongTitle",
                    AttributeType: "S"
                }
            ],
            TableName: tableName, //"MusicCollection",
            KeySchema: [
                {
                    AttributeName: partitionKeyName, //"Artist",
                    KeyType: "HASH"
                },
                {
                    AttributeName: sortKeyName, //"SongTitle",
                    KeyType: "RANGE"
                }
            ],


            ProvisionedThroughput: {
                ReadCapacityUnits: 1,
                WriteCapacityUnits: 1
            },
            LocalSecondaryIndexes: [
                {
                    IndexName: localIndexName, //"AlbumTitleIndex",
                    KeySchema: [
                        {
                            AttributeName: partitionKeyName,//"Artist",
                            KeyType: "HASH"
                        },
                        {
                            AttributeName: localSortKey, //"AlbumTitle",
                            KeyType: "RANGE"
                        }
                    ],
                    // Projection: {
                    //     ProjectionType: "INCLUDE",
                    //     NonKeyAttributes: [
                    //         "Genre",
                    //         "Year"
                    //     ]
                    // },
                }
            ]
        }
        await this.createTable(params)

    }

    /*
    Global secondary index
    — An index with a partition key and a sort key that can be different from those on the base table.
     A global secondary index is considered "global" because queries on the index can span all of the data in the base table, across all partitions.
     A global secondary index is stored in its own partition space away from the base table and scales separately from the base table.
     */
    async createTableGlobalSecondaryIndexNumber(tableName: string, partitionKeyName: string, sortKeyName: string, globlIndexName: string, globalSortKey: string): Promise<void> {
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
                        // {
                        //     AttributeName: sortKeyName,
                        //     KeyType: "HASH"
                        // },
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
        }
        try {
            await this.createTable(params)
        } catch (e) {
            console.error(e)
        }

    }

    async createTableGlobalSecondaryIndexString(tableName: string, partitionKeyName: string, sortKeyName: string, globlIndexName: string, globalSortKey: string): Promise<void> {
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
                        ProjectionType: "ALL" //to rerun all attribute
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }

                }
            ]
        }
        try {
            await this.createTable(params)
        } catch (e) {
            console.error(e)
        }

    }

    async createTablePartitionKeyGlobalSecondaryIndex(tableName: string, partitionKeyName: string, globalIndexName: string, globalKey: string): Promise<void> {
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
                        // NonKeyAttributes: [
                        //     'data'
                        // ]
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }

                }
            ]
        }
        try {
            await this.createTable(params)
        } catch (e) {
            console.error(e)
        }

    }

    async createUserTablePartitionKeyTwoGlobalSecondaryIndex(tableName: string, partitionKeyName: string, firstGlobalIndexName: string, firstGlobalKey: string, secondGlobalIndexName: string, secondGlobalKey: string): Promise<void> {
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
                        // NonKeyAttributes: [
                        //     'data'
                        // ]
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
                        // NonKeyAttributes: [
                        //     'data'
                        // ]
                    },
                    ProvisionedThroughput: {
                        ReadCapacityUnits: 1,
                        WriteCapacityUnits: 1
                    }

                }
            ]
        }
        try {
            await this.createTable(params)
        } catch (e) {
            console.error(e)
        }

    }

    async createSipTable(tableName: string, partitionKeyName: string, sortKeyName: string, globalSortKey: string, globlIndexName: string): Promise<void> {
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
        }
        try {
            await this.createTable(params)
        } catch (e) {
            console.error(e)
        }
    }
}