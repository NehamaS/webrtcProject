import {ArgumentMetadata, BadRequestException, Injectable, PipeTransform, HttpStatus} from '@nestjs/common';
import {validate} from 'class-validator';
import {plainToClass} from 'class-transformer';
import * as _ from 'lodash'
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ErrorBuilder} from "../error.builder";




@Injectable()
export class ValidationPipe implements PipeTransform<any> {

    constructor(private readonly logger: MculoggerService,
                private readonly errorBuilder: ErrorBuilder) {
    }

    async transform(value: any, {metatype}: ArgumentMetadata) {

        if (!metatype || !this.toValidate(metatype)) {
            return value;
        }
        const object = plainToClass(metatype, value);
        const ValidationErrors = await validate(object, {validationError: {value: true, target: true}});
        if (ValidationErrors.length > 0) {
            _.forEach(ValidationErrors, (e) => {
                this.logger.error({
                    msg: `ValidationErrors, ${ValidationErrors.length}`,
                    errors: `${e.toString()}`
                })
            });

            throw new BadRequestException(this.errorBuilder.buildErrorResponseWsRequestDto(value,HttpStatus.BAD_REQUEST.toString(), 'Message body validation failed, incorrect params'));
        }
        return value;
    }

    private toValidate(metatype: Function): boolean {
        const types: Function[] = [String, Boolean, Number, Array, Object];
        return !types.includes(metatype);
    }
}
