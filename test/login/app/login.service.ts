import {Injectable} from '@nestjs/common';
import {Auth} from 'aws-amplify';
import jwt_decode from 'jwt-decode';


import {AuthenticationDetails, CognitoUser, CognitoUserPool,} from 'amazon-cognito-identity-js';

import * as AWS from 'aws-sdk';

//import { AuthenticationDetails, CognitoUser, CognitoUserAttribute, CognitoUserPool } from 'amazon-cognito-identity-js';

export interface IUserToken {
    accessToken: string;
    refreshToken: string;
    idToken: string
}

export const APP_NAME: string = 'CPaaS WebRTC Gateway';

@Injectable()
export class LoginService {
    private userPool: CognitoUserPool;
    private userName: string;

    constructor() {
        AWS.config.region = 'us-east-2';
        this.userPool = new CognitoUserPool({
            UserPoolId: process.env.USER_POOL_ID || "us-east-2_xNvcYm7hX",
            ClientId: process.env.CLIENT_ID || "7hhd588bjms6ek6pci1vtkj010",
        });

        this.userName = "cpaas.development.account";
    }

    public async doLogin(): Promise<IUserToken> {

        let userData = {
            Username: this.userName, // your username here
            Pool: this.userPool
        };

        let authenticationData = {
            Username: this.userName,
            Password: 'Mavenir@123'
        };
        var authenticationDetails = new AuthenticationDetails(authenticationData);
        var cognitoUser = new CognitoUser(userData);
        return new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {
                    console.log('Access Token:', jwt_decode(result.getAccessToken().getJwtToken()));
                    console.log('Id Token:', jwt_decode(result.getIdToken().getJwtToken()));
                    console.log('Refresh Token:', result.getRefreshToken().getToken());
                    return resolve(<IUserToken>{
                        accessToken: result.getAccessToken().getJwtToken(),
                        refreshToken: result.getRefreshToken().getToken(),
                        idToken: result.getIdToken().getJwtToken()
                    });
                },
                onFailure: function (err) {
                    console.error(err);
                    return reject(err);
                }
            });
        });
    }


    public async signIn(account: string, token: string): Promise<any> {
        try {
            const user = await Auth.signIn(account, token);
            console.log(user);
            return user;
        } catch (error) {
            console.log('error signing in', error);
        }
    }

    public async signInWithCognito(userInfo: { email: string, password: string }): Promise<IUserToken | { userConfirmationNecessary: boolean }> {
        return new Promise((resolve, reject) => {
            const cognitoUser = new CognitoUser({
                Username: userInfo.email,
                Pool: this.userPool,
            });

            const authenticationDetails = new AuthenticationDetails({
                Username: userInfo.email,
                Password: userInfo.password,
            });
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: (session, userConfirmationNecessary) => {
                    if (userConfirmationNecessary) {
                        console.warn("Confirmation required!!!");
                        return resolve({userConfirmationNecessary});
                    }
                    return resolve({
                        accessToken: session.getAccessToken().getJwtToken(),
                        refreshToken: session.getRefreshToken().getToken(),
                        idToken: session.getIdToken().getJwtToken(),
                    });
                },
                onFailure: (err) => {
                    reject(err);
                },
            });
        });
    }

    public login() {
        AWS.config.region = 'us-east-2';
        let poolId: string = "us-east-2_xNvcYm7hX"
        let clientId: string = "7hhd588bjms6ek6pci1vtkj010";
        let userName: string = "cpaas.development.account";

        let poolData = {
            UserPoolId: poolId, // your user pool id here
            ClientId: clientId // your client id here
        };
        let userPool = new CognitoUserPool(poolData);

        let userData = {
            Username: userName, // your username here
            Pool: userPool
        };


        // var attributeList = [];
        //
        // var dataEmail = {
        //     Name : 'email',
        //     Value : '...' // your email here
        // };
        // var dataPhoneNumber = {
        //     Name : 'phone_number',
        //     Value : '...' // your phone number here with +country code and no delimiters in front
        // };
        // var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail);
        // var attributePhoneNumber = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataPhoneNumber);
        //
        // attributeList.push(attributeEmail);
        // attributeList.push(attributePhoneNumber);

        let authenticationData = {
            Username: userName,
            Password: 'Mavenir@123'
        };
        var authenticationDetails = new AuthenticationDetails(authenticationData);
        var cognitoUser = new CognitoUser(userData);
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                console.log('Access Token:' + JSON.stringify(jwt_decode(result.getAccessToken().getJwtToken())));
                console.log('Id Token + ' + JSON.stringify(jwt_decode(result.getIdToken().getJwtToken())));
                console.log('Refresh Token + ' + JSON.stringify(result.getRefreshToken().getToken()));
            },
            onFailure: function (err) {
                console.error(err);
            }
        });

        // var cognitoUser;
        // userPool.signUp('username', 'password', attributeList, null, function(err, result){
        //     if (err) {
        //         alert(err);
        //         return;
        //     }
        //     cognitoUser = result.user;
        //     console.log('user name is ' + cognitoUser.getUsername());
        // });
    }
}


