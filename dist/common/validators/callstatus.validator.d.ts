import { IValidator } from "./validator";
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ApiGwDto } from "../../dto/api.gw.dto";
import { BaseValidator } from "./base.validator";
export declare class CallStatusValidator extends BaseValidator implements IValidator {
    readonly logger: MculoggerService;
    constructor(logger: MculoggerService);
    validate(dto: ApiGwDto): void;
}
