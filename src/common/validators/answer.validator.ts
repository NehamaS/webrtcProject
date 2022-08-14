import {Injectable} from "@nestjs/common";
import {IValidator} from "./validator";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ApiGwDto} from "../../dto/api.gw.dto";
import {BaseValidator} from "./base.validator";

@Injectable()
export class AnswerValidator extends BaseValidator implements IValidator {

    constructor(readonly logger: MculoggerService) {
        super(logger)
        this.name = 'AnswerValidator'
    }

    validate(dto: ApiGwDto): void {
        let propertyList: Array<string> = ['sdp']
        this.propValidate(propertyList, dto.body)
    }
}
