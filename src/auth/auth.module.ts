import {forwardRef, Module} from '@nestjs/common';
import {JWTConstants} from "./constants";
import {JwtAuthGuard} from "./guards/jwt.auth.guard";
import {DbModule} from "../common/db/db.module";
import {MetricsService} from "service-infrastructure/metrics/metrics.service";
import {CounterService} from "../metrics/counter.service";
import {WebrtcModule} from "../webrtc.module";

@Module({
    imports: [DbModule, forwardRef(() => WebrtcModule)],
    providers: [JwtAuthGuard],
    exports: [JwtAuthGuard]
})
export class AuthModule {
}
