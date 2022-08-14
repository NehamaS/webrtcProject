export  class ApiGwFormatDto {
    caller: string
    callee: string
    callId: string
    appSid?: string //@TODO shall be mandatory
    sequence?: number
    accessToken?: string
    sdp?: string
    method?: "call" | "update"
    status?: {
        code: number
        desc: string
    }
}