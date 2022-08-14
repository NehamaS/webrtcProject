import {forwardRef, Global, Module} from '@nestjs/common';
import {WsController} from "./ws.controller";
import {WssAdminModule} from "../admin/wss.admin.module";
import {WebrtcModule} from "../../webrtc.module";

@Global()
@Module({
    imports: [WssAdminModule, forwardRef(() => WebrtcModule)],
    providers: [WsController],
    exports: [WsController]
})
export class WsModule {
}
