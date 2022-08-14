import {Module} from '@nestjs/common';
import {RegisterValidator} from "./register.validator";
import {CallStartValidator} from "./callstart.validator";
import {ValidatorsFactory} from "./validators.factory";
import {BaseValidator} from "./base.validator";
import {CallStatusValidator} from "./callstatus.validator";
import {TerminateValidator} from "./terminate.validator";
import {AnswerValidator} from "./answer.validator";
import {ModifyValidator} from "./modify.validator";
import {ModifyAckValidator} from "./modifyack.validator";
import {TerminateAckValidator} from "./terminateack.validator";

@Module({
    imports: [],
    providers: [
        ValidatorsFactory,
        RegisterValidator,
        CallStartValidator,
        CallStatusValidator,
        TerminateValidator,
        AnswerValidator,
        ModifyValidator,
        ModifyAckValidator,
        TerminateAckValidator,
        BaseValidator
    ],
    exports: [ValidatorsFactory]
})
export class ValidatorsModule {
}
