import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { WsRequestDto } from "../dto/ws.request.dto";
import { ApiGwDto } from "../dto/api.gw.dto";
import { SessionDto } from "../dto/session.dto";
import { GwCdrDto } from "../dto/gw.cdr.dto";
import { ApiGwFormatDto } from "../dto/apiGwFormatDto";
import { DbService } from "../common/db/db.service";
export declare class CdrService {
    private readonly logger;
    private readonly dbService;
    private readonly config;
    private cdrEnable;
    private path;
    private filename;
    private size;
    private interval;
    private maxFiles;
    private stream;
    constructor(logger: MculoggerService, dbService: DbService, config: ConfigurationService);
    onModuleInit(): any;
    getTime(): number;
    setStartTime4SessData(event: WsRequestDto, callData: ApiGwDto, sessionData: SessionDto): Promise<void>;
    setAnswerTime4SessData(event: ApiGwDto): Promise<void>;
    getCdrParameters(callId: string): Promise<GwCdrDto>;
    writeCdr(request: ApiGwFormatDto): Promise<GwCdrDto>;
}
