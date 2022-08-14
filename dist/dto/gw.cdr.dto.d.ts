export declare class GwCdrDto {
    caller?: string;
    callee?: string;
    callId?: string;
    appSid?: string;
    orgSid?: string;
    accountSid?: string;
    duration?: number;
    ringDuration?: number;
    answerCall?: string;
    endCall?: string;
    dateCreated?: string;
    dateUpdated?: string;
    reason?: {
        "code": number;
        "message": string;
        "protocol": string;
    };
    terminator?: string;
}
