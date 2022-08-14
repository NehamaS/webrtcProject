import { IsNotEmpty, IsString, IsEmail } from "class-validator";

export class ApiGwDto {
    @IsNotEmpty()
    @IsEmail()
    source: string
    @IsNotEmpty()
    @IsString()
    destination: string
    @IsNotEmpty()
    @IsString()
    callId: string
    @IsNotEmpty()
    messageId: string
    ts: number
    @IsNotEmpty()
    @IsString()
    type: string
    body: {
        userId?: string
        deviceId?: string
        protocolVersion?: string
        clientVersion?: string
        PNSToken?: string
        accessToken?: string
        deviceType?: "ANDROID"|"IOS"|"WEB_BROWSER"|"WEB_DESKTOP";
        requestMessageId?: string
        GWVersion?: string
        service?:string
        action?: string
        reason?: string
        sdp?: string
        statusCode?: string
        description?: string,
        appSid?: string
        displayName?:string
        participantsList?:string[]
    }
}

