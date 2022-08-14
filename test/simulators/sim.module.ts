import {Module} from "@nestjs/common";
import {SipRestComServer} from "./sip.restcom.server";

@Module({
    imports: [],
    controllers: [SipRestComServer],
    providers: []
})

export class SipSimModule {
}
