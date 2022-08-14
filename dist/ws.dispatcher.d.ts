import { OnApplicationBootstrap } from "@nestjs/common";
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ApiGwDto } from "./dto/api.gw.dto";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { HttpService } from '@nestjs/axios';
import { DbService } from "./common/db/db.service";
import { WssAdmin } from "./websocket/admin/wss.admin";
export declare class WsDispatcher implements OnApplicationBootstrap {
    private readonly logger;
    private readonly config;
    private readonly dbService;
    private readonly httpService;
    private readonly wsAdmin;
    private apiGwManagementApi;
    private useWsInterface;
    constructor(logger: MculoggerService, config: ConfigurationService, dbService: DbService, httpService: HttpService, wsAdmin: WssAdmin);
    onApplicationBootstrap(): void;
    sendMessage(wsConnectionId: string, msg: ApiGwDto): Promise<void>;
    private sendWsMessage;
    sendMessage2WsInterface(wsConnId: string, msg: ApiGwDto): Promise<void>;
    private clearMsg;
}
