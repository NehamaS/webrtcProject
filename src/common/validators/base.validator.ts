import {IValidator} from "./validator";
import {ApiGwDto} from "../../dto/api.gw.dto";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {Injectable} from "@nestjs/common";

@Injectable()
export class BaseValidator implements  IValidator{
    protected name: string

    constructor(protected readonly logger: MculoggerService) {
    }

    validate(dto: ApiGwDto): void {
        return;
    }

    protected propValidate(propertyList: Array<string>, body){
        propertyList.forEach(property => {
            if (!body.hasOwnProperty(property)) {
                this.action(property)
            }
        })
    }

    private action(property: string) {
        this.logger.error({action: this.name, error: `incorrect request, missing ${property}`})
        throw new Error(`[${this.name}] missing ${property}`)
    }

}