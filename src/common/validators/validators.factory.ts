import {Inject, Injectable} from "@nestjs/common";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {
    REGISTER_ACTION,
    START_ACTION,
    STATUS_ACTION,
    TERMINATE_ACTION,
    TERMINATE_ACK_ACTION,
    ANSWER_ACTION,
    MODIFY_ACTION,
    MODIFY_ACTION_ACK,
    RESUME_ACTION,
    RESUME_ACTION_ACK,
    HOLD_ACTION,
    HOLD_ACTION_ACK,
} from "../constants";
import {IValidator} from "./validator";
import {RegisterValidator} from "./register.validator";
import {CallStartValidator} from "./callstart.validator";
import {BaseValidator} from "./base.validator";
import {CallStatusValidator} from "./callstatus.validator";
import {TerminateValidator} from "./terminate.validator";
import {AnswerValidator} from "./answer.validator";
import {ModifyValidator} from "./modify.validator";
import {ModifyAckValidator} from "./modifyack.validator";
import {TerminateAckValidator} from "./terminateack.validator";

@Injectable()
export class ValidatorsFactory {
    constructor(private readonly logger: MculoggerService,
                private readonly registerValidator: RegisterValidator,
                private readonly callStartValidator: CallStartValidator,
                private readonly callStatusValidator: CallStatusValidator,
                private readonly terminateValidator: TerminateValidator,
                private readonly answerValidator: AnswerValidator,
                private readonly modifyValidator: ModifyValidator,
                private readonly modifyAckValidator: ModifyAckValidator,
                private readonly terminateAckValidator: TerminateAckValidator,
                private readonly baseValidator: BaseValidator
    ) {
    }

    getValidator(action: string): IValidator {
        switch (action) {
            case REGISTER_ACTION:
                return this.registerValidator
            case START_ACTION:
                return this.callStartValidator
            case STATUS_ACTION:
                return this.callStatusValidator
            case TERMINATE_ACTION:
                return this.terminateValidator
            case TERMINATE_ACK_ACTION:
                return this.terminateAckValidator
            case HOLD_ACTION:
            case RESUME_ACTION:
            case MODIFY_ACTION:
                return this.modifyValidator
            case HOLD_ACTION_ACK:
            case RESUME_ACTION_ACK:
            case MODIFY_ACTION_ACK:
                return this.modifyAckValidator
            default:
                return this.baseValidator
        }
    }
}