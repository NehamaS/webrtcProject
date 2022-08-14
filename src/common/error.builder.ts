import {Injectable} from "@nestjs/common";
import {WsRequestDto} from "../dto/ws.request.dto";
import {ApiGwDto} from "../dto/api.gw.dto";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {getMessageId} from "./constants";

@Injectable()
export class ErrorBuilder {
    constructor(private readonly logger: MculoggerService) {
    }

    buildErrorResponseWsRequestDto(wsRequest: WsRequestDto, statusCode: string, description: string): ApiGwDto {
        return this.buildErrorResponseApiGwDto(wsRequest.dto, statusCode, description)
    }

    buildErrorResponseApiGwDto(wsRequest: ApiGwDto, statusCode: string, description: string): ApiGwDto {
        try {
            return {
                callId: wsRequest.callId,
                messageId: getMessageId(wsRequest.messageId, wsRequest.body.service), //in case error response
                source: wsRequest.source,
                destination: wsRequest.destination,
                ts: wsRequest.ts,
                type: wsRequest.type,
                body: {
                    requestMessageId: wsRequest.messageId,
                    action: wsRequest.body.action ? wsRequest.body.action : wsRequest.type,
                    statusCode: statusCode,
                    description: description
                }
            }

        } catch (e) {
            this.logger.error({error: e.message, event: wsRequest})
        }
    }
}
