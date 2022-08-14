import {Module} from "@nestjs/common";
import {RestcommSimulator} from "../simulators/restcomm.simulator";
import {HttpSimulator} from "../simulators/http.simulator";

@Module({
    providers: [RestcommSimulator, HttpSimulator /*Client ws simulator*/],
    exports: [RestcommSimulator, HttpSimulator]
})
export class E2eModule {

}
