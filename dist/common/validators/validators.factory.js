"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorsFactory = void 0;
const common_1 = require("@nestjs/common");
const mculogger_service_1 = require("service-infrastructure/common/logs/mculogger.service");
const constants_1 = require("../constants");
const register_validator_1 = require("./register.validator");
const callstart_validator_1 = require("./callstart.validator");
const base_validator_1 = require("./base.validator");
const callstatus_validator_1 = require("./callstatus.validator");
const terminate_validator_1 = require("./terminate.validator");
const answer_validator_1 = require("./answer.validator");
const modify_validator_1 = require("./modify.validator");
const modifyack_validator_1 = require("./modifyack.validator");
const terminateack_validator_1 = require("./terminateack.validator");
let ValidatorsFactory = class ValidatorsFactory {
    constructor(logger, registerValidator, callStartValidator, callStatusValidator, terminateValidator, answerValidator, modifyValidator, modifyAckValidator, terminateAckValidator, baseValidator) {
        this.logger = logger;
        this.registerValidator = registerValidator;
        this.callStartValidator = callStartValidator;
        this.callStatusValidator = callStatusValidator;
        this.terminateValidator = terminateValidator;
        this.answerValidator = answerValidator;
        this.modifyValidator = modifyValidator;
        this.modifyAckValidator = modifyAckValidator;
        this.terminateAckValidator = terminateAckValidator;
        this.baseValidator = baseValidator;
    }
    getValidator(action) {
        switch (action) {
            case constants_1.REGISTER_ACTION:
                return this.registerValidator;
            case constants_1.START_ACTION:
                return this.callStartValidator;
            case constants_1.STATUS_ACTION:
                return this.callStatusValidator;
            case constants_1.TERMINATE_ACTION:
                return this.terminateValidator;
            case constants_1.TERMINATE_ACK_ACTION:
                return this.terminateAckValidator;
            case constants_1.HOLD_ACTION:
            case constants_1.RESUME_ACTION:
            case constants_1.MODIFY_ACTION:
                return this.modifyValidator;
            case constants_1.HOLD_ACTION_ACK:
            case constants_1.RESUME_ACTION_ACK:
            case constants_1.MODIFY_ACTION_ACK:
                return this.modifyAckValidator;
            default:
                return this.baseValidator;
        }
    }
};
ValidatorsFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mculogger_service_1.MculoggerService,
        register_validator_1.RegisterValidator,
        callstart_validator_1.CallStartValidator,
        callstatus_validator_1.CallStatusValidator,
        terminate_validator_1.TerminateValidator,
        answer_validator_1.AnswerValidator,
        modify_validator_1.ModifyValidator,
        modifyack_validator_1.ModifyAckValidator,
        terminateack_validator_1.TerminateAckValidator,
        base_validator_1.BaseValidator])
], ValidatorsFactory);
exports.ValidatorsFactory = ValidatorsFactory;
//# sourceMappingURL=validators.factory.js.map