import { IValidator } from "./validator";
import { ApiGwDto } from "../../dto/api.gw.dto";
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
export declare class BaseValidator implements IValidator {
    protected readonly logger: MculoggerService;
    protected name: string;
    constructor(logger: MculoggerService);
    validate(dto: ApiGwDto): void;
    protected propValidate(propertyList: Array<string>, body: any): void;
    private action;
}
