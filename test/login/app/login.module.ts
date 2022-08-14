import {Global, Module} from '@nestjs/common';
import {LoginService} from "./login.service";

@Module({
    imports: [],
    controllers: [],
    providers: [LoginService],
})
export class LoginModule {
}
