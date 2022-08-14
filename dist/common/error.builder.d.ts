import { WsRequestDto } from "../dto/ws.request.dto";
import { ApiGwDto } from "../dto/api.gw.dto";
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
export declare class ErrorBuilder {
    private readonly logger;
    constructor(logger: MculoggerService);
    buildErrorResponseWsRequestDto(wsRequest: WsRequestDto, statusCode: string, description: string): ApiGwDto;
    buildErrorResponseApiGwDto(wsRequest: ApiGwDto, statusCode: string, description: string): ApiGwDto;
}
