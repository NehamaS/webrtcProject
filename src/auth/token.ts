export interface Token {
    organizationId: string;
    accountId: string;
    applicationId: string;
    id: string
}


export const TOKEN = {
    ORGANIZATION : "custom:organizationSid",
    ACCOUNT : "custom:accountSid",
    APPLICATION_SID : "custom:applicationSid",
    USER_ID: "custom:userId",
    DEVICE_ID: "custom:deviceId",
    ID : "email",
    NAME : "name",
}
