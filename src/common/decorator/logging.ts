import {Inject} from '@nestjs/common';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";

const requiredMetadataKey = Symbol("required");

function getParams(func): Array<string> {

    // String representaation of the function code
    var str = func.toString();

    // Remove comments of the form /* ... */
    // Removing comments of the form //
    // Remove body of the function { ... }
    // removing '=>' if func is arrow function
    str = str.replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/(.)*/g, '')
        .replace(/{[\s\S]*}/, '')
        .replace(/=>/g, '')
        .trim();

    // Start parameter names after first '('
    var start = str.indexOf("(") + 1;

    // End parameter names is just before last ')'
    var end = str.length - 1;

    var result = str.substring(start, end).split(", ");

    var params = new Array<string>();

    result.forEach(element => {

        // Removing any default value
        element = element.replace(/=[\s\S]*/g, '').trim();

        if (element.length > 0)
            params.push(element);
    });

    return params;
}


export function log(bubble = true, level = "info") {

    const injectLogger = Inject(MculoggerService);

    return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {
        injectLogger(target, 'logger'); // this is the same as using constructor(private readonly logger: LoggerService) in a class

        //get original method
        const originalMethod = propertyDescriptor.value;

        let data = originalMethod.toString();

        //redefine descriptor value within own function block
        propertyDescriptor.value = async function (...args: any[]) {
            try {
                this.logger.setContext(target.constructor.name);
                //list parameters
                let params: Array<string> = getParams(originalMethod);
                //let parameters = args.map((arg, index) => ({params[index]:arg}));
                let parameters = args.map((arg, index) => {
                        let param = {};
                        param[params[index]] = arg;
                        return param;
                    });

                this.logger[level](parameters);

                let result: any = await originalMethod.apply(this, args);
                this.logger[level](result);

                return result;
            } catch (error) {
                const logger: MculoggerService = this.logger;

                logger.setContext(target.constructor.name);
                logger.error(error.message, error.stack);

                // rethrow error, so it can bubble up
                if (bubble) {
                    throw error;
                }
            }
        };
    };
}
