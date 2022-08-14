import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ClientMsgHandler } from "./client.msg.handler";
import { WsRequestDto } from "./dto/ws.request.dto";
import { WsDispatcher } from "./ws.dispatcher";
export declare class WebrtcController {
    private readonly logger;
    private readonly msgHandler;
    private readonly wsDispatcher;
    constructor(logger: MculoggerService, msgHandler: ClientMsgHandler, wsDispatcher: WsDispatcher);
    getName(): string;
    actions(event: WsRequestDto): Promise<{
        source: string;
        destination: string;
        callId: string;
        messageId: string;
        action: string;
    }>;
    connect(body: WsRequestDto): Promise<boolean>;
    disconnect(body: WsRequestDto): Promise<boolean>;
}
