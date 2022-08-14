import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
export declare class AccesslogService implements NestMiddleware {
    private logger;
    private config;
    constructor(logger: MculoggerService, config: ConfigurationService);
    use(req: Request, res: Response, next: NextFunction): void;
}
