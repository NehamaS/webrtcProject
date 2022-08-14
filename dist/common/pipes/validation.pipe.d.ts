import { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import { MculoggerService } from "service-infrastructure/common/logs/mculogger.service";
import { ErrorBuilder } from "../error.builder";
export declare class ValidationPipe implements PipeTransform<any> {
    private readonly logger;
    private readonly errorBuilder;
    constructor(logger: MculoggerService, errorBuilder: ErrorBuilder);
    transform(value: any, { metatype }: ArgumentMetadata): Promise<any>;
    private toValidate;
}
