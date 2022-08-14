import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import { ApiGwFormatDto } from "../../dto/apiGwFormatDto";
import { ClientMsgHandler } from '../../client.msg.handler';
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { RequestDTO } from '../sip/common/sipMessageDTO';
import { CallService } from "../call.service";
export declare class One2OneService implements CallService {
    private readonly clientMsgHandler;
    readonly logger: MculoggerService;
    private readonly config;
    private readonly callIdSuffix;
    private callIdSuffixLength;
    constructor(clientMsgHandler: ClientMsgHandler, logger: MculoggerService, config: ConfigurationService);
    makeCall(request: ApiGwFormatDto): Promise<void>;
    updateCall(request: ApiGwFormatDto): Promise<void>;
    endCall(request: ApiGwFormatDto): Promise<void>;
    createRoom(request: ApiGwFormatDto): Promise<void>;
    closeRoom(request: ApiGwFormatDto): Promise<void>;
    ringingResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    connectResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    updateResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    rejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    updateRejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    endCallResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    private handleCallId;
    addUser(request: RequestDTO): Promise<void>;
    updateUser(request: RequestDTO): void;
    disconnectUser(request: RequestDTO): void;
    cleanRoom(request: RequestDTO): Promise<void>;
}