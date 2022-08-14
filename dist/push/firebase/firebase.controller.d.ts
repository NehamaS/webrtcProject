import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { FirebaseService } from "./firebase.service";
import { httpRequestDto } from "./data.message";
export declare class FirebaseController {
    private readonly logger;
    private readonly firebaseService;
    constructor(logger: MculoggerService, firebaseService: FirebaseService);
    push(event: httpRequestDto): Promise<boolean>;
}
