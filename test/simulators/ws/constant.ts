export interface IUserToken {
    accessToken: string;
    refreshToken: string;
    idToken: string;
}

interface ConnectionDetails {
    userPoolId: string
    clientId: string
    url: string
    mail: string
    Password: string
    deviceId: string
    userId: string
}

export const REGION = "us-east-1"

//Staging
export const STAGING: ConnectionDetails = {
    userPoolId: "us-east-1_fc59KC8CL",
    clientId: "7av8u19slo9g6q5obo32lhmlfi",
    url: "wss://yk11kg2xse.execute-api.us-east-1.amazonaws.com/webrtc-ws-apigw",
    mail: "AC288a940234b0d31aaa9df865acc8e381",
    Password: "0c4d5959376500dd23d4b3a39126ec48",
    deviceId: "deviceId-staging-test",
    userId: "userId-staging-test@webrtc.cpaas.com"
}

//Dev
export const DEV: ConnectionDetails = {
    userPoolId: "us-east-1_IxhAXkuzX",
    clientId: "3889vc2j08nn86lcboq45n6mb1",
    // url: "websocket://8xym73mdke.execute-api.us-east-1.amazonaws.com/test",
    url: "wss://1nkgbu7d6d.execute-api.us-east-1.amazonaws.com/webrtc-ws-apigw",
    mail: "AC3c5b4177e5fdd813720bc0d6dd7f057e",
    Password: "c8b0fca2c59d9198b641ce60fe9b501b",
    deviceId: "deviceId-dev-test",
    userId: "userId-dev-test@webrtc.cpaas.com"
}

//playground
export const PLAYGROUND: ConnectionDetails = {
    userPoolId: "",
    clientId: "",
    url: "wss://8ndc53x5xg.execute-api.us-east-1.amazonaws.com/integration",
    mail: "",
    Password: "",
    deviceId: "",
    userId: ""
}


export const stage: string = "pong";
export const awswsgw: string = "w3f1pcazc1.execute-api.us-east-1.amazonaws.com";
export const awsurl: string = `wss://${awswsgw}/${stage}`;

const rvsProxy: string = "dev.restcomm.com/webrtc/connect";
export const proxyAwsurl: string = `wss://${rvsProxy}`;


