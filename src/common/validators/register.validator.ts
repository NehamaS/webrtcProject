import {Injectable} from "@nestjs/common";
import {IValidator} from "./validator";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ApiGwDto} from "../../dto/api.gw.dto";
import {BaseValidator} from "./base.validator";

@Injectable()
export class RegisterValidator extends BaseValidator implements IValidator {

    constructor( readonly logger: MculoggerService) {
        super(logger)
        this.name = "RegisterValidator";
    }

    validate(dto: ApiGwDto): void {
        let propertyList: Array<string> = ['protocolVersion', 'clientVersion','deviceId', 'deviceType' ]
        this.propValidate(propertyList, dto.body)
    }
}
