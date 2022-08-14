import {Module} from "@nestjs/common";
import {CdrService} from "./cdr.service";

@Module({
    imports: [],
    providers: [CdrService],
    exports: [CdrService]
})

export class CdrServiceModule {
}