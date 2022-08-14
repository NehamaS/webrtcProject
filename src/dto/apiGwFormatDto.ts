export  class  ApiGwFormatDto {
    caller: string
    callee: string
    callId: string
    deviceId?: string
    meetingId?: string
    appSid?: string //@TODO shall be mandatory
    sequence?: string
    requestMessageId?: string
    accessToken?: string
    sdp?: string
    method?: "call" | "update" | "join" | "reconnect" | "create"
    service?: "P2P" | "P2A" | "A2P" | "P2M"
    roomType?: "av" | "ss"
    reason?: string
    status?: {
        code: string
        desc: string
    }
}
