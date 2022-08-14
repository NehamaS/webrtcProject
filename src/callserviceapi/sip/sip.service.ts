import {Injectable, OnModuleInit, OnModuleDestroy, OnApplicationBootstrap, forwardRef, Inject} from '@nestjs/common';
import sip = require("sip");
import * as ip from "ip";
import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import {RequestDTO, ResponseDTO, Status} from './common/sipMessageDTO';
import * as __ from 'lodash';
import {RestcommService} from '../restcomm/restcomm.service';
import {ApiGwFormatDto} from '../../dto/apiGwFormatDto';
import {MessageFactory, HEADER_X_RESTCOMM_CALLSID} from './massagefactory/message.factory';
import {Retransmissions} from './massagefactory/retransmissions';
import {API_GW_REQUEST_TERMINATE, CALL_SERVICE_OK, SIP_PORT} from "../../common/constants";

const sipCodes = {
    180: "Ringing",
    200: "OK",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    410: "Gone",
    486: "Busy Here",
    487: "Request Terminated",
    489: "Bad Event",
    500: "Server Internal Error",
    503: "Service Unavailable"
}

const sipHeadersMapping = new Map<string, string>(
    [
        ["x-meetingid", 'X-MeetingId'],
        ["x-service-type", 'X-Service-Type'],
        ['content-type', 'Content-Type'],
        ["x-restcomm-callsid", 'X-RestComm-CallSid'],
        ["max-forwards", 'Max-Forwards'],
        ['user-agent', 'User-Agent'],
        ["x-called-party-id", 'X-Called-Party-ID'],
        ["x-call-control", "X-Call-Control"],
        ["x-dialogue-type", "X-Dialogue-Type"]
    ]
);

@Injectable()
export class SipService implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap{

    private readonly port : number;
    readonly address : string;
    private sipApi = sip;

    constructor(@Inject(forwardRef(() => RestcommService))
        private readonly restcommService: RestcommService,
        private readonly messageFactory: MessageFactory,
        private readonly retransmissions: Retransmissions,
        private readonly logger: MculoggerService) {

        if (process.env.DEFAULT_SIP && process.env.DEFAULT_SIP == "false") {
            this.sipApi = require('../../../test/lib/sip.js');
        }
        this.port = process.env.SIP_PORT ? parseInt(process.env.SIP_PORT) : SIP_PORT;
        this.address = process.env.SIP_ADDRESS ? process.env.SIP_ADDRESS : ip.address();
        this.logger.info("SipService started");
    }

    public setSipApi(api : any){
        this.sipApi = api;
    }

    async onApplicationBootstrap() {
        //wait for config & logger service to be initialized properly by nest
        this.start();
    }

    onModuleInit() {
    }

    onModuleDestroy() {
        this.stop();
    }


    public start = () => {
        const options: any = {
            protocol: "UDP",
            address: this.address,
            port: this.port
        };
        this.logger.info({ action: "Start SipClient", data: options });
        this.sipApi.start(options, this.sipMessageHandler.bind(this));
    };

    public stop = () => {
        this.sipApi.stop();
    };

    protected sipMessageHandler(request: any): void {
        let rs: any;
        this.logger.info({ msg: " <========= " + request.method + " ", request: request });

        switch (request.method) {
            case "INVITE":
                rs = this.sipApi.makeResponse(request, 100, 'Trying');
                this.sipApi.send(rs);

                if(__.has(request, 'headers.to.params.tag')) {
                    this.restcommService.updateUser(request);
                }
                else {
                    this.restcommService.addUser(request);
                }
                break;
            case "ACK":
                let callId: string = request.headers['call-id'];
                let toTag: string = request.headers.to.params.tag;
                this.retransmissions.handleAckRequest(callId, toTag);
                break;
            case "INFO":
                rs = this.sipApi.makeResponse(request, 200, "Ok");
                this.sipApi.send(rs);
                this.logger.info({ msg: " =========> " + rs.status + " on " + rs.headers.cseq.method + " ", response: rs });
                break;
            case "BYE":
                rs = this.sipApi.makeResponse(request, 200, "OK");
                this.sipApi.send(rs);

                this.restcommService.disconnectUser(request);
                break;
            case "CANCEL":
                rs = this.sipApi.makeResponse(request, 200, "OK");
                this.sipApi.send(rs);

                this.restcommService.disconnectUser(request);
                break;
            default:
                break;
        }
    }

    public async send (sipRequest: RequestDTO, cb) : Promise<void> {
        this.logger.info({ msg: " =========> " + sipRequest.method + " ", request: sipRequest });
        const self = this;
        try{
            sipRequest = this.fixSipHeadersFormat(sipRequest, sipHeadersMapping);
            this.sipApi.send(sipRequest, (response) => {
                if(response && response.status) {
                    self.logger.info({ msg: " <========= " + response.status + " on " + response.headers.cseq.method + " ", response: response });
                    if (response.status == 100) {
                        // no handling, wait for response
                    }
                    else if (response.status < 200) {
                        return cb(null, response);
                    }
                    else {
                        return cb(null, response);
                    }
                }
                else {
                    let errorResponse: Status = this.buildErrorResponse(500, "Server Internal Error");
                    self.logger.error({ action: "received response error", error: "response wasn't received" });
                    return cb(errorResponse);
                }
            });
        }
        catch (e) {
            self.logger.error({ error: e });
            let errorResponse: Status = this.buildErrorResponse(500, "Server Internal Error");
            self.logger.error({ action: "SipService send", error: "failed to send a request" });
            return cb(errorResponse);
        }

    }

    private buildErrorResponse (code: number, reason: string) : Status {
        let status: Status = {
            status:  code,
            reason: reason
        }
        return status;
    }

    public async buildAndSendResponse (sipRequest: RequestDTO, apiGwResponse: ApiGwFormatDto) : Promise<any> {

        let sipResponse: ResponseDTO;
        if(apiGwResponse.sdp) {
             let extension = {
                content: apiGwResponse.sdp,
                headers: {
                    'Content-Type' : "application/sdp"
                }
            };
            sipResponse = this.sipApi.makeResponse(sipRequest, 200, sipCodes[200], extension);
        }
        else {
            // if response don't include SDP it is Cancel
            if (apiGwResponse.status.code === '200') {
                if (sipRequest.headers.cseq.method === 'INVITE') {
                    sipResponse = this.sipApi.makeResponse(sipRequest, parseInt(API_GW_REQUEST_TERMINATE.CODE, 10), API_GW_REQUEST_TERMINATE.DESC);
                }
                else {
                    sipResponse = this.sipApi.makeResponse(sipRequest, parseInt(CALL_SERVICE_OK.CODE, 10), CALL_SERVICE_OK.DESC);
                }
            }
            else {
                sipResponse = this.sipApi.makeResponse(sipRequest, parseInt(apiGwResponse.status.code, 10), sipCodes[parseInt(apiGwResponse.status.code, 10)]);
            }
        }

        if(!__.has(sipResponse, 'headers.to.params.tag')){
            if (sipResponse.headers.to.params != undefined) {
                sipResponse.headers.to.params.tag = this.messageFactory.getTag();
            }
        }

        if(sipRequest.headers[HEADER_X_RESTCOMM_CALLSID]) {
            sipResponse.headers[HEADER_X_RESTCOMM_CALLSID] = sipRequest.headers[HEADER_X_RESTCOMM_CALLSID];
        }

        sipResponse.headers.contact = [{uri: this.messageFactory.getContactUri()}];
        this.logger.info({ msg: " =========> " + sipResponse.status + " on " + sipResponse.headers.cseq.method + " ", response: sipResponse });
        sipResponse = this.fixSipHeadersFormat(sipResponse, sipHeadersMapping);
        this.sipApi.send(sipResponse);

        if(sipResponse.headers.cseq.method == "INVITE" && sipResponse.status == 200){
            //this.retransmissions.setRetransmissionTimer(sipResponse);
            await this.setRetransmission(sipResponse);
        }

        return sipResponse;
    }

    public async setRetransmission(response) {
        if (this.sipApi.setRetransmission != undefined && process.env.SIP_RETRASMISSION == 'false') {
            await this.sipApi.setRetransmission(response);
         }
        else {
            await this.retransmissions.setRetransmissionTimer(response);
        }
    }

     public async sendRetryResponse (response: ResponseDTO) {
            this.logger.info({ msg: " ==== r =====> " + response.status + " on " + response.headers.cseq.method + " ", response: response });
            this.sipApi.send(response);
        }

    private fixSipHeadersFormat(obj: any, headersToFix: Map<string, string>):any {
        let headers: any = obj['headers']
        let fixedHeaders: any = {}

        Object.entries(headers)
            .forEach(([header, value]) => {
                if (headersToFix.has(header)) {
                    const fixedHeader = headersToFix.get(header)
                    fixedHeaders[fixedHeader]= value
                }else {
                    fixedHeaders[header]= value
                }
            })
        const fixedObject = { ...obj };
        fixedObject['headers'] = fixedHeaders
        return fixedObject;
    }

    public async cancelFlow(inviteReq: RequestDTO): Promise<void> {
        let cancelRequest = this.messageFactory.createCancel(inviteReq)
        this.logger.info({msg: "cancelRequest", cancelRequest: cancelRequest});

        this.send(cancelRequest, (err, sipResponse) => {
            if (err) {
                this.logger.error({action: "cancelFlow", err: err.msg ? err.msg : err, sipResponse: sipResponse})
                return
            } else if (sipResponse && sipResponse.status) { //expected 200 OK
                this.logger.info({msg: "cancelRequest", cancelResponse: sipResponse});
                return;
            } else {
                this.logger.info({msg: "cancelRequest", cancelResponse: 'no response for cancel'});
                return;
            }
        });
    }
}
