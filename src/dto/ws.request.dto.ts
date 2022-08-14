import {IsString, IsNotEmpty, ValidateNested, IsNotEmptyObject } from "class-validator";
import {Type} from "class-transformer";
import {ApiGwDto} from "./api.gw.dto";

export class WsRequestDto{
    @IsNotEmpty()
    @IsString()
    connectionId:string;
    @IsNotEmptyObject()
    @ValidateNested()
    @Type(() => ApiGwDto)
    dto : ApiGwDto;
}


