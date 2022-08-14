import {forwardRef, Module} from '@nestjs/common';
import {One2OneService} from "../one2one/one2one.service";
import {WebrtcModule} from "../../webrtc.module";

@Module({
    imports: [forwardRef(() => WebrtcModule)],
    providers: [One2OneService],
    exports: [One2OneService]
})
export class One2oneModule {}
