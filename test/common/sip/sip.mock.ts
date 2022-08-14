import {RequestDTO, ResponseDTO} from "../../../src/callserviceapi/sip/common/sipMessageDTO";
import {sleep} from "../../testutils/test.utils";
import {SipURI} from "../../../src/callserviceapi/sip/common/sip.utils";
import sip from "sip";
import {EventEmitter} from "events";
import {isCancelFlow} from "../../e2e/app.e2e-spec";

let emitter = new EventEmitter();


export const BPARTY_CONTACT: string = "sip:restcomm@restcomm.com"
export let byeRequest, reInviteRequest, ackRequest: RequestDTO


export const getTag = (): string => {
    let date = Date.now();
    let tag = String(date);
    return tag;
}

export const getCallId = (): string => {
    return Math.floor(Math.random()*1e12).toString();
}

export const TO_TAG = getTag();

export const sipSendMock = jest.fn().mockImplementation(async (request, handler) => {
    const toTag: string = getTag();

    if (request.method == 'INVITE') {
        console.log("########", "INVITE", "mock", JSON.stringify(request));
    }

    // if (request.method == 'INVITE' && (request.headers['authorization'] || request.headers['Authorization'])) {
    //     let response: any = sip.makeResponse(request, 100, "Trying");
    //     handler(response);
    //     return;
    // }

    const buildBParyByeReq = (response: ResponseDTO) => {
        byeRequest = {
            "method": "BYE",
            "uri": request.headers.contact[0].uri,
            "version": "2.0",
            "headers": {
                "to": request.headers.from,
                "from": response.headers.to, //with to tag
                "call-id": request.headers["call-id"],
                "cseq": {
                    "method": "BYE",
                    "seq": 1
                },
                // "contact": response.headers.contact, //According RFC 3261 BYE has no contact header
                "via": []
            }
        }
    }

    const buildBParyReInviteReq = (response: ResponseDTO) => {
        reInviteRequest = {
            "method": "INVITE",
            "uri": request.headers.contact[0].uri,
            "version": "2.0",
            "headers": {
                "to": request.headers.from,
                "from": response.headers.to, //with to tag
                "call-id": request.headers["call-id"],
                "cseq": {
                    "method": "INVITE",
                    "seq": 1
                },
                "contact": response.headers.contact,
                "content-type": "application/sdp",
                "via": []
            },
            "content": "SDP reInvite offer m=audio"
        }
    }

    const buildBPartyAckReq = (response: ResponseDTO) => {
        ackRequest = {
            "method": "ACK",
            "uri": response.headers.contact[0].uri,
            "version": "2.0",
            "headers": {
                "to": response.headers.to,//with to tag
                "from": response.headers.from,
                "call-id": response.headers["call-id"],
                "cseq": {
                    "method": "ACK",
                    "seq": 1
                },
                "contact": response.headers.contact,
                "via": [],
                "content-type": undefined
            }
        }
    }

    switch (request.method) {

        case "INVITE": {
            let response: any = sip.makeResponse(request, 180, "Ringing", {
                headers: {
                    'Content-Type': "application/sdp",
                    'to': {
                        uri: request.headers.to.uri,
                        params: {
                            tag: toTag
                        }
                    }
                }
            });
            handler(response);

            if (isCancelFlow === false) { //No Final response - To support Cancel flow
                response = sip.makeResponse(request, 200, "OK", {
                    content: request.content,
                    headers: {
                        'Content-Type': "application/sdp",
                        'to': {
                            uri: request.headers.to.uri,
                            params: {
                                tag: toTag
                            }
                        },
                        contact: [{
                            "uri": BPARTY_CONTACT
                        }]
                    }
                });
                handler(response);
            }

            if (response.status === 200) {
                buildBParyByeReq(response);
                buildBParyReInviteReq(response)
            }

            //sending 487 to INVITE request in case of Cancel flow
            if (request.headers['call-id'].includes('cancel-flow')) {
                let cancelRequet = request
                emitter.on("487", () => {
                    let cancelResponse = sip.makeResponse(cancelRequet, 487, "Request Terminated")
                    handler(cancelResponse);
                    return
                })
            }
            break;
        }
        case "BYE": {
            let response: any = sip.makeResponse(request, 200, "OK", {
                headers: {}
            });
            handler(response);
        }
        case "ACK": {
            return
            //do nothing
        }
        case "CANCEL": {
            let cancelResponse: any = sip.makeResponse(request, 200, "OK");
            handler(cancelResponse);

            await sleep(1000)

            emitter.emit("487")
            return

        }
        default:
            jest.fn();
    }

    if (request.status) { //means SIP response
        switch (request.status.toString()) {
            case "200": //Send ACK
                if (request.headers.cseq.method === "INVITE") {
                    buildBPartyAckReq(request)
                }

                console.log(`response is ${JSON.stringify(request)}`)
                break
            default:
                console.log(`response is ${JSON.stringify(request)}`)
                break
        }
    }
});

export const makeResponseMock = jest.fn().mockImplementation((request: RequestDTO, status: number, reason?: string, extension?: any): ResponseDTO => {
    console.log({status: status, reason: reason, extension: extension});

    // add tag to TO header
    let toUri: any = request.headers.to;
    if (status > 100 && request.headers.to.params == undefined) {
        toUri = {uri: request.headers.to.uri, params: {tag: TO_TAG}};
    }

    var response: ResponseDTO = {
        status: status,
        reason: reason || '',
        version: request.version,
        headers: {
            via: request.headers.via,
            to: toUri,
            from: request.headers.from,
            'call-id': request.headers['call-id'],
            cseq: request.headers.cseq
        }
    };

    if (extension) {
        if (extension.headers) {
             Object.keys(extension.headers).forEach(function(key) {
                console.log({key: key, value: extension.headers[key]})
                response.headers[key] = extension.headers[key];
            });
        }

        response.content = extension.content;
    }
    return response;
})

export let parseUriMock = jest.fn().mockImplementation((uri): SipURI => {
    return sip.parseUri(uri)
})
export let stringifyUriMock = jest.fn().mockImplementation((uri): string => {
    return sip.stringifyUri(uri)
})
export const setRetransmissionMock = jest.fn().mockImplementation((rsp): void => {
    console.log('setRetransmissionMock');
    return
})


let sipStartMock = jest.fn();
let sipStopMock = jest.fn();
export const SIP = {
    send: sipSendMock,
    start: sipStartMock,
    stop: sipStopMock,
    makeResponse: makeResponseMock,
    parseUri: parseUriMock,
    stringifyUri: stringifyUriMock,
    setRetransmission: setRetransmissionMock
};
