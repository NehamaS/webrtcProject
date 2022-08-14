import {Inject} from "@nestjs/common";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {WsRequestDto} from "../../dto/ws.request.dto";
import {ApiGwDto} from "../../dto/api.gw.dto";

const KIND_MEHTOD = "method";

export function dtoanlayze() {
    const injectLogger = Inject(MculoggerService);
    const injectConfig = Inject(ConfigurationService);

    return (target: any, propertyKey: string, propertyDescriptor: PropertyDescriptor) => {

        injectLogger(target, 'logger'); // this is the same as using constructor(private readonly logger: LoggerService) in a class
        injectConfig(target, 'config');

        //get original method
        const originalMethod = propertyDescriptor.value;

        //redefine descriptor value within own function block
        propertyDescriptor.value = async function (...args: any[]) {
            this.logger.setContext(target.constructor.name);
            let params = args.map((arg) => {
                if ((arg instanceof WsRequestDto) || //Instance of WsRequestDto
                    (!["connectionId", "dto"].some(attr => !Object.prototype.hasOwnProperty.call(arg, attr))) /*contain hte attribute the dto should contain*/) {
                    //Phase 1, no auth support on restromm => from must be from "unknowd" domain
                    this.logger.debug({action: "dto.analyzer", description: "override from domain"});
                    let allow: boolean = this.config.get("auth.domain.allow", true);
                    if (!allow) {
                        let domain: string = this.config.get("auth.domain.suffix", "webrtc.com");

                        let dto: ApiGwDto = <ApiGwDto>arg.dto;
                        dto.source = `${dto.source.split("@")[0]}@${domain}`;
                    }
                }
                return arg
            });


            let result: any = await originalMethod.apply(this, args);
            return result;
        };
    };

}
