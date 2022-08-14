import {forwardRef, Inject, Injectable} from '@nestjs/common';
import {MculoggerService} from 'service-infrastructure/common/logs/mculogger.service';
import {ApiGwFormatDto} from "../../dto/apiGwFormatDto";
import {MessageFactory, METHOD_ACK, METHOD_BYE, HEADER_X_RESTCOMM_CALLSID} from '../sip/massagefactory/message.factory';
import {SipService} from "../sip/sip.service";
import {RequestDTO, ResponseDTO, Status} from '../sip/common/sipMessageDTO';
import {SipSession} from '../sip/common/sipSessionDTO';
import {RestcommDbService} from '../../common/db/restcomm.db.service';
import {ClientMsgHandler} from '../../client.msg.handler';
import * as __ from 'lodash';
import {SipUtils} from "../sip/common/sip.utils";
import {API_GW_REQUEST_TERMINATE, JOIN_REASON, RECONNECT_REASON} from "../../common/constants";
import {DbService} from "../../common/db/db.service";
import {CallService} from "../call.service";

@Injectable()
export class RestcommService implements CallService {

    constructor(
        @Inject(forwardRef(() => SipService)) private readonly sipService: SipService,
        @Inject(forwardRef(() => ClientMsgHandler)) private readonly clientMsgHandler: ClientMsgHandler,
        public readonly logger: MculoggerService,
        private readonly messageFactory: MessageFactory,
        private readonly restcommDbService: RestcommDbService,
        private readonly dbService: DbService,
        private readonly utils: SipUtils) {

        this.logger.debug("RestComService started");
    }

    // Incoming Requests
    public async makeCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> makeCall", request: request});

        let inviteReq: RequestDTO = this.messageFactory.createInvite(request);
        this.logger.info({msg: "inviteReq", inviteReq: inviteReq});
        let response: ApiGwFormatDto;
        const self = this;

        let sipSession: SipSession = {
            callId: inviteReq.headers['call-id'],
            from: inviteReq.headers.from,
            to: inviteReq.headers.to, //no to tag
            contact: inviteReq.headers.contact,
            destContact: null,
            seqNumber: inviteReq.headers.cseq.seq,
            meetingId: request.meetingId,
            service: request.service
        }

        self.logger.info({msg: "setUserSession before response", sipSession: sipSession});
        await self.restcommDbService.setUserSession(sipSession)

        //Saving the INVITE request info  - in order enabling  build Cancel if terminate will send before final response
        await this.restcommDbService.setSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString(), inviteReq)
        self.sipService.send(inviteReq, async (err, sipResponse) => {

            if(!sipResponse) {
                response = self.buildResponse(request, null, err);
                self.clientMsgHandler.reject(response);
                return;
            }

            // provision sip response
            if (sipResponse && sipResponse.status < 200) {

                response = self.buildResponse(request, sipResponse);
                self.logger.info({msg: "clientHand <--------- ring", response: response});
                self.clientMsgHandler.ring(response);
            }
            // final sip response
            else {

                response = self.buildResponse(request, sipResponse);
                let ackReq: RequestDTO;

                if (sipResponse && sipResponse.status < 400) {

                    sipSession.to = sipResponse.headers.to
                    sipSession.destContact = self.getContact(sipResponse.headers.contact, sipResponse.headers.to.uri)
                    if(sipResponse.headers[HEADER_X_RESTCOMM_CALLSID]) {
                        sipSession.callSid = sipResponse.headers[HEADER_X_RESTCOMM_CALLSID];
                    }

                    self.logger.info({msg: "setUserSession after final response", sipSession: sipSession});
                    await self.restcommDbService.setUserSession(sipSession);

                    //delete invite request info from DB in case of 2xx response - since Cancel should not send in case of final response
                    // setImmediate(async () => await this.restcommDbService.deleteSipRequest(sipResponse.headers["call-id"], sipResponse.headers.cseq.seq.toString()))
                    await this.restcommDbService.deleteSipRequest(sipResponse.headers["call-id"], sipResponse.headers.cseq.seq.toString())

                    self.logger.info({msg: "clientHand <--------- connect", response: response});
                    self.clientMsgHandler.connect(response);

                    ackReq = self.messageFactory.createMessage(METHOD_ACK, sipSession);
                    self.sipService.send(ackReq, function () {
                    });

                } else {
                    self.logger.info({msg: "clientHand <--------- reject", response: response});
                    if (sipResponse.status === API_GW_REQUEST_TERMINATE.CODE) {//Session Terminate as results of Cancel response
                        //in case of 487 Do nothing
                        return
                    } else {
                        self.clientMsgHandler.reject(response);
                    }
                    //Ack is sending automatically in case of Error
                    //ackReq = self.messageFactory.createMessage(METHOD_ACK, sipSession, sipResponse.headers.via);
                }
                return;
            }
        });
    }

    public async updateCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> updateCall", request: request});
        let response: ApiGwFormatDto;

        let userSession: any = await this.restcommDbService.getUserSession(request.callId);
        if (userSession) {
            userSession.seqNumber++;
            await this.restcommDbService.setUserSession(userSession);
            let reInviteReq: RequestDTO = this.messageFactory.createReInvite(userSession, request.sdp);
            this.logger.info({msg: "reInviteReq", reInviteReq: reInviteReq});

            const self = this;
            self.sipService.send(reInviteReq, function (err, sipResponse) {
                if (sipResponse && sipResponse.status) {
                    response = self.buildResponse(request, sipResponse);
                    if (sipResponse.status == 180) {
                        self.logger.info({msg: "received 180 on reInvite"});
                    } else {
                        self.logger.info({msg: "clientHand <--------- updateAck", response: response});
                        self.clientMsgHandler.updateAck(response);

                        let ackReq: RequestDTO;
                        if (sipResponse.status == 200) {
                            ackReq = self.messageFactory.createMessage(METHOD_ACK, userSession);
                            self.sipService.send(ackReq, function () {
                            });
                            return;
                        }
                    }
                } else {
                    response = self.buildResponse(request);
                    response.status = {
                        code: "500",
                        desc: "Response for ReInvite was not received"
                    };

                    self.logger.info({msg: "clientHand <--------- updateAck", response: response});
                    self.clientMsgHandler.updateAck(response);
                    return;
                }
            });
        } else {
            response = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get sipUserSession from DB"
            };
            this.logger.info({msg: "clientHand <--------- updateAck", response: response});
            this.clientMsgHandler.updateAck(response);
            return;
        }
    }

    public async endCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> endCall", request: request});
        //Checking whether Cancel or Bye have to be send - In case INVITE ifo in DB means there is no Final response and Cancel have to be send
        let inviteReq: RequestDTO = await this.restcommDbService.getSipRequest(request.callId, "1")
        if (inviteReq && inviteReq.method === 'INVITE') { //means Cancel should send
            //delete INVITE Info from DB when sending Cancel
            await this.restcommDbService.deleteSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString())
            await this.sipService.cancelFlow(inviteReq);
            return
        }

        let response: ApiGwFormatDto;

        let userSession: SipSession = await this.restcommDbService.getUserSession(request.callId);
        if (userSession) {
            userSession.seqNumber++;
            this.logger.info({msg: "get userSession", userSession: userSession});
            let byeReq: RequestDTO = this.messageFactory.createMessage(METHOD_BYE, userSession);
            this.logger.info({msg: "byeReq", byeReq: byeReq});

            const self = this;
            self.sipService.send(byeReq, (err, sipResponse) => {
                if (sipResponse && sipResponse.status) {
                    response = self.buildResponse(request, sipResponse);
                } else {
                    response = self.buildResponse(request);
                    response.status = {
                        code: "500",
                        desc: "Response for BYE was not received"
                    };
                }
                self.logger.info({msg: "clientHand <--------- endCallAck", response: response});
                self.clientMsgHandler.endCallAck(response);
                self.restcommDbService.deleteUserSession(request.callId);
            });
        } else {
            response = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get sipUserSession from DB"
            };
            this.logger.info({msg: "clientHand <--------- endCallAck", response: response});
            this.clientMsgHandler.endCallAck(response);
            this.restcommDbService.deleteUserSession(request.callId);

        }
    }

    public async createRoom(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> createRoom", request: request});
    }

    public async closeRoom(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> closeRoom", request: request});
    }


        // Outgoing Requests
    public async addUser(request: RequestDTO): Promise<void> {
        this.logger.info({msg: "RestComService: addUser", request: request});

        let requestDto: ApiGwFormatDto = this.buildRequest(request);
        requestDto.reason = JOIN_REASON;

        let userSession: SipSession = this.buildSipSession(request, false);
        userSession.seqNumber = 0; // to manage local CSEq

        // set to DB userSession and INVITE Request
        await this.restcommDbService.setUserSession(userSession);
        await this.restcommDbService.setSipRequest(requestDto.callId, requestDto.sequence.toString(), request);

        this.logger.info({msg: "clientHand <--------- call", requestDto: requestDto});
        await this.clientMsgHandler.call(requestDto);
    }

    public updateUser(request: RequestDTO): void {
        this.logger.info({msg: "RestComService: updateUser", request: request});

        let requestDto: ApiGwFormatDto = this.buildRequest(request);
        requestDto.reason = RECONNECT_REASON;

        // set to DB reINVITE Request
        this.restcommDbService.setSipRequest(requestDto.callId, requestDto.sequence.toString(), request);

        this.logger.info({msg: "clientHand <--------- update", requestDto: requestDto});
        this.clientMsgHandler.update(requestDto);
    }

    public async disconnectUser(request: RequestDTO): Promise<void> {
        this.logger.info({msg: "disconnectUser", request: request});

        let requestDto: ApiGwFormatDto = this.buildRequest(request);

        // set to DB BYE Request and delete UserSession
        // this.restcommDbService.setSipRequest(requestDto.callId, requestDto.sequence.toString(), request);

        // add Cancel support
        if (request.method === 'BYE') {
            Promise.all([this.restcommDbService.deleteUserSession(request.headers['call-id']), this.restcommDbService.deleteSipRequest(request.headers['call-id'], request.headers.cseq.seq.toString())])
                .catch(e => {
                    this.logger.error({action: 'disconnectUser', error: e.message ? e.message : e, request: request})
                })
        }

        // deleteUserSession  & deleteSipRequest for Cancel done in endCallResponse()

        this.logger.info({msg: "clientHand <--------- disconnect", requestDto: requestDto});
        await this.clientMsgHandler.disconnect(requestDto);
    }

    // Outgoing Requests
    public async cleanRoom(request: RequestDTO): Promise<void> {
        this.logger.info({msg: "RestComService: cleanRoom", request: request});
    }


    // Incoming Responses
    public async ringingResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "RestComService: ringingResponse"});
        this.logger.info({msg: "clientHand ---------> ringingResponse", apiGwResponse: apiGwResponse});

        let inviteRequest: RequestDTO = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (inviteRequest) {
            let sipRsp = await this.sipService.buildAndSendResponse(inviteRequest, apiGwResponse);

            // update tag for TO header
            let userSession: any = await this.restcommDbService.getUserSession(apiGwResponse.callId);
            if (userSession) {
                userSession.to = sipRsp.headers.to;
                await this.restcommDbService.setUserSession(userSession);
            }
        } else {
            this.logger.error({
                msg: "ringingResponse failed get inviteRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
        }
    }

    private sendEndCall(request: ApiGwFormatDto): void {
        this.logger.info({msg: "RestComService: sendEndCall"});

        this.logger.info({msg: "******************** RestComService: sendEndCall", method: request.method});

        if (request.method && request.method == "call") {
            let response: ApiGwFormatDto = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get Sip Request from DB"
            };

            this.logger.info({msg: "clientHand <--------- endCall", response: response});
            this.clientMsgHandler.disconnect(response);
            this.restcommDbService.deleteUserSession(request.callId);
        }
    }

    public async connectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "RestComService: connectResponse"});
        this.logger.info({msg: "clientHand ---------> connectResponse", apiGwResponse: apiGwResponse});

        await this.sendAnswer(apiGwResponse);
    }

    public async updateResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "RestComService: updateResponse"});
        this.logger.info({msg: "clientHand ---------> updateResponse", apiGwResponse: apiGwResponse});

        await this.sendAnswer(apiGwResponse);
    }

    private async sendAnswer(apiGwResponse: ApiGwFormatDto): Promise<void> {
        let inviteRequest: RequestDTO = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (inviteRequest) {
            let sipRsp = await this.sipService.buildAndSendResponse(inviteRequest, apiGwResponse);
            //await this.restcommDbService.setSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString(), inviteRequest);

            // update tag to header
            let userSession: any = await this.restcommDbService.getUserSession(apiGwResponse.callId);
            if (userSession) {
                userSession.from = sipRsp.headers.to;
                await this.restcommDbService.setUserSession(userSession);
            }
        } else {
            this.logger.error({
                msg: "connectResponse failed get inviteRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
            this.sendEndCall(apiGwResponse);
        }

        await this.restcommDbService.deleteSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
    }

    public async rejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "RestComService: rejectResponse"});
        this.logger.info({msg: "clientHand ---------> rejectResponse", apiGwResponse: apiGwResponse});

        await this.handleRejectResponse(apiGwResponse);
    }

    public async updateRejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "RestComService: updateRejectResponse"});
        this.logger.info({msg: "clientHand ---------> updateRejectResponse", apiGwResponse: apiGwResponse});

        await this.handleRejectResponse(apiGwResponse);
    }

    private async handleRejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        let inviteRequest: RequestDTO = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (inviteRequest) {
            await this.sipService.buildAndSendResponse(inviteRequest, apiGwResponse);
            this.restcommDbService.deleteSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
            if (!__.has(inviteRequest, 'headers.to.params.tag')) {
                this.restcommDbService.deleteUserSession(apiGwResponse.callId);
            }
        } else {
            this.logger.error({
                msg: "rejectResponse failed get inviteRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
            this.sendEndCall(apiGwResponse);
        }
    }

    public async endCallResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "RestComService: endCallResponse", response: apiGwResponse});
        this.logger.info({msg: "clientHand ---------> endCallResponse", apiGwResponse: apiGwResponse});

        let byeRequest: RequestDTO = await this.restcommDbService.getSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
        if (byeRequest) {
            // Cancel for incoming call
            let sipRsp = await this.sipService.buildAndSendResponse(byeRequest, apiGwResponse);
            this.restcommDbService.deleteSipRequest(apiGwResponse.callId, apiGwResponse.sequence.toString());
            this.restcommDbService.deleteUserSession(apiGwResponse.callId);

            if (sipRsp && sipRsp.status == 487) {
                await this.restcommDbService.deleteSipRequest(byeRequest.headers['call-id'], byeRequest.headers.cseq.seq.toString())
            }
        } else {
            this.logger.error({
                msg: "endCallResponse failed get byeRequest",
                callId: apiGwResponse.callId,
                sequence: apiGwResponse.sequence
            });
            this.restcommDbService.deleteUserSession(apiGwResponse.callId);
        }
    }

    private buildResponse(request: ApiGwFormatDto, sipResponse?: ResponseDTO, status?: Status): ApiGwFormatDto {

        let response: ApiGwFormatDto = {
            caller: request.caller,
            callee: request.callee,
            callId: request.callId,
            sequence: request.sequence,
            accessToken: request.accessToken
        };

        if (request.service) {
            response.service = request.service;
        }
        if (request.meetingId) {
            response.meetingId = request.meetingId;
        }

        if (sipResponse && sipResponse.content) {
            response.sdp = sipResponse.content;
        }
        if (sipResponse || status) {
            let errorDesc = sipResponse ? sipResponse : status;

            let statusValue = {
                code: errorDesc.status.toString(),
                desc: errorDesc.reason
            }
            response.status = statusValue;
        }

        this.logger.info({msg: "buildResponse: ApiGwFormatDTO", response: response});

        return response;
    }

    private buildRequest(request: RequestDTO): ApiGwFormatDto { //this methods used by request from restcomm

        let apiGwRequest: ApiGwFormatDto = {
            callee: this.utils.getDomain(request.headers.to.uri),
            caller: (request.method === "BYE" || request.method === "INVITE" || request.method === "CANCEL") ? this.buildCaller(request.uri, request.headers.from.uri) : this.utils.getDomain(request.headers.from.uri),
            // caller: this.utils.getDomain(request.headers.from.uri),
            callId: request.headers["call-id"],
            sequence: request.headers.cseq.seq ? request.headers.cseq.seq.toString() : undefined,
            /*accessToken is not passed from RC towards rtc gw, it is passed in open ws connection*/
            service: request.headers["x-service-type"] ? request.headers["x-service-type"] : "A2P"
        };

        if (request && request.content) {
            apiGwRequest.sdp = request.content;
        }

        if (request && request.headers["x-meetingid"]) {
            apiGwRequest.meetingId = request.headers["x-meetingid"];
        }
        else {
            apiGwRequest.meetingId = request.headers["call-id"];
        }

        return apiGwRequest;
    }

    private buildCaller(rUri, toUri): string { //return the user part from RURI and Domain from to uri header
        let reqUri: string = this.utils.getUserPart(rUri)
        let toDomain: string = toUri.includes("@") ? toUri.split("@")[1] : this.utils.getDomain(toUri)
        return `${reqUri}@${toDomain}`
    }

    private buildSipSession(sipMessage: RequestDTO | ResponseDTO, callFromClient: boolean): SipSession {

        let sipSession: SipSession = {
            callId: sipMessage.headers['call-id'],
            from: callFromClient ? sipMessage.headers.from : sipMessage.headers.to,
            to: callFromClient ? sipMessage.headers.to : sipMessage.headers.from,
            destContact: this.getContact(sipMessage.headers.contact, sipMessage.headers.to.uri),
            seqNumber: sipMessage.headers.cseq.seq
        }

        if(sipMessage.headers[HEADER_X_RESTCOMM_CALLSID]) {
            sipSession.callSid = sipMessage.headers[HEADER_X_RESTCOMM_CALLSID];
        }
        return sipSession;
    }

    private getContact(contactUri: any, toUri: any): string {
        if (contactUri && contactUri[0] && contactUri[0].uri) {
            let contact = contactUri[0].uri;
            if (contact.includes("@")) {
                return contact;
            } else {
                let contactDomainName: string = this.utils.getDomain(contact);
                return this.messageFactory.getRequestUri(toUri, contactDomainName);
            }
        } else {
            return this.messageFactory.getRestcomServerAddress(toUri);
        }
    }
}
