import {Module} from '@nestjs/common';
import {FirebaseService} from './firebase.service';
import {FirebaseController} from "./firebase.controller";
import {InfrastructureModule} from "service-infrastructure/infrastructure.module";

@Module({
    providers: [FirebaseService],
    controllers: [FirebaseController],
    exports: [FirebaseService]
})

export class FirebaseModule {
}
