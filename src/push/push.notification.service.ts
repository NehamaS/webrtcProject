import {Injectable} from '@nestjs/common';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {FirebaseService} from "./firebase/firebase.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {UserDataDto} from "../dto/user.data.dto";

@Injectable()
export class PushNotificationService {

    constructor(private readonly logger: MculoggerService,
                private readonly config: ConfigurationService,
                private readonly fireBaseService: FirebaseService) {
    }

    public async sendNotification (callerUserId: string, userData: UserDataDto): Promise<boolean> {
        return await this.fireBaseService.sendNotification(callerUserId, userData);
    }
}
