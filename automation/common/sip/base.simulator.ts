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
    SDP,
    A2P
} from "../constants";
import {errorCodes,SipHeaders} from "../factory";
import {Context} from "../context";
import {Session} from "../dto/sipSessionDTO";


export class BaseSimulator {

    protected utils: SipUtils
    constructor(protected port: number = Number(WebTRCGW_PORT)) {
        this.utils = new SipUtils();
    }


    protected context : Context=new Context()

    public setContext(ctx: Context){
        this.context = ctx;
    }



    protected onSipMsgReq(request: RequestDTO): void {
       this.setsOnSipMsgReq(request, this.context)
    }


    protected setsOnSipMsgReq(request: RequestDTO, context: Context): void {

    }


    public start = (port?: number) => {
        const options: any = {
            protocol: "UDP",
            address: LOCAL_HOST,
            port: port? port: RESTCOM_PORT,
        };
        global.logger.info({
            test:  global.logger["context"].current,
            step: this.start.name,
            action: "Start restcomm SipClient", data: options
        });
        sip.start(options, this.onSipMsgReq.bind(this));
    };


    public stop = () => {
        sip.stop();
    };

    protected sipResposneHandler<T extends ResponseDTO>(response: T, errorcase?: boolean): T | any {
        try {
        switch (response.status) {
            case 100: {
                global.logger.info({
                    test:  global.logger["context"].current,
                    step: this.sipResposneHandler.name,
                    action: "sip:send, response 100", data: response
                });
                break;
            }
            case 180: {
                global.logger.info({
                    test:  global.logger["context"].current,
                    step: this.sipResposneHandler.name,
                    action: "sip:send, response 180", data: response
                });
                return response;
            }
            case 183: {
                global.logger.info({
                    test:  global.logger["context"].current,
                    step: this.sipResposneHandler.name,
                    action: "sip:send, response 183", data: response
                });
                return response;
            }
            case 200: {
                global.logger.info({
                    test:  global.logger["context"].current,
                    step:this.sipResposneHandler.name,
                    action: "sip:send, response 200", data: response
                });
                this.context.from = response.headers.from
                this.context.to = response.headers.to
                this.context.destContact = response.headers.contact
                this.context.callId = response.headers["call-id"]
                return response;
            }
            default: {
                if(errorcase) {
                    this.context.errorCaseResponse.status = response.status;
                    this.context.errorCaseResponse.reason = response.reason;
                    break;
                }
                if (JSON.stringify(response.headers.cseq).includes("ACK")) {
                    global.logger.info({
                        test:  global.logger["context"].current,
                        step: this.sipResposneHandler.name,
                        action: "ACK response"
                    });
                    return {};
                }
                const errorMsg: string = response.headers[SipHeaders.PMAV_ERROR.toLowerCase()]
                    ? response.headers[SipHeaders.PMAV_ERROR.toLowerCase()]
                    : "N/A";
                const sipError = {
                    status: response.status,
                    error: {reason: response.reason ? response.reason : "N/A", description: errorMsg},
                    "call-id": response.headers[SipHeaders.CALL_ID],
                    user: response.headers["from"] ? response.headers["from"]["uri"] : "N/A",
                };
                global.logger.error({
                    test:  global.logger["context"].current,
                    step:this.sipResposneHandler.name,
                    error: sipError
                });
                const error: Error = new Error(
                    `Status: ${sipError.status}, Reason: [${sipError.error.reason}, ${
                        sipError.error.description
                    }], Call-ID: ${sipError[SipHeaders.CALL_ID]}, user: ${sipError.user}`
                );
                error["response"] = response;
                throw error;
            }
        }
        } catch (error) {
            global.logger.error({
                test:  global.logger["context"].current,
                step: this.sipResposneHandler.name,
                error: error
            })
        }
    }

    public sendInvite(srcUser: string, destUser: string, context: Context) {
        const errorCase: boolean = context.errorCase;
        const userId = `${srcUser}_${context.currentTest}`;
        const session: Session = context.getSession(userId);
        let inviteReq : RequestDTO= {
            method: METHOD_INVITE,
            uri: `sip:${srcUser}@${LOCAL_HOST}:${WebTRCGW_PORT}`,
            version: "2.0",
            headers: {
                to: {uri: `sip:${destUser}@${context.cpaasAppUrl}`},
                from: {uri: `sip:${srcUser}@${context.cpaasAppUrl}`, params: {tag: `${session.callId}222`}},
                "call-id": session.callId,
                cseq: {method: METHOD_INVITE, seq: 1},
                contact: [{uri: `sip:${srcUser}@${context.cpaasAppUrl}`}],
                via: [],
                "Content-Type": 'application/sdp',
                "X-RestComm-OrganizationSid": "string",
                "X-RestComm-AccountSid": "string",
                "X-RestComm-ApplicationSid":"string"
            },
            content: SDP
        }
        this.send(inviteReq, errorCase);
    };

    public sendAck(srcUser: string, destUser: string, context: Context) {
        try {
            let ackReq : RequestDTO = {
                method: METHOD_ACK,
                uri: `sip:${destUser}@${LOCAL_HOST}:${WebTRCGW_PORT}`,
                version: "2.0",
                headers: {
                    to: {uri: context.to.uri, params: context.to.params},
                    from: {uri: context.from.uri, params: context.from.params},
                    "call-id": context.callId,
                    cseq: {method: METHOD_ACK, seq: 1},
                    contact: [{uri: `sip:${srcUser}@${context.cpaasAppUrl}`}],
                    via: []
                }
            }
            sip.send(ackReq);
        } catch (e) {
            global.logger.error({
                test:  global.logger["context"].current,
                step: this.sendAck.name,
                error: e})
        }
    };

    protected inviteResponse(request: RequestDTO, errorDescription: string, context: Context, errorCode?: number)
    {

    }


    protected byeResponse(request: RequestDTO,errorDescription:string,context:Context,errorCode?:number) {
        let rs;
        rs = sip.makeResponse(request,errorCode, errorDescription );

        global.logger.info({
            test:  global.logger["context"].current,
            step: this.byeResponse.name,
            action: `<======= Send ${errorCode} ${errorDescription} on ${request.method}: ${JSON.stringify(rs)}`
        });

        sip.send(rs);
    }

    protected ackSaveData(request: RequestDTO, context: Context) {
        const userId = `${request.headers.from.uri}_${context.currentTest}`;
        const session = context.getSession(userId);
        session.to = request.headers.to;
        session.from = request.headers.from;
        session.destContact = request.headers.contact[0].uri;
    }


    public async send<T extends ResponseDTO>(sipRequest: RequestDTO, errorCase?: boolean): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            global.logger.info({ action: "sip:send, request", data: sipRequest });
            sip.send(sipRequest, (response: T) => {
                try {
                    const result: any = this.sipResposneHandler(response, errorCase);
                    if (result) {
                        if (Object.keys(result).length == 0) {
                            return resolve(result);
                        }
                        return resolve(<T>result);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
    }

    protected parseUri = (uri: string) => {
        return sip.parseUri(uri);
    };

    protected getPort(): number {
        return this.port;
    }


    protected rstring()
    {
        return Math.floor(Math.random() * 1e6).toString();
    }
}

