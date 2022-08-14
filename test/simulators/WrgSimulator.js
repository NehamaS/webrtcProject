let ip = require('ip');
let sip = require('sip');
let serverIp = ip.address();
let serverSipPort = 5080;


function onSipMsgReq(request) 
{
	switch(request.method) {
		
		case 'INVITE':
            console.log("Received INVITE: " + JSON.stringify(request));
            var rs;
            var rs180;
            console.log("Test");
            if(request.content && request.content != "") {
                console.log("Test with content 11");
                let sdp = 'v=0\r\no=user 1 1 IN IP4 0.0.0.0\r\ns=Mavenir\r\nc=IN IP4 0.0.0.0\r\nt=0 0\r\nm=audio 47928 RTP/AVP 0 8\r\na=inactive\r\n\r\n';
                var extension = {
                    content: sdp,
                    headers: {
                        'Content-Type' : "application/sdp"
                    }
                };
                console.log("Build response");
                rs = sip.makeResponse(request, 200, 'OK');
                //rs = sip.makeResponse(request, 200, 'Ok', extension);
                rs180  = sip.makeResponse(request, 180, 'Ringing');

                //rs = sip.makeResponse(request, 200, 'Ok');
                console.log("response" + rs);
            }
            else {
                console.log("Test no content");
                rs = sip.makeResponse(request, 200, '');
            }
            //var uri = "sip:ucc@" + serverIp + ":" + serverSipPort.toString();
            //rs.headers.contact = [{uri: uri}];
            let tag = rstring();
            rs180.headers.to.params.tag = tag;
            
            
            console.log('<======= Send 180 Ringing on ' + request.method + ': %j', rs180);
            //sip.send(rs180);

            rs.headers.to.params.tag = tag;
            rs.headers.contact = [{uri: "sip:22222test@10.106.146.13:5060"}];
            console.log('<======= Send 200 OK on ' + request.method + ': %j', rs);
            sip.send(rs);


            
			break;
		
		case 'UPDATE':
			break;

		case 'ACK':
            console.log("Received ACK: " + JSON.stringify(request));
			break;
			
		case 'CANCEL':
			
			break;
			
		case 'INFO':
			_emitter.emit('OnInfo' +  JSON.stringify(request));
			break;
			
		case 'BYE':
            console.log("Received BYE: " + JSON.stringify(request));
            rs = sip.makeResponse(request, 200, 'Ok');
            console.log('<======= Send 200 OK on ' + request.method + ': %j', rs);
            sip.send(rs);
			break;

		case OPTIONS:
			
			break;

		default:
			console.log('onSipMsgReq(), method: ', request.method);
			break;
	}
}

function rstring() { return Math.floor(Math.random()*1e6).toString(); }


sip.start({ protocol: 'UDP', address: serverIp, port: serverSipPort }, onSipMsgReq);

console.log("SIP servert listen on ip: %s, port: %d", serverIp, serverSipPort);
