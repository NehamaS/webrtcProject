import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
export declare class MsmlFactory {
    private readonly config;
    private readonly logger;
    constructor(config: ConfigurationService, logger: MculoggerService);
    createConference(roomId: string): string;
    join(roomId: string, userId: any): string;
    unjoin(roomId: string, userId: any): string;
}
