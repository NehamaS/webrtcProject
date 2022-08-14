export declare class Body {
    userId?: string;
    deviceId?: string;
    service?: "P2P" | "P2A" | "A2P" | "P2M";
    protocolVersion?: string;
    clientVersion?: string;
    PNSToken?: string;
    accessToken?: string;
    deviceType?: "ANDROID" | "IOS" | "WEB_BROWSER" | "WEB_DESKTOP";
    requestMessageId?: string;
    GWVersion?: string;
    action?: string;
    reason?: string;
    sdp?: string;
    statusCode?: string;
    description?: string;
    appSid?: string;
    meetingName?: string;
    participantsList?: string[];
    organizationId?: string;
    accountId?: string;
    meetingId?: string;
}
export declare class ApiGwDto {
    source: string;
    destination: string;
    callId: string;
    meetingId?: string;
    messageId: string;
    ts: number;
    type: string;
    body: Body;
}
