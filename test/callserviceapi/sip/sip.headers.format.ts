let sip = require("sip");

const options = {
    protocol: "UDP",
    address: "10.10.10.1",
    port: 5065
};

sip.start(options);

let destinationAddress = '10.106.146.13';
let destinationPort =  5060;
let localIp = "10.10.10.1";
let localPort = 5065;
let roomUser = '77777';
let CreateRoomToUri = 'sip:' + roomUser +'@' + destinationAddress + ':' + destinationPort;
let CreateRoomFromUri = 'sip:' + roomUser +'@' + localIp + ':' + localPort;
let CreateRoomCseq =  {method: 'INVITE', seq: 1};
let pMeetingId = "11111";

let inviteRequest = {
    method: 'INVITE',
    uri: CreateRoomToUri,
    version: '2.0',
    headers: {
        To: {uri: CreateRoomToUri},
        from: {uri: CreateRoomFromUri, params: {tag: "gfgfgfg-tag"}},
        'call-id': "call-id-jkjhjhjhjhjhj11111",
        cseq: CreateRoomCseq,
        'x-meetingid': pMeetingId,
        'x-service-type': 1,
        'max-forwards': 1,
        contact: [{uri: CreateRoomFromUri}],
        via: []
    }
};

const inviteRequestHeaderMapping = new Map<string, string>(
    [
        ["x-meetingid", 'X-MeetingId'],
        ["x-service-type", 'X-Service-Type'],
        ['max-forwards', 'Max-Forwards']
    ]
);

function fixHeaders(obj: any, headersToFix: Map<string, string>):any {
    let headers: any = obj['headers']
    let fixedHeaders: any = {}

    Object.entries(headers)
        .forEach(([header, value]) => {
             if (headersToFix.has(header)) {
                 const fixedHeader = headersToFix.get(header)
                 fixedHeaders[fixedHeader]= value
             }else {
                 fixedHeaders[header]= value
             }
        })
    const fixedObject = { ...obj };
    fixedObject['headers'] = fixedHeaders
    return fixedObject;
}

try{
    inviteRequest = fixHeaders(inviteRequest, inviteRequestHeaderMapping);

    console.log({ msg: " INVITE=========> ", inviteRequest: JSON.stringify(inviteRequest) });

    sip.send(inviteRequest, (response) => {
        if(response && response.status) {
            console.log({ msg: " <========= " + response.status + " on " + response.headers.cseq.method + " ", response: JSON.stringify(response) });
        }
        else {

            console.error({ action: "received response error", error: "response wasn't received" });

        }
    });
}
catch (e) {
    console.error({ error: e });
}