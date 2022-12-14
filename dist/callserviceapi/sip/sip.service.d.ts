import { OnModuleInit, OnModuleDestroy, OnApplicationBootstrap } from '@nestjs/common';
import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import { RequestDTO, ResponseDTO } from './common/sipMessageDTO';
import { RestcommService } from '../restcomm/restcomm.service';
import { ApiGwFormatDto } from '../../dto/apiGwFormatDto';
import { MessageFactory } from './massagefactory/message.factory';
import { Retransmissions } from './massagefactory/retransmissions';
export declare class SipService implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap {
    private readonly restcommService;
    private readonly messageFactory;
    private readonly retransmissions;
    private readonly logger;
    private readonly port;
    readonly address: string;
    private sipApi;
    constructor(restcommService: RestcommService, messageFactory: MessageFactory, retransmissions: Retransmissions, logger: MculoggerService);
    setSipApi(api: any): void;
    onApplicationBootstrap(): Promise<void>;
    onModuleInit(): void;
    onModuleDestroy(): void;
    start: () => void;
    stop: () => void;
    protected sipMessageHandler(request: any): void;
    send(sipRequest: RequestDTO, cb: any): Promise<void>;
    private buildErrorResponse;
    buildAndSendResponse(sipRequest: RequestDTO, apiGwResponse: ApiGwFormatDto): Promise<any>;
    setRetransmission(response: any): Promise<void>;
    sendRetryResponse(response: ResponseDTO): Promise<void>;
    private fixSipHeadersFormat;
    cancelFlow(inviteReq: RequestDTO): Promise<void>;
}
