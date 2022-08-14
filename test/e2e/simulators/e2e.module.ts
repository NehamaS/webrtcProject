import {Module} from "@nestjs/common";
import {WsSimController} from "./ws.sim.controller";

@Module({
    imports: [],
    controllers: [WsSimController],
    providers: []
})

export class E2eModule {

}
