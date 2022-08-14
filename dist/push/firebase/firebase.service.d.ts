import { OnModuleInit } from '@nestjs/common';
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import * as admin from "firebase-admin";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { UserDataDto } from "../../dto/user.data.dto";
export declare const HEADER_AUTHORIZATION = "Authorization";
export declare class FirebaseService implements OnModuleInit {
    private readonly logger;
    private readonly config;
    private clientTimerFlag;
    private clientTimer;
    private pushTitle;
    private pushBody;
    private restcommConfigFlag;
    constructor(logger: MculoggerService, config: ConfigurationService);
    onModuleInit(): Promise<void>;
    getAccountClient(userData: UserDataDto): Promise<any>;
    getAccountConfig(userData: UserDataDto): Promise<any>;
    getConfigFromRestcomm(userData: UserDataDto): Promise<any>;
    sendNotification(callerUserId: string, userData: UserDataDto): Promise<boolean>;
    buildNotification(callerUserId: string, registrationToken: string): admin.messaging.TokenMessage;
    createClient(accountConfig: any, appID: string): any;
    private getClient;
    deleteClient(appID: string): Promise<void>;
    setClientTimer(appID: string): void;
}
