import sip from  "../../../test/lib/sip2.js";
import { SipDTO, RequestDTO, ResponseDTO } from "../dto/sipMessageDTO";
import { SipUtils } from "../dto/sip.utils";


import {
    LOCAL_HOST,
    METHOD_ACK,
    METHOD_BYE,
    METHOD_INVITE,
    OK_RESPONSE,
    RESTCOM_PORT,
    WebTRCGW_PORT,
    METHOD_INFO,
    SDP,
    A2P
} from "../constants";
import {errorCodes,SipHeaders} from "../factory";
import {Context} from "../context";
import {Session} from "../dto/sipSessionDTO";
import {BaseValidator} from "../validators/validator";
import {BaseSimulator} from "../sip/base.simulator"


export class McuSimulator extends  BaseSimulator{

    protected utils: SipUtils
    constructor(protected port: number = Number(WebTRCGW_PORT)) {
        super(port)
    }


    protected context : Context=new Context()

    public setContext(ctx: Context){
        this.context = ctx;
    }



    protected onSipMsgReq(request: RequestDTO): void {
        this.setsOnSipMsgReq(request, this.context)
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

        let errorDescription : string = context.inviteResponse
        let errorCode : number | undefined = errorCodes.get(errorDescription)


        if(context.service !== A2P){
            switch (request.method) {

                case METHOD_INVITE:
                    global.logger.info({
                        test:  global.logger["context"].current,
                        step: this.setsOnSipMsgReq.name,
                        action: `Received INVITE: ${JSON.stringify(request)}`
                    });
                    this.inviteResponse(request, errorDescription, context, errorCode)
                    break;
                case METHOD_BYE:
                    global.logger.info({
                        test:  global.logger["context"].current,
                        step: this.setsOnSipMsgReq.name,
                        action: `Received BYE: ${JSON.stringify(request)}`
                    });
                    this.byeResponse(request, errorDescription, context, errorCode)
                    break;
                case METHOD_ACK:
                    global.logger.info({
                        test:  global.logger["context"].current,
                        step: this.setsOnSipMsgReq.name,
                        action: `Received ACK: ${JSON.stringify(request)}`
                    });
                    this.ackSaveData(request, context)
                    break;
                case METHOD_INFO:
                    global.logger.info({
                        test:  global.logger["context"].current,
                        step: this.setsOnSipMsgReq.name,
                        action: `Received INFO: ${JSON.stringify(request)}`
                    });
                    this.infoResponse(request, errorDescription, context, errorCode)
                    break;
            }
        }
    }



    protected inviteResponse(request: RequestDTO, errorDescription: string, context: Context, errorCode?: number)
    {
        let rs100;
        rs100  = sip.makeResponse(request, 100, 'Trying');

        global.logger.info({
            test:  global.logger["context"].current,
            step: this.inviteResponse.name,
            action: `<======= Send 100 Trying on ${request.method}: ${JSON.stringify(rs100)}`
        });

        sip.send(rs100);




        const userId = `${request.headers.from.uri.split("@")[0].split(":")[1]}_${context.currentTest}`;
        const session = context.getSession(userId);
        //session.to = request.headers.to;
        //session.from = request.headers.from;
        //session.destContact = request.headers.contact[0].uri;

        session.meetingId=request.headers["p-meetingid"]
        let SDP;
        let meetingId = "11111";
        let roomId = "22222";
        let tag = "33333";


        if(session.meetingId && session.meetingId == "000"){
            SDP = 'v=0\r\no=user 1 1 IN IP4 0.0.0.0\r\ns=CallControl\r\nc=IN IP4 0.0.0.0\r\nt=0 0\r\nm=audio 9 RTP/AVP 0 8\r\na=inactive\r\n\r\n';
        }
        else {
            SDP = 'v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n';

        }

        let rs;

        var extension = {
            content: SDP,
            headers: {
                'Content-Type' : "application/sdp"
            }
        };



        rs = (errorDescription == OK_RESPONSE)? sip.makeResponse(request, errorCode, errorDescription, extension): sip.makeResponse(request, errorCode, errorDescription )
       rs.headers["P-MeetingId"] = meetingId;
            if(session.meetingId && session.meetingId == "000"){
                rs.headers.to.params.tag = roomId;
            }
            else {
                rs.headers.to.params.tag = tag;
                rs.headers["P-RoomId"] =roomId;
            }

        global.logger.info({
            test:  global.logger["context"].current,
            step: this.inviteResponse.name,
            action: `<======= Send ${errorCode} ${errorDescription} on ${request.method}: ${JSON.stringify(rs)}`
        });
        sip.send(rs);


    }



    protected infoResponse(request: RequestDTO,errorDescription:string,context:Context,errorCode?:number) {
        let rs;
        rs = sip.makeResponse(request,errorCode, errorDescription );

        global.logger.info({
            test:  global.logger["context"].current,
            step: this.infoResponse.name,
            action: `<======= Send ${errorCode} ${errorDescription} on ${request.method}: ${JSON.stringify(rs)}`
        });

        sip.send(rs);
    }


}

