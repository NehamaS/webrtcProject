import { forwardRef, Module } from '@nestjs/common';
import { RestcommService } from "./restcomm.service";
import {SipModule} from "../sip/sip.module";
import {WebrtcModule} from "../../webrtc.module";
import {DbModule} from "../../common/db/db.module";


@Module({
    imports: [forwardRef(() => SipModule), forwardRef(() => WebrtcModule), DbModule],
    providers: [RestcommService],
    exports: [RestcommService]
})
export class RestcommModule {}
