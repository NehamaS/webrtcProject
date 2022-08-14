import logger from "cucumber-tsflow/dist/logger";
import {Context} from "./context"

export interface JestMatchResponse {
    message: string;
    pass: boolean;
}

expect.extend({
    handleException: function (expected: any) {
        const pass: boolean = typeof expected === "undefined";
        let errMsg : string = `${pass ? "[Exception]" : "[Error]"} ${expected}`;
        return {
            message: () => expected.ctx ? `[${expected.ctx.current}]: ${errMsg}` : errMsg,
            pass: pass,
        };
    },
});

declare global {
    namespace jest {
        interface Matchers<R> {
            handleException(): JestMatchResponse;
        }

        interface Expect {
            handleException(): JestMatchResponse;
        }
    }
}


export function initUtils() {
    let PARAMS = {};
    ["CPAAS_HOME", "TAGS", "CPAAS_APP_URL", "PROFILE"].map((envPrm: string)=>{
        PARAMS[envPrm] = process.env[envPrm];
    });
    logger.trace({
        step:initUtils.name,
        action: `Initializing... Environment:  ${JSON.stringify(PARAMS)}`
    });
}
