import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { FirebaseService } from "./firebase/firebase.service";
import { ConfigurationService } from "service-infrastructure/common/config/configuration.service";
import { UserDataDto } from "../dto/user.data.dto";
export declare class PushNotificationService {
    private readonly logger;
    private readonly config;
    private readonly fireBaseService;
    constructor(logger: MculoggerService, config: ConfigurationService, fireBaseService: FirebaseService);
    sendNotification(callerUserId: string, userData: UserDataDto): Promise<boolean>;
}
