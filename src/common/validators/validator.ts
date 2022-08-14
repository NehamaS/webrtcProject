import {WsRequestDto} from "../../dto/ws.request.dto";
import {ApiGwDto} from "../../dto/api.gw.dto";

export interface IValidator {
    validate(dto: ApiGwDto):  void
}