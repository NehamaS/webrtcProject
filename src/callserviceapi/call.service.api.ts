import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {ApiGwFormatDto} from '../dto/apiGwFormatDto';
import {CallService} from './call.service';
import {RequestDTO} from './sip/common/sipMessageDTO';
import {DbService} from "../common/db/db.service";
import {WsDispatcher} from "../ws.dispatcher";
import {RestcommService} from "./restcomm/restcomm.service";
import {ValidatorsFactory} from "../common/validators/validators.factory";
import {ErrorBuilder} from "../common/error.builder";
import {One2OneService} from "./one2one/one2one.service";
import {forwardRef, Inject, Injectable} from "@nestjs/common";
import {SipService} from "./sip/sip.service";
import {SessionDto} from "../dto/session.dto";
import {ConferenceService} from "./conference/conference.service";

@Injectable()
export class CallServiceApiImpl  implements CallService {

    constructor(private readonly logger: MculoggerService,
                //private readonly one2OneService: One2OneService,
                @Inject(forwardRef(() => One2OneService)) private readonly one2OneService: One2OneService,
                private readonly restcommService: RestcommService,
                private readonly conferenceService: ConferenceService) {
    }

    //Incoming Requests
    public async makeCall(request: ApiGwFormatDto) {
        return this.getService(request).makeCall(request);
    }
    public updateCall(request: ApiGwFormatDto) {
        return this.getService(request).updateCall(request);
    }
    public endCall(request: ApiGwFormatDto) {
        return this.getService(request).endCall(request);
    }
    public createRoom(request: ApiGwFormatDto) {
        return this.getService(request).createRoom(request);
    }
    public closeRoom(request: ApiGwFormatDto) {
        return this.getService(request).closeRoom(request);
    }

    //Outgoing Requests
    public addUser(request: RequestDTO) {

    }
    public updateUser(request: RequestDTO) {

    }
    public disconnectUser(request: RequestDTO) {

    }

    public cleanRoom(request: RequestDTO) {

    }

    //Incoming Responses
    public ringingResponse(request: ApiGwFormatDto) {
        return this.getService(request).ringingResponse(request);
    }
    public connectResponse(request: ApiGwFormatDto) {
        return this.getService(request).connectResponse(request);
    }
    public updateResponse(request: ApiGwFormatDto) {
        return this.getService(request).updateResponse(request);
    }
    public updateRejectResponse(request: ApiGwFormatDto) {
        return this.getService(request).updateResponse(request);
    }
    public rejectResponse(request: ApiGwFormatDto) {
        return this.getService(request).rejectResponse(request);
    }
    public endCallResponse(request: ApiGwFormatDto) {
        return this.getService(request).endCallResponse(request);
    }

    private getService(request: ApiGwFormatDto): CallService {
        if(request.service && request.service == "P2P") {
            console.log({msg: "getService - one2OneService"});
            return this.one2OneService;
        }
        else if(request.service && request.service == "P2M") {
            console.log({msg: "getService - conferenceService"});
            return this.conferenceService;
        }
        else {
            console.log({msg: "getService - restcommService"});
            return this.restcommService;
        }
    }
}
