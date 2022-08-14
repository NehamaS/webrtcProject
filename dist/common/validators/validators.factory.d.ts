import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { IValidator } from "./validator";
import { RegisterValidator } from "./register.validator";
import { CallStartValidator } from "./callstart.validator";
import { BaseValidator } from "./base.validator";
import { CallStatusValidator } from "./callstatus.validator";
import { TerminateValidator } from "./terminate.validator";
import { AnswerValidator } from "./answer.validator";
import { ModifyValidator } from "./modify.validator";
import { ModifyAckValidator } from "./modifyack.validator";
import { TerminateAckValidator } from "./terminateack.validator";
export declare class ValidatorsFactory {
    private readonly logger;
    private readonly registerValidator;
    private readonly callStartValidator;
    private readonly callStatusValidator;
    private readonly terminateValidator;
    private readonly answerValidator;
    private readonly modifyValidator;
    private readonly modifyAckValidator;
    private readonly terminateAckValidator;
    private readonly baseValidator;
    constructor(logger: MculoggerService, registerValidator: RegisterValidator, callStartValidator: CallStartValidator, callStatusValidator: CallStatusValidator, terminateValidator: TerminateValidator, answerValidator: AnswerValidator, modifyValidator: ModifyValidator, modifyAckValidator: ModifyAckValidator, terminateAckValidator: TerminateAckValidator, baseValidator: BaseValidator);
    getValidator(action: string): IValidator;
}
