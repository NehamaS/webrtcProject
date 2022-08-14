import {Inject, Injectable, NestMiddleware} from '@nestjs/common';
import {Request, Response, NextFunction} from 'express';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";

@Injectable()
export class AccesslogService implements NestMiddleware {
    constructor(@Inject(MculoggerService) private logger: MculoggerService,
                @Inject(MculoggerService) private config: ConfigurationService) {
    }

    use(req: Request, res: Response, next: NextFunction) {
        res.on('finish', () => {
            this.logger.info({
                Path: req.path,
                Request: {headers: req.headers, body: req.body, ctx: req["context"]},
                Response: {StatusCode: res.statusCode, body: res.statusMessage}
            });
        })
        next();
    }
}
