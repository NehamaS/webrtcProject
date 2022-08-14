let sip = require('sip');
let EventEmitter = require('events').EventEmitter;
let _emitter = new EventEmitter();

let serverIp = "127.0.0.1";
let serverSipPort = 5080;
sip.start({ protocol: 'UDP', address: serverIp, port: serverSipPort }, onSipMsgReq);


function onSipMsgReq(request)
{
    switch(request.method) {

        case 'INVITE':
            _emitter.emit('OnInvite', request);
            break;

        case 'UPDATE':
            _emitter.emit('OnUpdate', request);
            break;

        case 'ACK':
            _emitter.emit('OnAck', request);
            break;

        case 'PRACK':
            _emitter.emit('OnAck', request);
            break;

        case 'CANCEL':
            _emitter.emit('OnCancel', request);
            break;

        case 'INFO':
            _emitter.emit('OnInfo', request);
            break;

        case 'BYE':
            _emitter.emit('OnBye', request);
            break;

        case OPTIONS:
            _emitter.emit(OPTIONS_ACTION, request);
            break;

        default:
            logger.info({ msg: 'onSipMsgReq()', method: request.method});
            break;
    }
}

_emitter.on('OnInvite', function (rq) {
    console.log({msg: 'OnInvite()'});

    //send 100 Trying
    let response100 = sip.makeResponse(rq, 100, 'Trying');
    sip.send(response100);

    let meetingIdRcv = rq.headers["p-meetingid"];
    let sdpBody;
    let meetingId = "11111";
    let roomId = "22222";
    let userId = "33333";

    if(meetingIdRcv && meetingIdRcv == "000"){
        sdpBody = 'v=0\r\no=user 1 1 IN IP4 0.0.0.0\r\ns=CallControl\r\nc=IN IP4 0.0.0.0\r\nt=0 0\r\nm=audio 9 RTP/AVP 0 8\r\na=inactive\r\n\r\n';
    }
    else {
        sdpBody = 'v=0\r\no=- 14305328 14305328 IN IP4 BC00.ORMSS349.TMOBILEUSA.COM\r\ns=- c=IN IP4 10.174.20.152\r\nt=0 0\r\na=sendrecv\r\nm=audio 30462 RTP/AVP 96 97 98 0 99 100 111\r\nc=IN IP4 10.174.20.152\r\na=rtpmap:96 AMR-WB/16000\r\na=fmtp:96 mode-set=0,1,2;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:97 AMR/8000\r\na=fmtp:97 mode-set=0,2,4,7;mode-change-period=2;mode-change-capability=2;mode-change-neighbor=1;max-red=0\r\na=rtpmap:98 AMR/8000\r\na=fmtp:98 mode-set=7;max-red=0\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:99 telephone-event/16000\r\na=fmtp:99 0-15\r\na=rtpmap:100 telephone-event/8000\r\na=fmtp:100 0-15\r\na=maxptime:40\r\na=rtpmap:111 opus/48000/2\r\na=rtcp-fb:111 transport-cc\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n\r\n';

    }
    let extension = {
        content: sdpBody,
        headers: {
            'Content-Type' : "application/sdp"
        }
    };

    let response200 = sip.makeResponse(rq, 200, "OK", extension);
    response200.headers["P-MeetingId"] = meetingId;
    if(meetingIdRcv && meetingIdRcv == "000"){
        response200.headers.to.params.tag = roomId;
    }
    else {
        response200.headers.to.params.tag = userId;
        response200.headers["P-RoomId"] =roomId;
    }
    sip.send(response200);
});

_emitter.on('OnAck', function (rq) {
    console.log({msg: 'OnAck()'});

});

_emitter.on('OnBye', function (rq) {
    console.log({msg: 'OnBye()'});


    let response200 = sip.makeResponse(rq, 200, "OK");
    sip.send(response200);
});

_emitter.on('OnInfo', function (rq) {
    console.log({msg: 'OnInfo()'});

    let response200 = sip.makeResponse(rq, 200, "OK");
    sip.send(response200);
});