import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import { ApiGwFormatDto } from '../dto/apiGwFormatDto';
import { CallService } from './call.service';
import { RequestDTO } from './sip/common/sipMessageDTO';
import { RestcommService } from "./restcomm/restcomm.service";
import { One2OneService } from "./one2one/one2one.service";
import { ConferenceService } from "./conference/conference.service";
export declare class CallServiceApiImpl implements CallService {
    private readonly logger;
    private readonly one2OneService;
    private readonly restcommService;
    private readonly conferenceService;
    constructor(logger: MculoggerService, one2OneService: One2OneService, restcommService: RestcommService, conferenceService: ConferenceService);
    makeCall(request: ApiGwFormatDto): Promise<any>;
    updateCall(request: ApiGwFormatDto): any;
    endCall(request: ApiGwFormatDto): any;
    createRoom(request: ApiGwFormatDto): any;
    closeRoom(request: ApiGwFormatDto): any;
    addUser(request: RequestDTO): void;
    updateUser(request: RequestDTO): void;
    disconnectUser(request: RequestDTO): void;
    cleanRoom(request: RequestDTO): void;
    ringingResponse(request: ApiGwFormatDto): any;
    connectResponse(request: ApiGwFormatDto): any;
    updateResponse(request: ApiGwFormatDto): any;
    updateRejectResponse(request: ApiGwFormatDto): any;
    rejectResponse(request: ApiGwFormatDto): any;
    endCallResponse(request: ApiGwFormatDto): any;
    private getService;
}
