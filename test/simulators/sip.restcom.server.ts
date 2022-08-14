import {Injectable, OnModuleInit, OnModuleDestroy} from '@nestjs/common';
//import * as sip from "sip";
const sip = require("sip2");
import * as ip from "ip";
import { MculoggerService } from 'service-infrastructure/common/logs/mculogger.service';
import {EventEmitter} from 'events';

let emitter = new EventEmitter()

const SIP_PORT = 5280;
const SIP_ADDRESS = ip.address();


function getCallId(): string {
    return Math.floor(Math.random()*1e12).toString();
}

function  buildRequest(request: any) {
    let outRequest = {
        method: request.method,
        uri: request.headers.contact[0].uri,
        version: '2.0',
        headers: {
            to: request.headers.to.uri,
            from: request.headers.from.uri,
            'call-id': getCallId(),
            cseq: request.headers.cseq,
            contact: 'sip:restComSim@' + SIP_ADDRESS + ':' + SIP_PORT,
            via: []
        }
    };

    if (request.content) {
        outRequest['content-type'] = request['content-type'];
        outRequest['content'] = request.content;
    }

    return outRequest;
}

function buildAck(rsp: any) {
    let via = [];
    if (rsp.status != 200) {
        via = rsp.headers.via;
    }

    let reqUri: string = 'sip:' + '972545461300' + '@' + ip.address() + ':5062';
    //uri: rsp.headers.contact[0].uri,

    let ack = {
        method: 'ACK',
        uri: reqUri,
        version: '2.0',
        headers: {
            to: rsp.headers.to,
            from: rsp.headers.from,
            'call-id': rsp.headers['call-id'],
            cseq: {method: 'ACK', seq: rsp.headers.cseq.seq},
            via: via
        }
    };

    return ack;
}

emitter.on('SendAck', function (rsp) {
    let ack = buildAck(rsp);
    console.log('sendAck(), request: ', ack);

    sip.send(ack);
});


//@Injectable()
export class SipRestComServer implements OnModuleInit, OnModuleDestroy {
    private port : number = SIP_PORT;
    private address : string = SIP_ADDRESS;

    private mode: string;
    private code: number;
    private desc: string

    public set Mode(m :string){
        this.mode = m;
    }
    public set Code(c :number){
        this.code = c;
    }
    public set Description(d :string){
        this.desc = d;
    }

    constructor() {
        // console.log({fuc: 'SipRestComServer started', code: this.code, desc: this.desc});
        this.start();
    }

    onModuleInit() {
        this.start();
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
        console.log({ action: "Start", data: options });
        sip.start(options, this.sipMessageHandler.bind(this));
    };

    public stop = () => {
        sip.stop({
            protocol: "UDP",
            address: this.address,
            port: this.port,
        });
    };

    protected tryCall(request: any) {
        let rs = sip.makeResponse(request, 100, "Trying");
        console.log({method: request.method, status: rs.status});
        sip.send(rs);
    }

    protected ringCall(request: any) {
        setTimeout(() => {
            let rs = sip.makeResponse(request, 180, "Ringing");
            console.log({method: request.method, status: rs.status});
            sip.send(rs);
        }, 250);
    }

    protected answerCall(request: any) {
        setTimeout(() => {
            let rs = sip.makeResponse(request, 200, "OK");
            rs.headers['content-type'] = 'application/sdp';
            rs.content = 'm=audi0 32200 ...';

            console.log({method: request.method, status: rs.status});
            sip.send(rs);
        }, 3000);
    }

    protected rejectCall(request: any, code: number, desc: string) {
        let rs = sip.makeResponse(request, code, desc);
        console.log({method: request.method, status: rs.status});
        sip.send(rs);
    }

    protected proxyMessage(request: any) {

        switch (request.method) {
            case 'ACK':
                console.log({func: 'proxyMessage', method: 'Ack'});
                return;
            case 'INVITE':
                this.tryCall(request)
                break;
            default:
                break;
        }

        let outReq = buildRequest(request);

        sip.send(outReq, function (outRsp) {

            if (outRsp.status > 100) {

                if (outRsp.method == "INVITE" && outRsp.status > 199) {
                    let ack = buildAck(outRsp);
                    console.log('sendAck(), request: ', ack);
                    sip.send(ack);
                }

                let rs = sip.makeResponse(request, outRsp.status, outRsp.reason);

                if (outRsp.content) {
                    rs.headers['content-type'] = outRsp['content-type'];
                    rs.content = outRsp.content;
                }

                console.log({func: 'proxyMessage', method: request.method, status: rs.status});
                sip.send(rs);
            }
        });
    }

    protected sipMessageHandler(request: any): void {
        console.log({settings: { code: this.code, desc: this.desc}});
        console.log({ method: request.method });

        if (this.mode === 'back2back') {
            this.proxyMessage(request);
            return;

        }
        switch (request.method) {
            case "INVITE":
                switch (this.code) {
                    case 100:
                        this.tryCall(request);
                        break;
                    case 180:
                        this.tryCall(request);
                        this.ringCall(request);
                        break;
                    case 200:
                        this.tryCall(request);

                        console.log({ request: request.headers.to.uri });
                        // check if it is ReInvite
                        if (request.headers.to.uri.indexOf('tad=') !== -1) {
                            console.log({ desc: 'ReInvite'});
                            this.answerCall(request);
                        }
                        else {
                            this.ringCall(request);
                            this.answerCall(request);
                        }
                        break;
                    default:
                        this.rejectCall(request, this.code, this.desc);
                        break;
                }
                break;

            case "ACK":
                break;
            case "CANCEL":
                let rs = sip.makeResponse(request, 200, "OK");
                console.log({method: request.method, status: rs.status});
                sip.send(rs);

                // Send 487 for Invite
                request.method = "INVITE";
                request.cseq.method = "INVITE";

                rs = sip.makeResponse(request, 487, "Request Terminated");
                sip.send(rs);
                break;
            case "BYE":
                rs = sip.makeResponse(request, 200, "Ok");
                console.log({ method: request.method, status:  rs.status});
                sip.send(rs);
                break;
            default:
                rs = sip.makeResponse(request, 405, "Method Not Allowed");
                console.error({ method: request.method, status:  rs.status});
                sip.send(rs);
                break;
        }
    }

    //public async sendInviteRequest(callee: string, caller: string) : Promise<number> {
    public async sendInviteRequest(callee: string, caller: string) : Promise<any> {

        let reqUri: string = 'sip:' + callee + '@' + ip.address() + ':5062';
        let toUri: string = 'sip:' + callee + '@gmail.com';
        let fromUri: string = 'sip:' + caller + '@gmail.com';
        let contactUri: string = 'sip:' + caller + '@' + ip.address() + ':' + SIP_PORT;

        let offerSdp: string = 'v=0\r\n';
        offerSdp += 'o=- 4104406465452406309 2 IN IP4 127.0.0.1\r\n';
        offerSdp += 's=-\r\n';
        offerSdp += 't=0 0\r\n';
        offerSdp += 'm=audio 33060 UDP/TLS/RTP/SAVPF 111\r\n';
        offerSdp += 'c=IN IP4 10.9.251.69\r\n';
        offerSdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';
        offerSdp += 'a=candidate:1824728482 1 udp 2122260223 10.9.251.69 63305 typ host generation 0 network-id 1\r\n';
        offerSdp += 'a=candidate:186199869 1 udp 2122194687 192.168.1.101 63305 typ host generation 0 network-id 2 network-cost 10\r\n';
        offerSdp += 'a=candidate:574675282 1 tcp 1518280447 10.9.251.69 9 typ host tcptype active generation 0 network-id 1\r\n';
        offerSdp += 'a=candidate:1167774669 1 tcp 1518214911 192.168.1.101 9 typ host tcptype active generation 0 network-id 2 network-cost 10\r\n';
        offerSdp += 'a=ice-ufrag:tFTQ\r\n';
        offerSdp += 'a=ice-pwd:YH1af4n03qNilav2P41FoTMg\r\n';
        offerSdp += 'a=ice-options:trickle\r\n';
        offerSdp += 'a=fingerprint:sha-256 91:83:E0:E5:0E:F4:E3:A8:1A:A6:B5:3A:9D:94:76:53:CE:D3:B8:E6:5C:4E:48:ED:26:47:C8:D8:19:98:C8:C8\r\n';
        offerSdp += 'a=setup:actpass\r\n';
        offerSdp += 'a=mid:0\r\n';
        offerSdp += 'a=sendrecv\r\n';
        offerSdp += 'a=rtcp-mux\r\n';
        offerSdp += 'a=rtpmap:111 opus/48000/2\r\n';
        offerSdp += 'a=rtcp-fb:111 transport-cc\r\n';
        offerSdp += 'a=fmtp:111 minptime=10;useinbandfec=1\r\n';
        offerSdp += 'a=ssrc:2616592695 cname:rHzPh3cxJ95tIUlx\r\n';
        offerSdp += 'a=ssrc:2616592695 msid:VLZRtKEHAyRY0EpiljbDqrUlZGiZAnmxM5xq 172313fe-f2c1-4d5f-a419-ebb7c4807d1e\r\n';
        offerSdp += 'a=ssrc:2616592695 mslabel:VLZRtKEHAyRY0EpiljbDqrUlZGiZAnmxM5xq\r\n';
        offerSdp += 'a=ssrc:2616592695 label:172313fe-f2c1-4d5f-a419-ebb7c4807d1e\r\n';

        let inviteRequest = {
            method: 'INVITE',
            uri: reqUri,
            version: '2.0',
            headers: {
                to: {uri: toUri},
                from: {uri: fromUri, params: {tag: getCallId()}},
                'call-id': getCallId(),
                cseq: {method: 'INVITE', seq: 1},
                contact: [{uri: contactUri}],
                via: [],
                'content-type': 'application/sdp'
            },
            content:
                offerSdp
        }

        console.log({func: 'inviteRequest', reqUri: inviteRequest});

        return await this.sipSend(inviteRequest);
    }

    //async sipSend(req) : Promise <any> {
    async sipSend(req)  {
        return new Promise((resolve, reject) => {
            return sip.send(req, (rsp) => {

                console.log({func: 'sipSend', response: rsp.status});

                switch (rsp.status) {
                    case 100:
                        break;
                    case 408:
                        resolve(rsp.status);
                    default: {
                        if (rsp.status > 199) {
                            emitter.emit('SendAck', rsp);
                        }
                        return resolve(rsp.status);
                    }
                }
            });
        });

    }

};
