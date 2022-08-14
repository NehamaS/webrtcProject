import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {CallServiceApiImpl} from '../call.service.api';
import {ApiGwFormatDto} from "../../dto/apiGwFormatDto";
import {ClientMsgHandler} from '../../client.msg.handler';
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import {RequestDTO} from '../sip/common/sipMessageDTO';
import {CallService} from "../call.service";


@Injectable()
export class One2OneService implements CallService {

    private readonly callIdSuffix = "";
    private callIdSuffixLength = 0;

    constructor(
        @Inject(forwardRef(() => ClientMsgHandler)) private readonly clientMsgHandler: ClientMsgHandler,
        public readonly logger: MculoggerService,
        private readonly config: ConfigurationService) {

        this.callIdSuffix = this.config.get("one2one.callIdSuffix", "_leg2");
        this.callIdSuffixLength = -Math.abs(this.callIdSuffix.length);
        this.logger.debug("One2OneService started");
    }

    //Incoming Requests
    public async makeCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> makeCall - one2one", request: request});

        request.callId = this.handleCallId(request.callId);
        await this.clientMsgHandler.call(request);

    }

    public async updateCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> updateCall - one2one", request: request});

        request.callId = this.handleCallId(request.callId);
        await this.clientMsgHandler.update(request);
    }

    public async endCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> endCall - one2one", request: request});

        request.callId = this.handleCallId(request.callId);
        await this.clientMsgHandler.disconnect(request);

    }

    public async createRoom(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> createRoom - one2one", request: request});
    }

    public async closeRoom(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> closeRoom - one2one", request: request});
    }

    //Incoming Responses
    public async ringingResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> ringingResponse - one2one", apiGwResponse: apiGwResponse});

        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.ring(apiGwResponse);

    }

    public async connectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> connectResponse - one2one", apiGwResponse: apiGwResponse});

        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.connect(apiGwResponse);
    }

    public async updateResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> updateResponse - one2one", apiGwResponse: apiGwResponse});

        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.updateAck(apiGwResponse);

    }

    public async rejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> rejectResponse - one2one", apiGwResponse: apiGwResponse});

        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.reject(apiGwResponse);
    }

    public async updateRejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> updateRejectResponse - one2one", apiGwResponse: apiGwResponse});

        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.updateAck(apiGwResponse);
    }

    public async endCallResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> endCallResponse - one2one", apiGwResponse: apiGwResponse});

        apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
        await this.clientMsgHandler.endCallAck(apiGwResponse);

    }

    private handleCallId(callId: string): string {
        let callIdValue: string;
        if(callId.endsWith(this.callIdSuffix)) {
            callIdValue = callId.slice(0, this.callIdSuffixLength);
        }
        else {
            callIdValue = callId + this.callIdSuffix;
        }
        this.logger.info("callIdValue " + callIdValue);
        return callIdValue;
    }


    //Outgoing Requests
    public async addUser(request: RequestDTO): Promise<void> {
        this.logger.info({msg: "One2OneService: addUser", request: request});

    }

    public updateUser(request: RequestDTO): void {
        this.logger.info({msg: "One2OneService: updateUser", request: request});

    }

    public disconnectUser(request: RequestDTO): void {
        this.logger.info({msg: "One2OneService: disconnectUser", request: request});

    }

    public async cleanRoom(request: RequestDTO): Promise<void> {
        this.logger.info({msg: "One2OneService: cleanRoom", request: request});

    }

}