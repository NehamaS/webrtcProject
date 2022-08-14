import {JwtAuthGuard} from "../../../src/auth/guards/jwt.auth.guard";
import {Test, TestingModule} from "@nestjs/testing";
import {MculoggerService} from "service-infrastructure/common/logs/mculogger.service";
import {configServiceMock, CounterServiceMock, dbMock, loggerServiceMock} from "../../testutils/test.mock";
import {DbService} from "../../../src/common/db/db.service";
import {ACCESS_TOKEN} from "../../testutils/constants";
import {ConfigurationService} from "service-infrastructure/common/config/configuration.service";
import {UserDataDto} from "../../../src/dto/user.data.dto";
import {CounterService} from "../../../src/metrics/counter.service";

describe('JwtAuthGuard: JWT token busines logic', () => {
    let service: JwtAuthGuard;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [JwtAuthGuard,
                {provide: MculoggerService, useValue: loggerServiceMock},
                {provide: DbService, useValue: dbMock},
                {provide: ConfigurationService, useValue: configServiceMock},
                {provide: CounterService, useValue: CounterServiceMock}
            ]
        }).compile();

        service = module.get<JwtAuthGuard>(JwtAuthGuard);
    });

    it('Parse JWT token', () => {
        let res: UserDataDto = service["parseToken"](ACCESS_TOKEN);
        expect(res).toBeDefined();
        expect(res.accountSid).toBeDefined();
        expect(res.userId).toBeDefined();
        expect(res.deviceId).toBeDefined();
        expect(res.accessToken).toBeDefined();
        expect(res.organizationSid).toBeDefined();
        expect(res.accountSid).toBeDefined();
        expect(res.appSid).toBeDefined();
    });
});
