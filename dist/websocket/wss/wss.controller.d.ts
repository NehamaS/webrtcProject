import { OnApplicationBootstrap } from "@nestjs/common";
import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import { WssAdmin } from "../admin/wss.admin";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { ClientMsgHandler } from "../../client.msg.handler";
export declare class WssController implements OnApplicationBootstrap {
    private readonly config;
    private readonly logger;
    private readonly wssAdmin;
    private readonly msgHandler;
    private wsServer;
    private httpsServer;
    constructor(config: ConfigurationService, logger: MculoggerService, wssAdmin: WssAdmin, msgHandler: ClientMsgHandler);
    onApplicationBootstrap(): void;
    init(): void;
}
