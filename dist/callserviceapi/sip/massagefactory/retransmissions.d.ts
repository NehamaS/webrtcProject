import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import { RestcommDbService } from '../../../common/db/restcomm.db.service';
import { SipService } from "../sip.service";
export declare class Retransmissions {
    private readonly logger;
    private readonly db;
    private readonly sipService;
    retransmissionsMap: Map<string, any>;
    constructor(logger: MculoggerService, db: RestcommDbService, sipService: SipService);
    setRetransmissionTimer(response: any): Promise<void>;
    private getRetransmissionTimer;
    private cancelRetransmissionTimer;
    handleAckRequest(callId: any, toTag: any): void;
    private printMap;
}
