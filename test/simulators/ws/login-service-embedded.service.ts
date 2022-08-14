import {
    CognitoUserPool,
    CognitoUser,
    AuthenticationDetails,
    IAuthenticationCallback,
    CognitoUserSession,
    IAuthenticationDetailsData, ICognitoUserPoolData,
} from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk';
import Amplify, {Auth} from 'aws-amplify';
import {IUserToken, REGION} from './constant'
import {UserInfo} from "./aws.ws.client";


export class LoginServiceEmbedded {
    private poolData: ICognitoUserPoolData = {
        UserPoolId: "", // Your user pool id here
        ClientId: "" // Your client id here
    }
    private userPool: CognitoUserPool;

    constructor() {
        AWS.config.region = REGION || 'us-east-1';
    }


    public init(cognitoUserPool: string, cognitoClientId: string) {

        try {
            this.poolData.UserPoolId = cognitoUserPool
            this.poolData.ClientId = cognitoClientId
            this.userPool = new CognitoUserPool(this.poolData);
        } catch (e) {
            console.error(e);
        }
    }

    public async amplifySrp(userInfo: UserInfo, changePassword: boolean = false): Promise<IUserToken | undefined> {
        Amplify.configure({
            Auth: {
                region: REGION || 'us-east-1',
                userPoolId: this.poolData.UserPoolId,
                userPoolWebClientId: this.poolData.ClientId,
                authenticationFlowType: 'USER_SRP_AUTH',
            },
        });

        let user: CognitoUser
        try {
            if (changePassword) {
                let resp: any = await Auth.changePassword(userInfo.email, userInfo.password, "1qaz@WSX3edc$RFV");
                console.log(resp);
                return resp
            } else {

                user = await Auth.signIn(
                    {
                        username: userInfo.email, //Accountid
                        password: userInfo.password, //AccountToken
                    },
                    undefined,
                    {
                        "custom:applicationSid": 'AP4434355tomer',
                        "custom:deviceId": userInfo.deviceId,
                        "custom:userId": userInfo.userId
                    }
                );
            }

            console.log(JSON.stringify(user));
            return <IUserToken>{
                accessToken: user.getSignInUserSession().getAccessToken().getJwtToken(),
                idToken: user.getSignInUserSession().getIdToken().getJwtToken(),
                refreshToken: user.getSignInUserSession().getRefreshToken().getToken()
            };
        } catch (e) {
            console.error(e);
        }

        return undefined;
    }

    public async srp(userInfo: {
        email: string;
        password: string;
    }): Promise<IUserToken | undefined> {
        let userData = {
            Username: userInfo.email,
            Pool: this.userPool,
        };
        let authData: IAuthenticationDetailsData = {
            Username: userInfo.email,
            Password: userInfo.password,
            ClientMetadata: {
                appSid: 'AP4434355',
                appToken: 't234567777567',
            },
        };

        let cognitoUser = new CognitoUser(userData);
        let authDetails = new AuthenticationDetails(authData);
        try {
            cognitoUser.setAuthenticationFlowType('USER_SRP_AUTH');
            return new Promise((resolve, reject) => {
                cognitoUser.initiateAuth(authDetails, <IAuthenticationCallback>{
                    onSuccess: (result: CognitoUserSession) => {
                        console.log('Login flow initiated', result);
                        return resolve(<IUserToken>{
                            accessToken: result.getAccessToken().getJwtToken(),
                            idToken: result.getIdToken().getJwtToken(),
                            refreshToken: result.getRefreshToken().getToken(),
                        });
                        //                            reject(new Error("No SRP auth initiated!"));
                    },
                    onFailure: (error) => {
                        reject(error);
                    },
                    customChallenge: (challenge: any) => {
                        console.log('Challenge flow initiated', challenge);
                        cognitoUser.sendCustomChallengeAnswer(
                            undefined,
                            {
                                onSuccess: (result: CognitoUserSession) => {
                                    console.log('Logged in', result);
                                    return resolve(<IUserToken>{
                                        accessToken: result.getAccessToken().getJwtToken(),
                                        idToken: result.getIdToken().getJwtToken(),
                                        refreshToken: result.getRefreshToken().getToken(),
                                    });
                                },
                                onFailure: (error) => {
                                    reject(error);
                                },
                            },
                            {
                                appSid: 'AP4434355',
                                appToken: 't234567777567',
                            },
                        );
                    },
                });
            });
        } catch (e) {
            console.error(e);
        }
        return undefined;
    }
}
