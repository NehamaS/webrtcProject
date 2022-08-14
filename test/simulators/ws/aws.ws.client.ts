import WebSocket = require('ws');
import {
    CALL_SERVICE_TYPE,
    JOIN_REASON,
    REGISTER_ACTION,
    START_ACTION,
    TERMINATE_ACTION
} from "../../../src/common/constants";
import {LoginServiceEmbedded} from "./login-service-embedded.service";
import {IUserToken, PLAYGROUND, DEV, STAGING, awsurl, proxyAwsurl} from './constant'
import {WsRequestDto} from "../../../src/dto/ws.request.dto";
import {ApiGwDto} from "../../../src/dto/api.gw.dto";


function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

interface TestConfig {
    appSid: string;
    from: string;
    to: string;
}

export interface UserInfo {
    email: string;
    password: string;
    deviceId: string;
    userId: string;
}


/**
 * this test is based on AWS WS API gateway to be setup
 * https://stackoverflow.com/questions/55594587/setup-a-basic-websocket-mock-in-aws-apigateway
 */
describe('AWS web socket client', () => {
    let wsConn: any;
    let loginServiceEmbedded: LoginServiceEmbedded = new LoginServiceEmbedded()
    jest.setTimeout(90000);


    let client = (testType: number = 0, doAuth: boolean = false, useQueryParm : boolean = false): Promise<WebSocket> => {
        return new Promise<WebSocket>(async (resolve, reject) => {
            let url: string = "";
            let token: IUserToken
            let userInfo: UserInfo = {
                email: "",
                password: "",
                deviceId: "",
                userId: ""
            }
            // var token = getJwtToken()//"Replace_this_with_your_JWT_token";
            let options: WebSocket.ClientOptions = {
                // rejectUnauthorized: false,
                headers: {
                    "Authorization": "" //"JWT " + token
                }
            };
            switch (testType) {
                case 1:
                    url = proxyAwsurl;
                    break;
                case 2:
                    url = PLAYGROUND.url;
                    break;
                case 3:
                    url = DEV.url;
                    userInfo.email = DEV.mail
                    userInfo.password = DEV.Password
                    userInfo.deviceId = DEV.deviceId
                    userInfo.userId = DEV.userId
                    if (doAuth) {
                        token = await getJwtToken(userInfo, DEV.userPoolId, DEV.clientId)
                        if (token) {
                            console.info(`allTaokens: ${JSON.stringify(token)}`)
                            console.info(`idToken: ${JSON.stringify(token.idToken)}`)
                            options.headers.Authorization = `Bearer ${token.idToken}`
                        } else {
                            console.error('Token - undefined')
                            throw new Error('Token - undefined')
                        }
                    }
                    break;
                case 4:
                    url = STAGING.url;
                    userInfo.email = STAGING.mail
                    userInfo.password = STAGING.Password
                    userInfo.deviceId = STAGING.deviceId
                    userInfo.userId = STAGING.userId
                    if (doAuth) {
                        token = await getJwtToken(userInfo, STAGING.userPoolId, STAGING.clientId)
                        if (token) {
                            console.info(`allTaokens: ${JSON.stringify(token)}`)
                            console.info(`idToken: ${JSON.stringify(token.idToken)}`)
                            options.headers.Authorization = `Bearer ${token.idToken}`
                        } else {
                            console.error('Token - undefined')
                            throw new Error('Token - undefined')
                        }
                        break;
                    }
                default:
                    url = awsurl;
            }

            try {
                let client: WebSocket;
                if (doAuth){
                    url = useQueryParm ? `${url}?Authorization=${options.headers.Authorization}` : url;
                    //url = useQueryParm ? `${url}?Authorization=${token.idToken}` : url;

                    console.log(url);

                    client = new WebSocket(url, useQueryParm ? undefined : options);
                }
                else {
                    client = new WebSocket(url);
                }


                client.onopen = function (openEvent) {
                    console.log('WebSocket client OPEN... ' /*+ JSON.stringify(openEvent, null, 4)*/);
                    return resolve(client);
                };
                client.onclose = function (closeEvent: WebSocket.CloseEvent) {
                    console.log('WebSocket client CLOSE: ', {
                        code: closeEvent.code,
                        reason: closeEvent.reason,
                        clean: closeEvent.wasClean
                    });
                };

                client.onerror = function (errorEvent: WebSocket.ErrorEvent) {
                    console.log('WebSocket client ERROR: ' + errorEvent.message);
                };

                client.onmessage = function (messageEvent: WebSocket.MessageEvent): void {
                    let msg = JSON.parse(<string>messageEvent.data);
                    if (msg.type) {
                        console.log({
                            from: msg.source,
                            to: msg.destination,
                            callid: msg.callId,
                            type: {
                                type: msg.type,
                                action: msg.body ? msg.body.action : "N/A",
                                desc: msg.body ? msg.body.description : "N/A"
                            }
                        });
                    } else {
                        console.debug(`WebSocket client MESSAGE: ${messageEvent.data}`);
                    }
                };

                client.on('ping', (data) => {
                    console.log(`ping`);
                    return 'pong';
                });
                client.on('pong', (data) => {
                    console.log(`pong`);
                    return 'ping';
                });

                client.on('error', (data: Error) => {
                    if (data.message.includes("401")) {
                        try {
                            client.close(401, data.message);
                            client.terminate();
                            return reject(data);
                        } catch (e) {
                            console.error("Closing unauthorized connection.");
                        }
                        return;
                    }
                    console.error(data);
                });

            } catch (exception) {
                console.error(exception);
            }
        });
    };

    let getJwtToken = async (userInfo: UserInfo, cognitoUserPool: string, cognitoClientId: string): Promise<IUserToken> => {
        loginServiceEmbedded.init(cognitoUserPool, cognitoClientId)
        // return await loginServiceEmbedded.srp(userInfo)
        return await loginServiceEmbedded.amplifySrp(userInfo)

    }

    beforeEach(async () => {
    });

    afterEach(() => {
    });


    it.skip('send ws message via mock', async () => {
        let ws: WebSocket = await client();

        let dto: { body: { action: string, msg: string } } = {body: {action: "register", msg: "this is a test"}};
        let data = {action: "register", msg: "this is a test"};

        try {
            console.log("send message", data);
            ws.send(JSON.stringify(data));
            await sleep(1000);
            console.log("send message", "ping");
            ws.send("ping");
            await sleep(1000);
            console.log("ping");
            ws.ping();
            await sleep(1000);
            console.log("close");
            ws.close();
            await sleep(1000);
            ws.terminate();
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    it.skip('Ping pong test', async () => {
        let ws: WebSocket = await client();

        try {
            console.log("send message", "ping string");
            ws.send("ping");
            await sleep(1000);

            console.log("ping");
            ws.ping();
            await sleep(1000);

            let dto = {body: {action: "ping"}};
            console.log("ping dto");
            ws.send(JSON.stringify(dto));
            await sleep(1000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    it.skip('Ping pong test - reverse proxy', async () => {
        let ws: WebSocket = await client();

        try {
            console.log("ping");
            ws.ping();
            await sleep(1000);
            let dto = {body: {action: "ping"}};
            console.log("ping dto");
            ws.send(JSON.stringify(dto));
            await sleep(1000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    xit('Playground ws test', async () => {
        let mode: number = 2;
        let ws: WebSocket = await client(mode);

        let callid: string = "xxxxx-" + Date.now()
        let appSID: string = "555343456" //"AP2ab93b8d80ad4fc596994bed5261ce9b-test";
        // let toUser: string = "+1234567@usstaging.restcomm.com";
        let toUser: string = "+972528543881@usstaging.restcomm.com";
        let source: string = "alon@mavenir.com";
        let register = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: "webtest",
                deviceType: "ANDROID",
            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                service: "P2A",
                // protocolVersion: "1.0",
                // clientVersion: "1.0",
                // appSid: register.body.appSid,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`
            }
        };


        let terminateCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 2).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: TERMINATE_ACTION,
                "statusCode": "200",
                "description": "normal"
            }
        };

        try {
            console.log("ping");
            ws.ping();
            await sleep(1000);

            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(1000);

            // console.log("Send termination call");
            // ws.send(JSON.stringify(terminateCall));
            // await sleep(1000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    xit('Playground ws click to call - pass through', async () => {
        let mode: number = 2;
        let ws: WebSocket = await client(mode);

        let data_ClickToCallCpaasPhoneNum: TestConfig = {
            appSid: "+123456",
            from: "eran@webrtc.cpaas.com",
            //from: "eran@usstaging.restcomm.com",
            to: "+123456@usstaging.restcomm.com"
        }

        let data_ClickToCallPhoneNum: TestConfig = {
            appSid: "+972528762007",
            from: "eran@webrtc.cpaas.com",
            to: "+972528762007@usstaging.restcomm.com",
        }

        let data_ClickToCallAppSID: TestConfig = {
            appSid: "AP07324aa60ddf4b6fa38de2b70bb064e9", //ClickToCall
            from: "eran@webrtc.cpaas.com",
            to: "+972528762007@usstaging.restcomm.com",
        }

        let data_ClickToCall2AppSID: TestConfig = {
            appSid: "AP07324aa60ddf4b6fa38de2b70bb064e9", //ClickToCall2
            from: "eran@webrtc.cpaas.com",
            to: "+972528762007@usstaging.restcomm.com",
        }

        let data_ClickToCallPhoneNumWithIP: TestConfig = {
            appSid: "555343456",
            from: "eran@webrtc.cpaas.com",
            to: "+972528762007@usstaging.restcomm.com",
            //to: "+972549985111@usstagingsip.restcomm.com",
            //to: "+972543010671@usstaging.restcomm.com", //noam
        }

        let data_ClickToCallPhoneNumWithIPStg: TestConfig = {
            appSid: "ClickToCallStgApp",
            from: "eran@webrtc.cpaas.com",
            to: "+972528762007@webrtc-staging.restcomm.com",
            //to: "+972549985111@usstagingsip.restcomm.com",
            //to: "+972543010671@usstaging.restcomm.com", //noam
        }

        let testCfg: TestConfig = data_ClickToCallPhoneNumWithIP;
        let callid: string = "125233qwte007" + new Date().getMilliseconds()
        let appSID: string = testCfg.appSid;
        let toUser: string = testCfg.to;
        let source: string = testCfg.from;

        let register = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: "webtest",
                deviceType: "ANDROID",
            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                service: "P2A",
                // protocolVersion: "1.0",
                // clientVersion: "1.0",
                // appSid: register.body.appSid,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`
            }
        };

        let endCall = {
            callId: register.callId,
            messageId: (parseInt(startCall.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                action: TERMINATE_ACTION,
                statusCode: "200",
                description: "normal"
            }
        };

        try {
            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(10000);

            // console.log("Send call end");
            // ws.send(JSON.stringify(endCall));
            // await sleep(3000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    xit('DEV ws click to call', async () => {
        let mode: number = 3;
        let ws: WebSocket = await client(mode);

        let data: TestConfig = {
            appSid: "100000",
            from: "eran@webrtc.cpaas.com",
            //from: "eran@usstaging.restcomm.com",
            to: "+972528762007@dev-test.restcomm.com"
        }

        let testCfg: TestConfig = data;
        let callid: string = "125288008" + new Date().getMilliseconds()
        let appSID: string = testCfg.appSid;
        let toUser: string = testCfg.to;
        let source: string = testCfg.from;

        let register = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: "webtest",
                deviceType: "ANDROID",
            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                service: "P2A",
                // protocolVersion: "1.0",
                // clientVersion: "1.0",
                // appSid: register.body.appSid,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`
            }
        };

        let endCall = {
            callId: register.callId,
            messageId: (parseInt(startCall.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                action: TERMINATE_ACTION,
                statusCode: "200",
                description: "normal"
            }
        };

        try {
            console.log("send message", "ping");
            ws.ping();
            await sleep(1000);

            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(5000);

            // console.log("Send call end");
            // ws.send(JSON.stringify(endCall));
            // await sleep(3000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    xit('STAGING click to call', async () => {
        let mode: number = 4;
        let ws: WebSocket = await client(mode);

        // let data: TestConfig = {
        //     appSid: "5551234",
        //     from: "eran@webrtc.cpaas.com",
        //     to: "+972528762007@webrtc-dev.restcomm.com"
        // }

        let data: TestConfig = {
            appSid: "5551234",
            from: STAGING.userId,
            to: "+972528762007@webrtc-staging.restcomm.com"
        }

        let testCfg: TestConfig = data;
        let callid: string = "125288008" + new Date().getMilliseconds()
        let appSID: string = testCfg.appSid;
        let toUser: string = testCfg.to;
        let source: string = testCfg.from;

        let register = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: STAGING.deviceId,
                deviceType: "ANDROID",
            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                service: "P2A",
                // protocolVersion: "1.0",
                // clientVersion: "1.0",
                // appSid: register.body.appSid,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`
            }
        };


        try {
            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(5000);

        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    it('STAGING ws click to call with auth', async () => {
        let ws: WebSocket = await client(4, true);

        let data: TestConfig = {
            appSid: "100000",
            from: STAGING.userId,
            //from: "eran@usstaging.restcomm.com",
            to: "+972528762007@dev-test.restcomm.com"
        }

        let testCfg: TestConfig = data;
        let callid: string = "12528800999" + new Date().getMilliseconds()
        let appSID: string = testCfg.appSid;
        let toUser: string = testCfg.to;
        let source: string = testCfg.from;

        let register : ApiGwDto = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: STAGING.deviceId,
                deviceType: "ANDROID",
                PNSToken: "PNSToken"

            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: register.body.appSid,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`
            }
        };

        let endCall = {
            callId: register.callId,
            messageId: (parseInt(startCall.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                action: TERMINATE_ACTION,
                statusCode: "200",
                description: "normal"
            }
        };

        try {
            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(3000);

            console.log("Send call end");
            ws.send(JSON.stringify(endCall));
            await sleep(1000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    it('STAGING ws click to call with auth as query param', async () => {
        let ws: WebSocket = await client(4, true, true);

        let data: TestConfig = {
            appSid: "100000",
            from: STAGING.userId,
            //from: "eran@usstaging.restcomm.com",
            to: "+972528762007@dev-test.restcomm.com"
        }

        let testCfg: TestConfig = data;
        let callid: string = "12528800999" + new Date().getMilliseconds()
        let appSID: string = testCfg.appSid;
        let toUser: string = testCfg.to;
        let source: string = testCfg.from;

        let register : ApiGwDto = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: STAGING.deviceId,
                deviceType: "ANDROID",
                PNSToken: "PNSToken"

            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: register.body.appSid,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`
            }
        };

        let endCall = {
            callId: register.callId,
            messageId: (parseInt(startCall.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                action: TERMINATE_ACTION,
                statusCode: "200",
                description: "normal"
            }
        };

        try {
            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(3000);

            console.log("Send call end");
            ws.send(JSON.stringify(endCall));
            await sleep(1000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    it('DEV ws click to call with auth', async () => {
        let ws: WebSocket = await client(3, true);

        let data: TestConfig = {
            appSid: "100000",
            from: DEV.userId,
            //from: "eran@usstaging.restcomm.com",
            to: "+972528762007@dev-test.restcomm.com"
        }

        let testCfg: TestConfig = data;
        let callid: string = "12528800999" + new Date().getMilliseconds()
        let appSID: string = testCfg.appSid;
        let toUser: string = testCfg.to;
        let source: string = testCfg.from;

        let register : ApiGwDto = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: DEV.deviceId,
                deviceType: "ANDROID",
                PNSToken: "PNSToken"

            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                service: "P2A",
                // protocolVersion: "1.0",
                // clientVersion: "1.0",
                // appSid: register.body.appSid,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`
            }
        };

        let endCall = {
            callId: register.callId,
            messageId: (parseInt(startCall.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                action: TERMINATE_ACTION,
                statusCode: "200",
                description: "normal"
            }
        };

        try {
            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(3000);

            console.log("Send call end");
            ws.send(JSON.stringify(endCall));
            await sleep(1000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    it('DEV ws click to call with auth as query param', async () => {
        let ws: WebSocket = await client(3, true, true);

        let data: TestConfig = {
            appSid: "100000",
            from: DEV.userId,
            //from: "eran@usstaging.restcomm.com",
            to: "+972528762007@dev-test.restcomm.com"
        }

        let testCfg: TestConfig = data;
        let callid: string = "12528800999" + new Date().getMilliseconds()
        let appSID: string = testCfg.appSid;
        let toUser: string = testCfg.to;
        let source: string = testCfg.from;

        let register : ApiGwDto = {
            callId: callid,
            messageId: "1",
            source: source,
            destination: source,
            ts: Date.now(),
            type: REGISTER_ACTION,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                appSid: appSID,
                deviceId: DEV.deviceId,
                deviceType: "ANDROID",
                PNSToken: "PNSToken"

            }
        };

        let startCall = {
            callId: register.callId,
            messageId: (parseInt(register.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                action: START_ACTION,
                reason: JOIN_REASON,
                sdp: `v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TELESTAX.COM\r\ns=- c=IN IP4 ${'10.10.1.1'}\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n`,
                service: "P2A"
                // protocolVersion: "1.0",
                // clientVersion: "1.0",
                // appSid: register.body.appSid,

            }
        };

        let endCall = {
            callId: register.callId,
            messageId: (parseInt(startCall.messageId) + 1).toString(),
            source: register.source,
            destination: toUser,
            ts: Date.now(),
            type: CALL_SERVICE_TYPE,
            body: {
                protocolVersion: "1.0",
                clientVersion: "1.0",
                action: TERMINATE_ACTION,
                statusCode: "200",
                description: "normal"
            }
        };

        try {
            console.log("Send register");
            ws.send(JSON.stringify(register));
            await sleep(1000);

            console.log("Send start call");
            ws.send(JSON.stringify(startCall));
            await sleep(3000);

            console.log("Send call end");
            ws.send(JSON.stringify(endCall));
            await sleep(1000);
        } catch (e) {
            fail(e);
        } finally {
            ws.terminate();
        }
    });

    xit('GetToken from cognito', async () => {
        let token = await getJwtToken(<UserInfo>{
            email: "eran.gavriel@mavenir.com",
            password: "1qaz@WSX#EDC"
        }, "us-east-1_01QCtijH9", "4p25ejsj4sb2ltlfcvktclg3ab");
        expect(token).toBeTruthy()
    });
});
