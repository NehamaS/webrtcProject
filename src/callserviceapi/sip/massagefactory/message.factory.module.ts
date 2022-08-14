import { forwardRef, Module } from '@nestjs/common';
import { MessageFactory } from "./message.factory";
import {  Retransmissions } from "./retransmissions";
import {SipModule} from "../sip.module";
import {MsmlFactory} from "./msml.factory";


@Module({
    imports: [forwardRef(() => SipModule)],
    providers: [MessageFactory, Retransmissions, MsmlFactory],
    exports: [MessageFactory, Retransmissions, MsmlFactory]
})
export class MessageFactoryModule {}