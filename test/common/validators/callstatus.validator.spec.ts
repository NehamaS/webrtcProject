import {Test, TestingModule} from '@nestjs/testing';
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {loggerServiceMock} from "../../testutils/test.mock";
import {CallStatusValidator} from "../../../src/common/validators/callstatus.validator";
import {
    API_GW_BAD_FORBIDDEN,
    API_GW_BAD_REQUEST, API_GW_BUSY_HERE, API_GW_GONE, API_GW_NORMAL,
    API_GW_NOT_FOUND,
    API_GW_UNAUTHORIZED, STATUS_ACTION
} from "../../../src/common/constants";

import {ApiGwDto, Body} from "../../../src/dto/api.gw.dto";

describe('CallStatusValidator', () => {
    let service: CallStatusValidator;
    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [CallStatusValidator, {provide: MculoggerService, useValue: loggerServiceMock}
            ]
        }).compile();

        service = module.get<CallStatusValidator>(CallStatusValidator);
    });

    afterEach(() => {
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('Validate happy path ', async () => {
        //sdp should not be mandatory
        let dto: ApiGwDto = new ApiGwDto();
        dto.type = STATUS_ACTION;
        dto.body = <Body>{};
        dto.body.statusCode = API_GW_NORMAL.CODE;
        try {
            service.validate(dto)
        } catch (e) {
            fail("Validator is not validating error cases properly");
        }
    });

    it('Validate missing sdp', async () => {
        //sdp should not be mandatory
        let dto: ApiGwDto = new ApiGwDto();
        dto.type = STATUS_ACTION;
        dto.body = <Body>{};
        try {
            service.validate(dto)
            fail("Status code is mandatory");
        } catch (e) {
            expect(e.message).toContain("statusCode");
            console.debug(e);
        }
    });
});
