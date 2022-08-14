import {UserDataDto} from "../../dto/user.data.dto";

export interface DataMessage {
    [key: string]: string;
    action: string;
    userId: string;
}

export interface httpRequestDto {
    callerUserId: string;
    userData: UserDataDto
}


/*******
 *   firebase interface
 * 
 * export interface BaseMessage {
    data?: {
        [key: string]: string;
    };
    notification?: Notification;
    android?: AndroidConfig;
    webpush?: WebpushConfig;
    apns?: ApnsConfig;
    fcmOptions?: FcmOptions;
}
export interface TokenMessage extends BaseMessage {
    token: string;
}
export interface TopicMessage extends BaseMessage {
    topic: string;
}
export interface ConditionMessage extends BaseMessage {
    condition: string;
}*/