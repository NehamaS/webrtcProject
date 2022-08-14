import { CanActivate, ExecutionContext } from '@nestjs/common';
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { DbService } from "../../common/db/db.service";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { CounterService } from "../../metrics/counter.service";
export declare class JwtAuthGuard implements CanActivate {
    private readonly logger;
    private readonly dbService;
    private readonly config;
    private readonly counterService;
    constructor(logger: MculoggerService, dbService: DbService, config: ConfigurationService, counterService: CounterService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private saveToDB;
    private parseToken;
    private validateParams;
}
