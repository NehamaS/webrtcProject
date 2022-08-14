export class SessionDto {
    callId: string;
    userId: string //*tel || email*;
    deviceId: string
    connectionId?: string //not use
    meetingId?: string
    startCall?: number
    answerCall?: number
    endCall?: number
    serviceType?: string
}
