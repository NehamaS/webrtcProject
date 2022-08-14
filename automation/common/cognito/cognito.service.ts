import { CognitoUser} from 'amazon-cognito-identity-js';
import { Session,IUserToken } from "../dto/sipSessionDTO";
import {REGION,USER_SRP_AUTH} from '../constants';
import Amplify, {Auth} from 'aws-amplify';
import logger from "cucumber-tsflow/dist/logger";
import { Context } from "../context";
export class CognitoService {

    public async cognitoAuth(session: Session): Promise<IUserToken> {
        Amplify.configure({
            Auth: {
                region: REGION,
                userPoolId: session.cognito.userPoolId,
                userPoolWebClientId: session.cognito.userPoolWebClientId,
                authenticationFlowType: USER_SRP_AUTH,
            },
        });

        global.logger.info({
            test:  global.logger["context"].current,
            step: this.cognitoAuth.name,
            action: `Get token from Cognito`
        });

        try {
            let user: CognitoUser = await Auth.signIn(
                {
                    username: session.cognito.AccountId, //Accountid
                    password: session.cognito.AccountToken, //AccountToken
                },
                undefined,
                {
                    "custom:applicationSid": session.restcommApplication.appSid,
                    "custom:deviceId": session.deviceId,
                    "custom:userId": session.userId,
                },
            );

            return <IUserToken>{
                accessToken: user.getSignInUserSession().getAccessToken().getJwtToken(),
                idToken: user.getSignInUserSession().getIdToken().getJwtToken(),
                refreshToken: user.getSignInUserSession().getRefreshToken().getToken()
            };

        } catch (e) {
            global.logger.error({
                test:  global.logger["context"].current,
                step: this.cognitoAuth.name,
                error: e
            });
        }
    }
}