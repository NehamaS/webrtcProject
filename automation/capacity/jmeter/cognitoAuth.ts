 import {CognitoService} from "../../common/cognito/cognito.service"
 import {CognitoDetails, IUserToken, Session} from "../../common/dto/sipSessionDTO";
 import {COGNITO_DETAILS_ENV} from "../../common/constants";
 import fs from "fs";

 const TOKEN_PATH=`${process.env.WORKSPACE}/webrtcgw-git/automation/capacity/jmeter/jmeterConfig/token.txt`


   async function cognitoAuth() {

        const session: Session = new Session();
        let cognitoSrv: CognitoService = new CognitoService();

        const env: Array<CognitoDetails> = COGNITO_DETAILS_ENV.filter(
            env => env.name == 'webrtc-staging.restcomm.com'
        );

        session.cognito=env[0].cognito
        session.restcommApplication=env[0].restcommApplication
        const token = await cognitoSrv.cognitoAuth(session)
        await fs.promises.writeFile(TOKEN_PATH, JSON.stringify(token.idToken));
    }

    cognitoAuth()

