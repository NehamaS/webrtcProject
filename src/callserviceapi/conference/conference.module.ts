import {forwardRef, Module} from '@nestjs/common';
import {ConferenceService} from "./conference.service";
import {WebrtcModule} from "../../webrtc.module";
import {DbModule} from "../../common/db/db.module";
import {SipModule} from "../sip/sip.module";

@Module({
    imports: [forwardRef(() => SipModule), forwardRef(() => WebrtcModule), DbModule],
    providers: [ConferenceService],
    exports: [ConferenceService]
})
export class ConferenceModule {}
