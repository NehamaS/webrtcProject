export class UserDataDto {
    deviceId?: string
    userId: string
    connectionId: string
    protocolVersion?: string
    accessToken?: string
    PNSToken?: string
    deviceType?: "ANDROID"|"IOS"|"WEB_BROWSER"|"WEB_DESKTOP"
    organizationSid?: string
    accountSid?: string
    appSid?: string
    // appId?: string
}
