"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidatorsModule = void 0;
const common_1 = require("@nestjs/common");
const register_validator_1 = require("./register.validator");
const callstart_validator_1 = require("./callstart.validator");
const validators_factory_1 = require("./validators.factory");
const base_validator_1 = require("./base.validator");
const callstatus_validator_1 = require("./callstatus.validator");
const terminate_validator_1 = require("./terminate.validator");
const answer_validator_1 = require("./answer.validator");
const modify_validator_1 = require("./modify.validator");
const modifyack_validator_1 = require("./modifyack.validator");
const terminateack_validator_1 = require("./terminateack.validator");
let ValidatorsModule = class ValidatorsModule {
};
ValidatorsModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        providers: [
            validators_factory_1.ValidatorsFactory,
            register_validator_1.RegisterValidator,
            callstart_validator_1.CallStartValidator,
            callstatus_validator_1.CallStatusValidator,
            terminate_validator_1.TerminateValidator,
            answer_validator_1.AnswerValidator,
            modify_validator_1.ModifyValidator,
            modifyack_validator_1.ModifyAckValidator,
            terminateack_validator_1.TerminateAckValidator,
            base_validator_1.BaseValidator
        ],
        exports: [validators_factory_1.ValidatorsFactory]
    })
], ValidatorsModule);
exports.ValidatorsModule = ValidatorsModule;
//# sourceMappingURL=validators.module.js.map