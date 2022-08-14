import { CallService } from "../call.service";
import { ClientMsgHandler } from "../../client.msg.handler";
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { ApiGwFormatDto } from "../../dto/apiGwFormatDto";
import { RequestDTO } from "../sip/common/sipMessageDTO";
import { MessageFactory } from "../sip/massagefactory/message.factory";
import { RestcommDbService } from "../../common/db/restcomm.db.service";
import { SipService } from "../sip/sip.service";
import { SipUtils } from "../sip/common/sip.utils";
import { MsmlFactory } from "../sip/massagefactory/msml.factory";
export declare class ConferenceService implements CallService {
    private readonly clientMsgHandler;
    private readonly sipService;
    readonly logger: MculoggerService;
    private readonly config;
    private readonly messageFactory;
    private readonly msmlFactory;
    private readonly restcommDbService;
    private readonly utils;
    constructor(clientMsgHandler: ClientMsgHandler, sipService: SipService, logger: MculoggerService, config: ConfigurationService, messageFactory: MessageFactory, msmlFactory: MsmlFactory, restcommDbService: RestcommDbService, utils: SipUtils);
    makeCall(request: ApiGwFormatDto): Promise<void>;
    updateCall(request: ApiGwFormatDto): Promise<void>;
    endCall(request: ApiGwFormatDto): Promise<void>;
    disconnectUser(request: RequestDTO): void;
    endCallResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    createRoom(request: ApiGwFormatDto): Promise<void>;
    closeRoom(request: ApiGwFormatDto): Promise<void>;
    cleanRoom(request: RequestDTO): Promise<void>;
    ringingResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    connectResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    updateResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    rejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    updateRejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void>;
    addUser(request: RequestDTO): Promise<void>;
    updateUser(request: RequestDTO): void;
    private buildResponse;
    private getContact;
    private createMeetingId;
}
