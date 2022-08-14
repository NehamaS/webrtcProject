import {Test, TestingModule} from '@nestjs/testing';
import {INestApplication} from '@nestjs/common';
import * as request from 'supertest';
import {constants} from "http2";
import {LoginModule} from "./app/login.module";
import {IUserToken, LoginService} from "./app/login.service";
import Amplify, { Auth } from 'aws-amplify';

//import config from './aws.cfg';

jest.setTimeout(50000);

describe('WebRTCGateway (integration)', () => {
    let app: INestApplication;
    let service: LoginService;

    beforeAll(async () => {
        console.log("starting test app...");
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [LoginModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        service = moduleFixture.get<LoginService>(LoginService);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    })

    const ACCOUNT: string = "AC288a940234b0d31aaa9df865acc8e381";
    const TOKEN: string = "0c4d5959376500dd23d4b3a39126ec48";

    it('GET account details', async () => {
        /*curl -X GET https://cloud.restcomm.com/restcomm/2012-04-24/Accounts/AC288a940234b0d31aaa9df865acc8e381.json -u 'AC288a940234b0d31aaa9df865acc8e381:0c4d5959376500dd23d4b3a39126ec48'*/
        let account = await request("https://usstaging.restcomm.com//restcomm/2012-04-24/")
            .get(`Accounts/${ACCOUNT}.json`)
            .auth(ACCOUNT, TOKEN)
            .expect(constants.HTTP_STATUS_OK);

        expect(account).toBeDefined();
        expect(account.body).toBeDefined();
        console.log(account.body);
    });

    it('Login (cognito)', async () => {
        //let user :any  = await service.signInWithCognito({email:ACCOUNT, password: TOKEN});
        let user : IUserToken  = await service.doLogin();
        expect(user).toBeDefined();
    });
});
