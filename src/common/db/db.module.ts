import {Global, Module} from '@nestjs/common';
import {DbService} from "./db.service";
import {DynamoDbService} from "./dynamo.db.service";
import {RestcommDbService} from "./restcomm.db.service";

@Module({
    imports: [],
    providers: [DbService, RestcommDbService, DynamoDbService],
    exports: [DbService, RestcommDbService]
})
export class DbModule {
}
