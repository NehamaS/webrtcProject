import {Injectable} from "@nestjs/common";
import {IValidator} from "./validator";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ApiGwDto} from "../../dto/api.gw.dto";
import {BaseValidator} from "./base.validator";

@Injectable()
export class CallStatusValidator extends BaseValidator implements IValidator {

    constructor(readonly logger: MculoggerService) {
        super(logger);
        this.name = 'CallStatusValidator';
    }

    validate(dto: ApiGwDto): void {
        let propertyList: Array<string> = ['statusCode'];
        this.propValidate(propertyList, dto.body);
    }
}