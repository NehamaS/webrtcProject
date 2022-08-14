import {Context, LoadContext} from "../context";
import {RestcomMessageFactory} from "../messages/restcom.message.factory";
import {WsRequestDto} from "../dto/ws.request.dto";
import {initUtils} from "../common.steps.utils";
import {v4 as uuidv4} from 'uuid';

import {IncomingRequestValidate, IncomingResponseValidate} from "../validators/restcomm.validator";
import {
    A2P,
    CALL_SERVICE_TYPE,
    COGNITO_DETAILS_ENV,
    LOCAL_HOST,
    METHOD_ACK,
    METHOD_BYE,
    METHOD_INVITE,
    OK_RESPONSE,
    REGISTER_ACTION_ACK,
    COMPONENT_CPASS
} from "../constants";
import {CognitoDetails, Participant, Session, SystemParams, TestParams} from "../dto/sipSessionDTO";
import {RestcommSimulator} from "../sip/restcomm.simulator";
import {ApiFactory} from "../api/api.factory";
import {actionTypeToStr, rstring, strToAction, wait} from "../utils";
import {ActionType} from "../messages/factory";
import {HttpValidator} from "../validators/http.validator";
import {HttpClientServer} from "../http-client/http-client.server";
import {WsService} from "../ws/ws.service";
import {RestApi} from "../api/rest.api";
import {WsApi} from "../api/ws.api";
import {CognitoService} from "../cognito/cognito.service"
import request = require("supertest");
import WebSocket = require('ws');
import {McuSimulator} from "../sip/mcu.simulator";


let wsClient: WebSocket;

initUtils();


const validator: HttpValidator = new HttpValidator();

export const openWsClient = (given: any, context: Context, wsSrv: WsService) => {
    given(/(.*) open ws connection/, async (userName: string) => {
        const session: Session = new Session();

        const env: Array<CognitoDetails> = COGNITO_DETAILS_ENV.filter(
            env => env.name == process.env.CPAAS_APP_URL
        );

        session.cognito = env[0].cognito
        session.restcommApplication = env[0].restcommApplication
        session.userId = `${userName}@${context.cpaasAppUrl}`;
        session.deviceId = rstring();


        let cognitoSrv: CognitoService = new CognitoService();
        session.token = await cognitoSrv.cognitoAuth(session)

        global.logger.debug({
            test: global.logger["context"].currentTest,
            step: openWsClient.name,
            action: `The tokenID is: ${JSON.stringify(session.token)}`
        });

        let options: WebSocket.ClientOptions = {
            headers: {
                "Authorization": `Bearer ${session.token.idToken}`
            }
        };

        session.wsSrv = wsSrv;

        global.logger.info({
            test: global.logger["context"].current,
            step: openWsClient.name,
            action: "Open WebSocket client"
        });
        await wsSrv.createClient(userName, options, context);
        wsClient = wsSrv.getClient(userName);
        session.wsClient = wsClient;
        const userId = `${userName}_${context.currentTest}`;
        context.setSession(userId, session);
    });
}

export const closeWsClient = (given: any, context: Context, sipClient?: RestcommSimulator) => {
    given(/(.*) close ws connection/, async (userName: string) => {
        const userId = `${userName}_${context.currentTest}`;
        const session = context.getSession(userId);

        global.logger.info({
            test: global.logger["context"].current,
            step: closeWsClient.name,
            action: "Close WebSocket client"
        });
        session.wsClient.terminate();
        //allow ws to close normally
        await wait(50);
    });
}

export const openRoom =  (and, context: Context, app?: HttpClientServer) => {
    and(/(.*) Create video conference/, async (srcUser: string) => {
        const participant: Participant = <Participant>{
            srcUser:srcUser,
            destUser:"MCU"
        };
        try {

            global.logger.info({
                test:  global.logger["context"].current,
                step:openRoom.name,
                action: `${srcUser} create video conference`
            });
            await buildAndSendRequest(context, ActionType.OPEN_ROOM, participant);

        } catch (e) {
                global.logger.error({
                    test:  global.logger["context"].current,
                    step:openRoom.name,
                    error: e.message
                });
                console.assert(false, `[${context.current}] openRoom error ${e.message}`);
                expect(e).handleException();

        }
    });
}

export const systemSetup = (given: any, context: Context, sipClient?: RestcommSimulator|McuSimulator) => {
    given(/system params:/, async (sysParamsList: Array<SystemParams>) => {
        sysParamsList.map(async (sysParams: SystemParams) => {
            global.logger.context = context
            context.url = sysParams.feature == "component" ? LOCAL_HOST : process.env.CPAAS_HOME;
            context.cpaasAppUrl = process.env.CPAAS_APP_URL ? process.env.CPAAS_APP_URL : `mavenir.com`;
            context.featureType = sysParams.feature;
            context.service = sysParams.service ? sysParams.service : "P2A";


            global.logger.info({
                test: global.logger["context"].current,
                step: openWsClient.name,
                action: `Set context with: cpaasAppUrl- ${context.cpaasAppUrl}, featureType- ${context.featureType}, service- ${context.service}`
            });
            let api: ApiFactory;
            switch (context.featureType) {
                case "component":
                    api = new RestApi();
                    sipClient.setContext(context);
                    break;
                case "e2e":
                    api = new WsApi();
                    break;
            }
            context.api = api;
        })
    });
};

export const testSetup = (given: any, context: Context) => {
    given(/restComm params:/, async (testParamsList: Array<TestParams>) => {
          testParamsList.map(async (testParams: TestParams) => {
              context.inviteTimeout = Number(testParams.timeOut);
              context.inviteResponse = testParams.restcommRes? testParams.restcommRes: "";
              context.errorCase = testParams.errorCase? testParams.errorCase: false;
          })
    });
};

export const basicRegister = async (srcUser: string, destUser: string, deviceType: "ANDROID" | "IOS" | "WEB_BROWSER" | "WEB_DESKTOP", context: Context, port: number, app?: HttpClientServer | WebSocket, loadContext?: LoadContext) => {
        try {
            const userId = `${srcUser}_${context.currentTest}`;
            let session = context.getSession(userId);
            if(!session) {
              session = new Session();
            }
            const api = context.api;
            global.logger.info({
                test:  global.logger["context"].current,
                step:basicRegister.name,
                action: `${srcUser} send register request with device ${deviceType}`
            });
            const connectionId = rstring(port);
            const callId = context.callId? context.callId: rstring();
            const deviceId = session.deviceId? session.deviceId: rstring();
            session.deviceType = deviceType
            session.AppSid = destUser;
            session.srcUser = srcUser;
            session.destUser = "GW";
            session.messageId = "0";
            session.deviceId = deviceId;
            session.callId = callId;
            session.connectionId = connectionId;
            session.PNSToken = uuidv4();
            const httpRes: any = await api.buildAndSendRequest(ActionType.REGISTER, session, context);
            if (context.featureType == "component") {

                global.logger.debug({
                    test:  global.logger["context"].current,
                    step:basicRegister.name,
                    action: `register http response <====== ${JSON.stringify(httpRes)}`
                });
                session.createResponses.Register = <WsRequestDto>{
                    connectionId: session.connectionId, dto: {
                        callId: httpRes.request._data.dto.callId,
                        messageId: httpRes.request._data.dto.messageId,
                        source: httpRes.request._data.dto.source,
                        destination: httpRes.request._data.dto.destination,
                        ts: httpRes.request._data.dto.ts,
                        type: httpRes.request._data.dto.type,
                        body: {
                            protocolVersion: httpRes.request._data.dto.body.protocolVersion,
                            clientVersion: httpRes.request._data.dto.body.clientVersion,
                            appSid: httpRes.request._data.dto.body.appSid,
                            deviceId: httpRes.request._data.dto.body.deviceId,
                            PNSToken: httpRes.request._data.dto.body.PNSToken
                        }
                    }
                };

                global.logger.debug({
                    test:  global.logger["context"].current,
                    step:basicRegister.name,
                    action: `register response <====== ${JSON.stringify(session.createResponses.Register)}`
                });
            }
            context.callId = session.callId;
            context.setSession(userId, session);
            if (app instanceof HttpClientServer) {
                app.setContext(context);
            }
            await wait(3000);
            if(loadContext)
                loadContext.succeedsResult++
        } catch (e) {
            if(loadContext)
                loadContext.failuresResult++
            else {
                global.logger.error({
                    test:  global.logger["context"].current,
                    step:basicRegister.name,
                    error: e.message
                });
                console.assert(false, `[${context.current}] register, error ${e.message}`);
                expect(e).handleException();
            }
        }
};

export const register = (and, context: Context, port?: number, app?: HttpClientServer | WebSocket) => {
    and(/(.*) send register to (.*) with (.*)/, async (srcUser: string, destUser: string, deviceType:  "ANDROID" | "IOS" | "WEB_BROWSER" | "WEB_DESKTOP") => {
    await basicRegister(srcUser, destUser,deviceType, context, port, app)
    });
};

export const unregister = (and, context: Context, app?: HttpClientServer) => {
    and(/(.*) send unregister/, async (srcUser: string) => {
        try {
            const userId = `${srcUser}_${context.currentTest}`;
            let session = context.getSession(userId);
            const api = context.api;
            global.logger.info({
                test: global.logger["context"].current,
                step: unregister.name,
                action: `${srcUser} send unregister`
            });
            session.AppSid = session.destUser;
            session.srcUser = srcUser;
            session.destUser = "GW";
            session.messageId = (parseInt(session.messageId) + 1).toString();
            session.callId = context.callId;
            const httpRes: any = await api.buildAndSendRequest(ActionType.UNREGISTER, session, context);
            if (context.featureType == "component") {

                global.logger.debug({
                    test: global.logger["context"].current,
                    step: unregister.name,
                    action: `unregister http response <====== ${JSON.stringify(httpRes)}`
                });
                session.createResponses.Unregister = <WsRequestDto>{
                    connectionId: session.connectionId, dto: {
                        callId: httpRes.request._data.dto.callId,
                        messageId: httpRes.request._data.dto.messageId,
                        source: httpRes.request._data.dto.source,
                        destination: httpRes.request._data.dto.destination,
                        ts: httpRes.request._data.dto.ts,
                        type: httpRes.request._data.dto.type,
                        body: {
                            protocolVersion: httpRes.request._data.dto.body.protocolVersion,
                            clientVersion: httpRes.request._data.dto.body.clientVersion,
                            appSid: httpRes.request._data.dto.body.appSid,
                            deviceId: httpRes.request._data.dto.body.deviceId,
                            PNSToken: httpRes.request._data.dto.body.PNSToken
                        }
                    }
                };

                global.logger.debug({
                    test: global.logger["context"].current,
                    step: unregister.name,
                    action: `unregister response <====== ${JSON.stringify(session.createResponses.Register)}`
                });
            }
            context.callId = session.callId;
            context.setSession(userId, session);
            if (app instanceof HttpClientServer) {
                app.setContext(context);
            }
            await wait(context.inviteTimeout * 1000);
        } catch (e) {
            global.logger.error({
                test: global.logger["context"].current,
                step: unregister.name,
                error: e.message
            });
            console.assert(false, `[${context.current}] unregister, error ${e.message}`);
            expect(e).handleException();
        }
    });
};

export const callStart = (and, context: Context, app?: HttpClientServer) => {
    and(/(.*) starts call with (.*)/,
        async (srcUser, destUser) => {
        await basicCallStart(srcUser,destUser,context,app);
        }
    );
};


export const mcuCallStart = (and, context: Context, app?: HttpClientServer) => {
    and(/(.*) starts call and invite (.*)/,
        async (srcUser, destUser) => {
            const participant: Participant = <Participant>{
                srcUser:srcUser,
                destUser:destUser
            };
            try {

                global.logger.info({
                    test: global.logger["context"].current,
                    step: mcuCallStart.name,
                    action: `${srcUser} start call request`
                });
                await buildAndSendRequest(context, ActionType.START_MCU_CALL, participant);

            } catch (e) {
                    global.logger.error({
                        test: global.logger["context"].current,
                        step: mcuCallStart.name,
                        error: e.message
                    });
                    console.assert(false, `[${context.current}] callStart error ${e.message}`);
                    expect(e).handleException();

            }
        }
    );
};

export const basicCallStart = async (srcUser: string, destUser: string, context: Context, app: HttpClientServer, loadContext?: LoadContext) => {
    const participant: Participant = <Participant>{
        srcUser:srcUser,
        destUser:destUser
    };
    try {

        global.logger.info({
            test: global.logger["context"].current,
            step: basicCallStart.name,
            action: `${srcUser} start call request`
        });
        await buildAndSendRequest(context, ActionType.START_CALL, participant);
        if (loadContext)
            loadContext.succeedsResult++

    } catch (e) {
        if (loadContext)
            loadContext.failuresResult++
        else {
            global.logger.error({
                test: global.logger["context"].current,
                step: basicCallStart.name,
                error: e.message
            });
            console.assert(false, `[${context.current}] callStart error ${e.message}`);
            expect(e).handleException();
        }
    }
};

export const sendRinging = (and, context: Context) => {
    and(/(.*) send Ringing to (.*)/, async (srcUser, destUser) => {
        const participant: Participant = <Participant>{
            srcUser:srcUser,
            destUser:destUser
        };
        try {

            global.logger.info({
                test: global.logger["context"].current,
                step: sendRinging.name,
                action: `${srcUser} send Ringing to ${destUser}}`
            });
            await buildAndSendRequest(context, ActionType.RINGING, participant);
        } catch (e) {
            global.logger.error({
                test: global.logger["context"].current,
                step: sendRinging.name,
                error: e.message
            });
            console.assert(false, `[${context.current}] ringing error ${e.message}`);
            expect(e).handleException();
        }

    })
};

export const answerCall = (and, context: Context) => {
    and(/(.*) Answer call from (.*)/, async (srcUser, destUser) => {
        const participant: Participant = <Participant>{
            srcUser:srcUser,
            destUser:destUser
        };
        try {

            global.logger.info({
                test: global.logger["context"].current,
                step: answerCall.name,
                action: `${srcUser} Answer call`
            });
            await buildAndSendRequest(context, ActionType.ANSWER, participant);
        } catch (e) {
            global.logger.error({
                test: global.logger["context"].current,
                step: answerCall.name,
                error: e.message
            });
            console.assert(false, `[${context.current}] answerCall error ${e.message}`);
            expect(e).handleException();
        }

    })
};

export const rejectCall = (and, context: Context) => {
    and(/(.*) Reject call/, async (srcUser) => {
        try {

            global.logger.info({
                test: global.logger["context"].current,
                step: rejectCall.name,
                action: `${srcUser} Reject call`
            });
            await buildAndSendRequest(context, ActionType.REJECT, srcUser);
        } catch (e) {
            global.logger.error({
                test: global.logger["context"].current,
                step: rejectCall.name,
                error: e.message
            });
            console.assert(false, `[${context.current}] rejectCall error ${e.message}`);
            expect(e).handleException();
        }

    })
};

export const terminateAck = (and, context: Context, app?: HttpClientServer) => {
    and(/(.*) send TerminateAck to (.*)/,
        async (srcUser, destUser) => {
            const participant: Participant = <Participant>{
                srcUser:srcUser,
               destUser:destUser
            };
            try {

                global.logger.info({
                    test: global.logger["context"].current,
                    step: terminateAck.name,
                    action: `${srcUser} terminateAck request`
                });
                await buildAndSendRequest(context, ActionType.TERMINATE_ACK, participant);
            } catch (e) {
                global.logger.error({
                    test: global.logger["context"].current,
                    step: terminateAck.name,
                    error: e.message
                });
                console.assert(false, `[${context.current}] terminateAck error ${e.message}`);
                expect(e).handleException();
            }
        }
    )
};

export const callEnd = (and, context: Context, app?: HttpClientServer) => {
    and(/(.*) (.*) call with (.*)/,
        async (srcUser, action, destUser) => {
            await basicCallEnd(srcUser, action, destUser, context, app)

        }
    );
};

export const Sleep = (then: any) => {
    then(/Sleep (.*) sec/, async (delay: string) => {
        await new Promise<void>((resolve) => {
            setTimeout(() => {
                return resolve();
            }, Number(delay) * 1000);
        });
    });
};

export const basicCallEnd = async (srcUser: string, action: string, destUser: string, context: Context, app: HttpClientServer, loadContext?: LoadContext) => {
    try {

        global.logger.info({
            test: global.logger["context"].current,
            step: basicCallEnd.name,
            action: `${srcUser} end call request`
        });
        const userId = `${srcUser}_${context.currentTest}`;
        const session = context.getSession(userId);
        const api = context.api;
        session.srcUser = srcUser;
        session.destUser = destUser;
        session.messageId = (parseInt(session.messageId) + 1).toString();
        session.connectionId = session.connectionId || rstring();
        session.callId = session.callId || rstring();
        if (action == "cancel") {
            await wait(20);
        }
        const httpRes = await api.buildAndSendRequest(ActionType.END_CALL, session, context);
        context.setSession(userId, session);
        await wait(1000);
        if (context.featureType == "component"&& session.destUser == COMPONENT_CPASS ) {
            await incomingRequestValidate(session, context, METHOD_BYE, context.inviteTimeout);
        }
        if (loadContext)
            loadContext.succeedsResult++

    } catch (e) {
        if (loadContext)
            loadContext.failuresResult++
        else {
            global.logger.error({
                test: global.logger["context"].current,
                step: basicCallEnd.name,
                error: e.message
            });
            console.assert(false, `[${context.current}] callEnd error ${e.message}`);
            expect(e).handleException();
        }
    }
};

export const recallByClientB = (and, context: Context, sipClient: RestcommSimulator) => {
    and(/(.*) recall to (.*)/,
        async (srcUser, destUser) => {
            try {

                global.logger.info({
                    test: global.logger["context"].current,
                    step: recallByClientB.name,
                    action: `${destUser} (user B) recall request`
                });
                const messageFactory = new RestcomMessageFactory();
                const userId = `${srcUser}_${context.currentTest}`;
                const session = context.getSession(userId);
                session.seqNumber = 1;
                session.srcUser = srcUser;
                session.destUser = destUser;
                const request = messageFactory.createReInviteToA(session, context);

                global.logger.debug({
                    test: global.logger["context"].current,
                    step: recallByClientB.name,
                    action: `recallByClientB request ======> ${JSON.stringify(request)}`
                });
                const response = await sipClient.send(request);

                global.logger.debug({
                    test: global.logger["context"].current,
                    step: recallByClientB.name,
                    action: `recallByClientB response <====== ${JSON.stringify(response)}`
                });
                await IncomingResponseValidate(request, response);
            } catch (e) {
                global.logger.error({
                    test: global.logger["context"].current,
                    action: `######## callEndByClientB`,
                    data: e.message
                });
                console.assert(false, `[${context.current}] callEndByClientB error ${e.message}`);
                expect(e).handleException();
            }
        }
    );
};

export const cpaasStartCall = (and, context: Context, sipClient?: RestcommSimulator) => {
    and(/(.*) send Invite to (.*)/, async (srcUser, destUser) => {
        try {
            await sipClient.sendInvite(srcUser, destUser, context);
       } catch (e) {
           global.logger.error({
               test: context.current,
               action: `######## cpaasStartCall`,
               data: e.message
           });
           console.assert(false, `[${context.current}] cpaasStartCall error ${e.message}`);
           expect(e).handleException();
       }
    });
}

export const cpaasSendAck = (and, context: Context, sipClient?: RestcommSimulator) => {
    and(/(.*) send Ack to (.*)/, async (srcUser, destUser) => {
        try {
            setTimeout(async () => {await sipClient.sendAck(srcUser, destUser, context);}, 200);
        } catch (e) {
            global.logger.error({
                test: context.current,
                action: `######## cpaasSendAck`,
                data: e.message
            });
            console.assert(false, `[${context.current}] cpaasSendAck error ${e.message}`);
            expect(e).handleException();
        }
    });
}

export const callEndByClientB = (and, context: Context, sipClient: RestcommSimulator) => {
    and(/(.*) ends call with (.*)/,
        async (srcUser, destUser) => {
            try {
                global.logger.info({
                    test: global.logger["context"].current,
                    step: callEndByClientB.name,
                    action: `${destUser} (user B) end call request`
                });
                const messageFactory = new RestcomMessageFactory();
                const userId = `${srcUser}_${context.currentTest}`;
                const session = context.getSession(userId);
                session.seqNumber = 2;
                session.srcUser = srcUser;
                session.destUser = destUser;
                const request = messageFactory.createByeToA(session, context);

                global.logger.debug({
                    test: global.logger["context"].current,
                    step: callEndByClientB.name,
                    action: `callEndByClientB request ======> ${JSON.stringify(request)}`
                });
                const response = await sipClient.send(request);
                context.getSession(`${destUser}_${context.currentTest}`).createResponses.End_Call = <WsRequestDto>{
                    connectionId: session.connectionId, dto: {
                        callId: response.headers["callId"],
                        source: response.headers.from.uri.split(":")[1],
                        destination: response.headers.to.uri.split(":")[1],
                    }
                };
                context.setSession(userId, session);
                global.logger.debug({
                    test: global.logger["context"].current,
                    step: callEndByClientB.name,
                    action: `callEndByClientB response <====== ${JSON.stringify(response)}`
                });
                await wait(context.inviteTimeout * 1000);
                await IncomingResponseValidate(request, response);
            } catch (e) {
                global.logger.error({
                    test: global.logger["context"].current,
                    step: callEndByClientB.name,
                    error: e.message
                });
                console.assert(false, `[${context.current}] callEndByClientB error ${e}`);
                expect(e).handleException();
            }
        }
    );
};

export const waitForResponse = (then, context: Context) => {
    then(/(.*) receives (.*)/, async (srcUser: string, action: string) => {

        global.logger.info({
            test: global.logger["context"].current,
            step: waitForResponse.name,
            action: `${srcUser} receives ${action} response`
        });
        const userId = `${srcUser}_${context.currentTest}`;
        const session = context.getSession(userId);
        try {
            let response: any;
            if (action == REGISTER_ACTION_ACK) {
                response = await session.wsSrv.getMessageWithin(`${session.srcUser}@${context.cpaasAppUrl}#${session.callId}#${action}`, 5000);
                expect(response.type).toEqual(action);
            } else {
                response = await session.wsSrv.getMessageWithin(`${CALL_SERVICE_TYPE}#${session.callId}#${action}`, 5000);
                if (response) {
                    if (response.body.description) {
                        // This was added to define the actual response type
                        expect(strToAction(response.body.description)).toEqual(action);
                    } else {
                        expect(response.body.action).toEqual(action);
                    }
                }
            }

            global.logger.info({
                test: global.logger["context"].current,
                step: waitForResponse.name,
                action: `${action} response <====== ${JSON.stringify(response)}`
            });
            expect(response).toBeDefined();
        } catch (e) {

            global.logger.error({
                test: global.logger["context"].current,
                step: waitForResponse.name,
                error: e
            });
        }
    });
}

export const verifyResponse = (and, context: Context, app: HttpClientServer) => {
    and(/(.*) receive (.*) response on (.*)/, async (srcUser: string, description: string, action: string) => {
        const userId = `${srcUser}_${context.currentTest}`;
        const session = context.getSession(userId);
        let rest = context.api
        session.srcUser = srcUser;

        session.description = description;//CreateAck
        session.action = action;//Create_Room
        await verifyResponseArriving(session)

        validator.validate(session, context);
    });
};

export async function verifyResponseArriving(session): Promise<void> {
    return new Promise(async (resolve, reject) => {
         setTimeout( async () => {
            await  clearInterval(Interval);
             return reject(`No ${session.description} response for ${session.srcUser}`)
            }, 500);

       const  Interval=await setInterval(function () {
         if (session.wsResponse[session.description.toLowerCase()])
         {
             return resolve()
         }
        }, 100);


    });
}

export const verifyErrorResponse = (and, context: Context) => {
    and(/(.*) receive (.*)/, async (srcUser: string, errorReason: string) => {
        const userId = `${srcUser}_${context.currentTest}`;
        const session = context.getSession(userId);
        session.action = errorReason;
        validator.validate(session, context);
    });
};

export const httpRequest = async (session: Session, httpReq) => {
    return request(`${LOCAL_HOST}:9001`)
        .post("/actions")
        .set("Accept", "application/json")
        .send(<WsRequestDto>{connectionId: session.connectionId, dto: httpReq});
};


export const incomingRequestValidate = async (session, context, method, timeout) => {
    await IncomingRequestValidate({
        interval: timeout,
        method: method
    }, session, context);
};


export const buildAndSendRequest = async (context: Context, actionType: ActionType, participant:Participant) => {
    const userId = `${participant.srcUser}_${context.currentTest}`;
    let session :Session= context.getSession(userId);
    session.destUser = participant.destUser? participant.destUser: session.destUser;

    session.srcUser = participant.srcUser;
    session.messageId = (parseInt(session.messageId) + 1).toString();
    session.connectionId = session.connectionId || rstring();
    session.callId = session.callId || rstring();
    session.meetingId = session.meetingId ||  rstring();
    session.AccountSid = "ACae6e420f425248d6a26948c17a9e2acf";
    session.OrganizationSid = "ORafbe225ad37541eba518a74248f0ac4c";
    const httpRes: any = await context.api.buildAndSendRequest(actionType, session, context);
    if (context.featureType == "component" && actionType == ActionType.START_CALL) {
        session.createResponses[actionTypeToStr(actionType)] = <WsRequestDto>{
            connectionId: session.connectionId, dto: {
                callId: httpRes.request._data.dto.callId,
                messageId: httpRes.request._data.dto.messageId,
                source: httpRes.request._data.dto.source,
                destination: httpRes.request._data.dto.destination,
                ts: httpRes.request._data.dto.ts,
                type: httpRes.request._data.dto.type,
                body: {
                    protocolVersion: httpRes.request._data.dto.body.protocolVersion,
                    clientVersion: httpRes.request._data.dto.body.clientVersion,
                    appSid: httpRes.request._data.dto.body.appSid,
                    deviceId: httpRes.request._data.dto.body.deviceId,
                    PNSToken: httpRes.request._data.dto.body.PNSToken
                }
            }
        };
        if(context.service !== A2P) {
            await incomingRequestValidate(session, context, METHOD_INVITE, context.inviteTimeout);
            if (context.inviteResponse == OK_RESPONSE) {
                await incomingRequestValidate(session, context, METHOD_ACK, context.inviteTimeout);
            }
        }
    }
    context.setSession(userId, session);
    return session;
};

