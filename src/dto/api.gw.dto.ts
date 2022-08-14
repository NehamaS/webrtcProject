import {IsNotEmpty, IsString, IsEmail, IsInt, IsOptional, IsNotEmptyObject, ValidateNested, IsArray} from 'class-validator';
import {Type} from "class-transformer";

export class Body {
    @IsString()
    @IsOptional()
    userId?: string
    @IsString()
    @IsOptional()
    deviceId?: string
    @IsString()
    @IsOptional()
    service?: "P2P" | "P2A" | "A2P" | "P2M"
    @IsString()
    @IsOptional()
    protocolVersion?: string
    @IsString()
    @IsOptional()
    clientVersion?: string
    @IsString()
    @IsOptional()
    PNSToken?: string
    @IsString()
    @IsOptional()
    accessToken?: string
    @IsString()
    @IsOptional()
    deviceType?: "ANDROID"|"IOS"|"WEB_BROWSER"|"WEB_DESKTOP";
    @IsString()
    @IsOptional()
    requestMessageId?: string
    @IsString()
    @IsOptional()
    GWVersion?: string
    @IsString()
    @IsOptional()
    action?: string
    @IsString()
    @IsOptional()
    reason?: string
    @IsString()
    @IsOptional()
    sdp?: string
    @IsString()
    @IsOptional()
    statusCode?: string
    @IsString()
    @IsOptional()
    description?: string
    @IsString()
    @IsOptional()
    appSid?: string
    @IsString()
    @IsOptional()
    meetingName?: string
    @IsOptional()
    @IsString({each: true})
    participantsList?: string []
    @IsString()
    @IsOptional()
    organizationId?: string
    @IsString()
    @IsOptional()
    accountId?: string
    @IsString()
    @IsOptional()
    meetingId?: string
}


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
    @IsString()
    @IsOptional()
    meetingId?: string
    @IsNotEmpty()
    @IsString()
    messageId: string
    @IsNotEmpty()
    @IsInt()
    ts: number
    @IsNotEmpty()
    @IsString()
    type: string
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => Body)
    body: Body
}

