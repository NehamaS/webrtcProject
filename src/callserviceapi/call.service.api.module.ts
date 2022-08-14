import {forwardRef, Module} from '@nestjs/common';
import {RestcommModule} from "./restcomm/restcomm.module";
import {CallServiceApiImpl} from "./call.service.api";
import {One2oneModule} from "./one2one/one2one.module";
import {ConferenceModule} from "./conference/conference.module";
import {SipModule} from "./sip/sip.module";


@Module({
    imports: [RestcommModule, forwardRef(() => One2oneModule), ConferenceModule, forwardRef(() => SipModule)],
    providers: [CallServiceApiImpl],
    exports: [CallServiceApiImpl]
})
export class CallServiceApiModule {}
