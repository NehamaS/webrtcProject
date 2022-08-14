import { forwardRef, Module } from '@nestjs/common';
import { SipService } from "./sip.service";
import { MessageFactory } from "./massagefactory/message.factory";
import { RestcommModule } from "../restcomm/restcomm.module";
import { Retransmissions } from "./massagefactory/retransmissions";
import {DbModule} from "../../common/db/db.module";
import {SipUtils} from "./common/sip.utils";
import {MsmlFactory} from "./massagefactory/msml.factory";


@Module({
    imports: [forwardRef(() => RestcommModule), DbModule],
    providers: [SipService, MessageFactory, MsmlFactory, Retransmissions, SipUtils],
    exports: [SipService, MessageFactory, MsmlFactory, Retransmissions, SipUtils]
})
export class SipModule {}
