import {forwardRef, Global, Module} from '@nestjs/common';
import {WssAdmin} from "../admin/wss.admin";
import {WebrtcModule} from "../../webrtc.module";

@Global()
@Module({
    imports: [],
    providers: [WssAdmin],
    exports: [WssAdmin]
})
export class WssAdminModule {
}
