import sip from  "../../../test/lib/sip2.js";
import { SipDTO, RequestDTO, ResponseDTO } from "../dto/sipMessageDTO";
import { SipUtils } from "../dto/sip.utils";
import {BaseSimulator} from "../sip/base.simulator"


import {
    LOCAL_HOST,
    METHOD_ACK,
    METHOD_BYE,
    METHOD_INVITE,
    OK_RESPONSE,
    RESTCOM_PORT,
    WebTRCGW_PORT,
    SDP,
    A2P
} from "../constants";
import {errorCodes,SipHeaders} from "../factory";
import {Context} from "../context";
import {Session} from "../dto/sipSessionDTO";


export class RestcommSimulator extends BaseSimulator {

    protected utils: SipUtils

    constructor(protected port: number = Number(WebTRCGW_PORT)) {
        super(port)
    }


    protected context: Context = new Context()

    public setContext(ctx: Context) {
        this.context = ctx;
    }


    protected setsOnSipMsgReq(request: RequestDTO, context: Context): void {
        if (request.headers && request.headers["call-id"]) {
            const receivedMessages: Map<string, Array<RequestDTO>> = global["received"]
                ? global["received"]
                : new Map<string, Map<string, Array<RequestDTO>>>();
            if (receivedMessages.get(`${request.headers["call-id"]}_${request.method}_${request.headers.from.uri}`)) {
                receivedMessages.get(`${request.headers["call-id"]}_${request.method}_${request.headers.from.uri}`).push(request);
            } else {
                const RequestArray: Array<RequestDTO> = new Array<RequestDTO>();
                RequestArray.push(request);
                receivedMessages.set(`${request.headers["call-id"]}_${request.method}_${request.headers.from.uri}`, RequestArray);
            }
            global["received"] = receivedMessages;
        }

        let errorDescription: string = context.inviteResponse
        let errorCode: number | undefined = errorCodes.get(errorDescription)


        if (context.service !== A2P) {
            switch (request.method) {

                case METHOD_INVITE:
                    global.logger.info({
                        test: global.logger["context"].current,
                        step: this.setsOnSipMsgReq.name,
                        action: `Received INVITE: ${JSON.stringify(request)}`
                    });
                    this.inviteResponse(request, errorDescription, context, errorCode)
                    break;
                case METHOD_BYE:
                    global.logger.info({
                        test: global.logger["context"].current,
                        step: this.setsOnSipMsgReq.name,
                        action: `Received BYE: ${JSON.stringify(request)}`
                    });
                    this.byeResponse(request, errorDescription, context, errorCode)
                    break;
                case METHOD_ACK:
                    global.logger.info({
                        test: global.logger["context"].current,
                        step: this.setsOnSipMsgReq.name,
                        action: `Received ACK: ${JSON.stringify(request)}`
                    });
                    this.ackSaveData(request, context)
                    break;
            }
        }
    }




    protected inviteResponse(request: RequestDTO, errorDescription: string, context: Context, errorCode?: number) {
        const userId = `${request.headers.from.uri.split("@")[0].split(":")[1]}_${context.currentTest}`;
        const session = context.getSession(userId);
        session.to = request.headers.to;
        session.from = request.headers.from;
        session.destContact = request.headers.contact[0].uri;
        let rs;
        let rs180;
        var extension = {
            content: SDP,
            headers: {
                'Content-Type': "application/sdp"
            }
        };
        let tag = this.rstring();
        let contact = [{uri: request.uri}];
        session.toTag = tag;
        session.via = request.headers.via;

        rs180 = sip.makeResponse(request, 180, 'Ringing');
        rs180.headers.to.params.tag = tag;


        rs = (errorDescription == OK_RESPONSE) ? sip.makeResponse(request, errorCode, errorDescription, extension) : sip.makeResponse(request, errorCode, errorDescription)
        rs.headers.to.params.tag = tag;
        rs.headers.contact = contact;
        context.setSession(userId, session);

        global.logger.info({
            test: global.logger["context"].current,
            step: this.inviteResponse.name,
            action: `<======= Send 180 Ringing on ${request.method}: ${JSON.stringify(rs180)}`
        });
        sip.send(rs180);

        global.logger.info({
            test: global.logger["context"].current,
            step: this.inviteResponse.name,
            action: `<======= Send ${errorCode} ${errorDescription} on ${request.method}: ${JSON.stringify(rs)}`
        });
        sip.send(rs);


    }


}




