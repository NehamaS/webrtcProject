import { OnApplicationBootstrap } from '@nestjs/common';
import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { DynamoDbService } from "./dynamo.db.service";
import { RequestDTO } from "../../callserviceapi/sip/common/sipMessageDTO";
import { SipSession } from "../../callserviceapi/sip/common/sipSessionDTO";
export interface IRestcomMethods {
    setUserSession(session: SipSession): Promise<boolean>;
    getUserSession(callId: string): Promise<SipSession>;
    deleteUserSession(callId: string): Promise<boolean>;
    updateUserSession(callId: string, seqNumber: number): Promise<boolean>;
    setSipRequest(callId: string, cSeqNum: string, request: RequestDTO): Promise<boolean>;
    getSipRequest(callId: string, cSeqNum: string): Promise<RequestDTO | undefined>;
    deleteSipRequest(callId: string, cSeqNum: string): Promise<boolean>;
    getAck(callId: string): Promise<boolean>;
    deleteAck(callId: string): Promise<boolean>;
}
export declare class RestcommDbService implements OnApplicationBootstrap, IRestcomMethods {
    private readonly logger;
    private readonly configurationService;
    private readonly dynamoDBService;
    private sipTableName;
    private userSessionType;
    private userSessionTtl;
    private setSipRequestType;
    private setSipRequestTtl;
    private setAckType;
    private setAckTtl;
    constructor(logger: MculoggerService, configurationService: ConfigurationService, dynamoDBService: DynamoDbService);
    onApplicationBootstrap(): Promise<void>;
    setUserSession(session: SipSession): Promise<boolean>;
    getUserSession(callId: string): Promise<SipSession>;
    deleteUserSession(callId: string): Promise<boolean>;
    updateUserSession(callId: string, seqNumber: number): Promise<boolean>;
    updateParamsUserSession(keyValue: string, sipSession: SipSession): Promise<boolean>;
    private genDataQuery;
    setSipRequest(callId: string, cSeqNum: string, request: RequestDTO): Promise<boolean>;
    private getCallId;
    getSipRequest(callId: string, cSeqNum: string): Promise<RequestDTO>;
    deleteSipRequest(callId: string, cSeqNum: string): Promise<boolean>;
    setAck(callId: string, value: 'false' | 'true'): Promise<void>;
    getAck(callId: string): Promise<boolean>;
    deleteAck(callId: string): Promise<boolean>;
}
