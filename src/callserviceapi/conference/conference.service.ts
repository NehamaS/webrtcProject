import {forwardRef, Inject, Injectable} from "@nestjs/common";
import {CallService} from "../call.service";
import {ClientMsgHandler} from "../../client.msg.handler";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {ApiGwFormatDto} from "../../dto/apiGwFormatDto";
import {RequestDTO, ResponseDTO, Status} from "../sip/common/sipMessageDTO";
import {SipSession} from "../sip/common/sipSessionDTO";
import {
    MessageFactory,
    METHOD_ACK, METHOD_BYE, METHOD_INFO,
    HEADER_X_MEETINGID, HEADER_X_ROOMID, HEADER_X_RESTCOMM_CALLSID
} from "../sip/massagefactory/message.factory";
import {API_GW_REQUEST_TERMINATE} from "../../common/constants";
import {RestcommDbService} from "../../common/db/restcomm.db.service";
import {SipService} from "../sip/sip.service";
import {SipUtils} from "../sip/common/sip.utils";
import {MsmlFactory} from "../sip/massagefactory/msml.factory";

@Injectable()
export class ConferenceService implements CallService {

    constructor(
        @Inject(forwardRef(() => ClientMsgHandler)) private readonly clientMsgHandler: ClientMsgHandler,
        @Inject(forwardRef(() => SipService)) private readonly sipService: SipService,
        public readonly logger: MculoggerService,
        private readonly config: ConfigurationService,
        private readonly messageFactory: MessageFactory,
        private readonly msmlFactory: MsmlFactory,
        private readonly restcommDbService: RestcommDbService,
        private readonly utils: SipUtils){

        this.logger.debug("ConferenceService started");
    }

    //Incoming Requests from client
    public async makeCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> makeCall - conference", request: request});

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
            service: request.service,
            roomType: request.roomType
        }

        self.logger.info({msg: "setUserSession before response", sipSession: sipSession});
        await self.restcommDbService.setUserSession(sipSession);
        await this.restcommDbService.setSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString(), inviteReq);
        await self.sipService.send(inviteReq, async (err, sipResponse) => {

            if(!sipResponse) {
                response = self.buildResponse(request, null, err);
                await self.clientMsgHandler.joinConferenceAck(response);
                return;
            }

            response = self.buildResponse(request, sipResponse);
            if (sipResponse && sipResponse.status < 400) {

                sipSession.to = sipResponse.headers.to;
                sipSession.destContact = self.getContact(sipResponse.headers.contact, sipResponse.headers.to.uri);
                sipSession.roomId = sipResponse.headers[HEADER_X_ROOMID];
                sipSession.userId = sipResponse.headers.to.params.tag;

                self.logger.info({msg: "setUserSession after final response", sipSession: sipSession});
                await self.restcommDbService.setUserSession(sipSession);
                await this.restcommDbService.deleteSipRequest(sipResponse.headers["call-id"], sipResponse.headers.cseq.seq.toString());
                let ackReq: RequestDTO = self.messageFactory.createMessage(METHOD_ACK, sipSession);
                await self.sipService.send(ackReq, function () {
                });

                let roomSession: SipSession = await self.restcommDbService.getUserSession(sipSession.meetingId + "_" + sipSession.roomType);
                let infoBody: string = self.msmlFactory.join(sipSession.roomId, sipSession.userId);
                let infoReq: RequestDTO = self.messageFactory.createMessage(METHOD_INFO, roomSession, infoBody);
                await self.sipService.send(infoReq, async (err, sipInfoResponse) => {
                    if(!sipInfoResponse) {
                        response = self.buildResponse(request, null, err);
                        await self.clientMsgHandler.joinConferenceAck(response);
                        return;
                    }
                    if (sipInfoResponse && sipInfoResponse.status < 400) {
                        self.logger.info({msg: "clientHand <--------- joinConferenceAck - conference", response: response});
                        await self.clientMsgHandler.joinConferenceAck(response);   // TODO send response after INFO???????
                    }
                    else {
                        self.logger.info({msg: "clientHand <--------- joinConferenceAck (reject) - conference", response: response});
                        await self.clientMsgHandler.joinConferenceAck(response);
                    }
                });
            } else {
                self.logger.info({msg: "clientHand <--------- joinConferenceAck (reject) - conference", response: response});
                if (sipResponse.status === API_GW_REQUEST_TERMINATE.CODE) {
                    //in case of 487 Do nothing
                    return
                } else {
                    await self.clientMsgHandler.joinConferenceAck(response);
                }
                //Ack is sending automatically in case of Error
            }
            return;
        })
    }

    public async updateCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> updateCall - conference", request: request});
    }

    public async endCall(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> endCall - conference", request: request});
        //Checking whether Cancel or Bye have to be send - In case INVITE ifo in DB means there is no Final response and Cancel have to be send
        let inviteReq: RequestDTO = await this.restcommDbService.getSipRequest(request.callId, "1");
        if (inviteReq && inviteReq.method === 'INVITE') { //means Cancel should send
            //delete INVITE Info from DB when sending Cancel
            await this.restcommDbService.deleteSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString());
            await this.sipService.cancelFlow(inviteReq);
            return;
        }

        let response: ApiGwFormatDto;
        let userSession: SipSession = await this.restcommDbService.getUserSession(request.callId);
        let roomSession: SipSession = await this.restcommDbService.getUserSession(request.meetingId + "_" + request.roomType);
        if (userSession && roomSession) {
            roomSession.seqNumber++;
            this.logger.info({msg: "get userSession", userSession: userSession});
            this.logger.info({msg: "get roomSession", roomSession: userSession});
            let infoBody: string = this.msmlFactory.unjoin(userSession.roomId, userSession.userId);
            let infoReq: RequestDTO = this.messageFactory.createMessage(METHOD_INFO, roomSession, infoBody);
            this.logger.info({msg: "byeReq", infoReq: infoReq});

            const self = this;
            await self.sipService.send(infoReq, (err, sipResponse) => {
                if (sipResponse && sipResponse.status) {
                    response = self.buildResponse(request, sipResponse);
                } else {
                    response = self.buildResponse(request);
                    response.status = {
                        code: "500",
                        desc: "Response for BYE was not received"
                    };
                }
                self.logger.info({msg: "clientHand <--------- closeConnectionAck - conference", response: response});
                self.clientMsgHandler.closeConnectionAck(response);

                userSession.seqNumber++;
                this.logger.info({msg: "get userSession", userSession: userSession});
                let byeReq: RequestDTO = this.messageFactory.createMessage(METHOD_BYE, userSession);
                this.logger.info({msg: "byeReq", byeReq: byeReq});
                self.sipService.send(byeReq, function(err, sipByeResponse) {
                    if (!sipByeResponse) {
                        self.logger.error({msg: "response on BYE was not received"});
                    }
                });
                self.restcommDbService.deleteUserSession(request.callId);
            });
        } else {
            response = this.buildResponse(request);
            response.status = {
                code: "500",
                desc: "Failed to get sipUserSession or sipRoomSession from DB"
            };
            this.logger.info({msg: "clientHand <--------- closeConnectionAck (reject)- conference", response: response});
            await this.clientMsgHandler.closeConnectionAck(response);
            await this.restcommDbService.deleteUserSession(request.callId);
        }
    }

    // outgoing request from MCU
    public disconnectUser(request: RequestDTO): void {
        this.logger.info({msg: "clientHand <--------- disconnectUser - conference", request: request});
    }

    // incoming response from client
    public async endCallResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> endCallResponse - conference", apiGwResponse: apiGwResponse});

        //apiGwResponse.callId = this.handleCallId(apiGwResponse.callId);
       //await this.clientMsgHandler.endCallAck(apiGwResponse);

    }

    //methods for Conference  - rooms

    //Incoming Requests from client
    public async createRoom(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> createRoom - conference", request: request});

        let meeingId: string = this.createMeetingId();
        request.meetingId = meeingId;
        let inviteReq: RequestDTO = this.messageFactory.createRoomInvite(request);
        this.logger.info({msg: "inviteReq", inviteReq: inviteReq});
        let response: ApiGwFormatDto;
        const self = this;

        let sipSession: SipSession = {
            callId: inviteReq.headers['call-id'],
            from: inviteReq.headers.from,
            to: inviteReq.headers.to, //no to tag
            contact: inviteReq.headers.contact,
            meetingId: meeingId,
            destContact: null,
            seqNumber: inviteReq.headers.cseq.seq,
            service: request.service,
            roomType: request.roomType
        }

        await this.restcommDbService.setSipRequest(inviteReq.headers["call-id"], inviteReq.headers.cseq.seq.toString(), inviteReq);
        await self.sipService.send(inviteReq, async (err, sipResponse) => {

            if(!sipResponse) {
                response = self.buildResponse(request, null, err);
                await self.clientMsgHandler.createConferenceAck(response);
                return;
            }

            response = self.buildResponse(request, sipResponse);
            let ackReq: RequestDTO;

            if (sipResponse && sipResponse.status < 400) {
                await this.restcommDbService.deleteSipRequest(sipResponse.headers["call-id"], sipResponse.headers.cseq.seq.toString());

                //update sip Session
                sipSession.to = sipResponse.headers.to;
                sipSession.destContact = self.getContact(sipResponse.headers.contact, sipResponse.headers.to.uri);
                sipSession.roomId = sipResponse.headers.to.params.tag;
                self.logger.info({msg: "setRoomSession", sipSession: sipSession});
                await self.restcommDbService.setUserSession(sipSession);

                //send Ack
                ackReq = self.messageFactory.createMessage(METHOD_ACK, sipSession);
                await self.sipService.send(ackReq, function () {});

                //send Info
                let infoBody: string = self.msmlFactory.createConference(sipSession.roomId);
                let infoReq = self.messageFactory.createMessage(METHOD_INFO, sipSession, infoBody);

                await self.sipService.send(infoReq, async (err, sipInfoResponse) => {
                    if(!sipInfoResponse) {
                        self.logger.error({msg: "INFO create conf was not received"});
                        return;
                    }
                    self.logger.info({msg: "INFO create conf response was received"});
                    return;
                });

                //send response to ClientHandler
                response.meetingId = sipSession.meetingId;
                self.logger.info({msg: "clientHand <--------- createConferenceAck - conference", response: response});
                await self.clientMsgHandler.createConferenceAck(response);

            } else {
                self.logger.info({msg: "clientHand <--------- createConferenceAck (reject)- conference", response: response});
                if (sipResponse.status === API_GW_REQUEST_TERMINATE.CODE) {//Session Terminate as results of Cancel response
                    //in case of 487 Do nothing
                    return;
                } else {
                    await self.clientMsgHandler.createConferenceAck(response);
                }
                //Ack is sending automatically in case of Error
            }
            return;
        });
    }

    public async closeRoom(request: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> closeRoom - conference", request: request});
    }

    //Outgoing Request from MCU
    public async cleanRoom(request: RequestDTO): Promise<void> {
        this.logger.info({msg: "clientHand <--------- cleanRoom - conference", request: request});
    }


    //not relevant for ConferenceService
    //Incoming Responses
    public async ringingResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> ringingResponse - conference", apiGwResponse: apiGwResponse});
    }

    public async connectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> connectResponse - conference", apiGwResponse: apiGwResponse});
    }

    public async updateResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> updateResponse - conference", apiGwResponse: apiGwResponse});
    }

    public async rejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({msg: "clientHand ---------> rejectResponse - conference", apiGwResponse: apiGwResponse});
    }

    public async updateRejectResponse(apiGwResponse: ApiGwFormatDto): Promise<void> {
        this.logger.info({
            msg: "clientHand ---------> updateRejectResponse - conference",
            apiGwResponse: apiGwResponse
        });
    }

    //Outgoing Requests
    public async addUser(request: RequestDTO): Promise<void> {
        this.logger.info({msg: "One2OneService: addUser", request: request});
    }

    public updateUser(request: RequestDTO): void {
        this.logger.info({msg: "One2OneService: updateUser", request: request});
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

    private getContact(contactUri: any, toUri: any): string {
        if (contactUri && contactUri[0] && contactUri[0].uri) {
            let contact = contactUri[0].uri;
            if (contact.includes("@")) {
                return contact;
            } else {
                let contactDomainName: string = this.utils.getDomain(contact);
                return this.messageFactory.getMcuAddress();
            }
        } else {
            return this.messageFactory.getMcuAddress();
        }
    }

    private createMeetingId(): string {
        this.logger.debug({ msg: "function createMeetingId"});
        let meetingId: string = String(Date.now()) + String(Math.floor((Math.random() * 10000) + 1));
        this.logger.info({ msg:"createMeetingId", meetingId: meetingId});
        return meetingId;
    }
}

