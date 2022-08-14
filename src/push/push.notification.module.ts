import {Module} from '@nestjs/common';
import {PushNotificationService} from "./push.notification.service";
import {FirebaseModule} from "./firebase/firebase.module";

@Module({
    imports: [FirebaseModule],
    providers: [PushNotificationService],
    exports: [PushNotificationService]
})

export class PushNotificationModule {
}