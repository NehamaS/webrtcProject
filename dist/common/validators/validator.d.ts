import { ApiGwDto } from "../../dto/api.gw.dto";
export interface IValidator {
    validate(dto: ApiGwDto): void;
}
