import {forwardRef, Global, Module} from '@nestjs/common';
import {WssController} from "./wss.controller";
import {WssAdminModule} from "../admin/wss.admin.module";
import {WebrtcModule} from "../../webrtc.module";

@Global()
@Module({
    imports: [WssAdminModule, forwardRef(() => WebrtcModule)],
    providers: [WssController],
    exports: [WssController]
})
export class WssModule {
}
