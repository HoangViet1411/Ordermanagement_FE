"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const amazon_cognito_identity_js_1 = require("amazon-cognito-identity-js");
const cognito_1 = require("../config/cognito");
class AuthService {
    async signUp(data) {
        try {
            const command = new client_cognito_identity_provider_1.SignUpCommand({
                ClientId: cognito_1.CLIENT_ID,
                Username: data.email,
                Password: data.password,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: data.email,
                    },
                ],
            });
            const response = await cognito_1.cognitoClient.send(command);
            if (!response.UserSub) {
                throw new Error('Failed to create user');
            }
            return {
                userId: response.UserSub,
                email: data.email,
            };
        }
        catch (error) {
            if (error.name === 'UsernameExistsException') {
                throw new Error('User with this email already exists');
            }
            if (error.name === 'InvalidPasswordException') {
                throw new Error(error.message || 'Password does not meet requirements');
            }
            if (error.name === 'InvalidParameterException') {
                throw new Error(error.message || 'Invalid parameters provided');
            }
            if (error.name === 'ResourceNotFoundException') {
                throw new Error('Cognito User Pool or Client not found. Please check your configuration.');
            }
            throw error;
        }
    }
    async signIn(data) {
        try {
            const authenticationHelper = new amazon_cognito_identity_js_1.AuthenticationHelper(cognito_1.USER_POOL_ID.split('_')[1]);
            const largeAValue = await new Promise((resolve, reject) => {
                try {
                    authenticationHelper.getLargeAValue((err, result) => {
                        if (err) {
                            reject(err);
                        }
                        else if (result) {
                            resolve(result);
                        }
                        else {
                            reject(new Error('No result from getLargeAValue'));
                        }
                    });
                }
                catch (error) {
                    reject(error);
                }
            });
            const srpA = largeAValue.toString(16);
            const initiateCommand = new client_cognito_identity_provider_1.InitiateAuthCommand({
                ClientId: cognito_1.CLIENT_ID,
                AuthFlow: 'USER_SRP_AUTH',
                AuthParameters: {
                    USERNAME: data.email,
                    SRP_A: srpA,
                }
            });
            const initiateResponse = await cognito_1.cognitoClient.send(initiateCommand);
            if (initiateResponse.AuthenticationResult) {
                if (!initiateResponse.AuthenticationResult.AccessToken ||
                    !initiateResponse.AuthenticationResult.RefreshToken ||
                    !initiateResponse.AuthenticationResult.IdToken ||
                    typeof initiateResponse.AuthenticationResult.ExpiresIn !== "number") {
                    throw new Error('Authentication failed');
                }
                return {
                    accessToken: initiateResponse.AuthenticationResult.AccessToken,
                    refreshToken: initiateResponse.AuthenticationResult.RefreshToken,
                    idToken: initiateResponse.AuthenticationResult.IdToken,
                    expiresIn: initiateResponse.AuthenticationResult.ExpiresIn
                };
            }
            if (initiateResponse.ChallengeName === 'PASSWORD_VERIFIER' && initiateResponse.ChallengeParameters && initiateResponse.Session) {
                const challengeParams = initiateResponse.ChallengeParameters;
                const srpB = challengeParams['SRP_B'];
                const salt = challengeParams['SALT'];
                const secretBlock = challengeParams['SECRET_BLOCK'];
                const { BigInteger } = require('jsbn');
                const serverBValue = new BigInteger(srpB, 16);
                const saltValue = new BigInteger(salt, 16);
                const passwordAuthenticationKey = await new Promise((resolve, reject) => {
                    try {
                        authenticationHelper.getPasswordAuthenticationKey(data.email, data.password, serverBValue, saltValue, (err, result) => {
                            if (err) {
                                reject(err);
                            }
                            else if (result) {
                                resolve(result);
                            }
                            else {
                                reject(new Error('No result from getPasswordAuthenticationKey'));
                            }
                        });
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                const crypto = require('crypto');
                const message = Buffer.from(cognito_1.USER_POOL_ID.split('_')[1] + data.email + secretBlock, 'utf8');
                const key = Buffer.from(passwordAuthenticationKey, 'hex');
                const hmac = crypto.createHmac('sha256', key);
                hmac.update(message);
                const signature = hmac.digest('base64');
                const now = new Date();
                const timestamp = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').substring(0, 15);
                const challengeCommand = new client_cognito_identity_provider_1.RespondToAuthChallengeCommand({
                    ClientId: cognito_1.CLIENT_ID,
                    ChallengeName: 'PASSWORD_VERIFIER',
                    Session: initiateResponse.Session,
                    ChallengeResponses: {
                        USERNAME: data.email,
                        PASSWORD_CLAIM_SECRET_BLOCK: secretBlock,
                        PASSWORD_CLAIM_SIGNATURE: signature,
                        TIMESTAMP: timestamp,
                    }
                });
                const challengeResponse = await cognito_1.cognitoClient.send(challengeCommand);
                if (!challengeResponse.AuthenticationResult ||
                    !challengeResponse.AuthenticationResult.AccessToken ||
                    !challengeResponse.AuthenticationResult.RefreshToken ||
                    !challengeResponse.AuthenticationResult.IdToken ||
                    typeof challengeResponse.AuthenticationResult.ExpiresIn !== "number") {
                    throw new Error('Authentication failed');
                }
                return {
                    accessToken: challengeResponse.AuthenticationResult.AccessToken,
                    refreshToken: challengeResponse.AuthenticationResult.RefreshToken,
                    idToken: challengeResponse.AuthenticationResult.IdToken,
                    expiresIn: challengeResponse.AuthenticationResult.ExpiresIn
                };
            }
            throw new Error(`Unsupported challenge: ${initiateResponse.ChallengeName || 'Unknown'}`);
        }
        catch (error) {
            if (error.name === 'NotAuthorizedException') {
                throw new Error('Incorrect email or password');
            }
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found');
            }
            if (error.name === 'UserNotConfirmedException') {
                throw new Error('User email is not confirmed. Please verify your email.');
            }
            if (error.name === 'TooManyRequestsException') {
                throw new Error('Too many requests. Please try again later.');
            }
            if (error.name === 'ResourceNotFoundException') {
                throw new Error('Cognito User Pool or Client not found. Please check your configuration.');
            }
            if (error.message && error.message.includes('Auth flow not enabled')) {
                throw new Error('Auth flow not enabled for this client. Please ask the Cognito administrator to enable "ALLOW_USER_SRP_AUTH" in App Client settings.');
            }
            throw error;
        }
    }
    async verifyToken(accessToken) {
        try {
            const command = new client_cognito_identity_provider_1.GetUserCommand({
                AccessToken: accessToken,
            });
            const response = await cognito_1.cognitoClient.send(command);
            const emailAttr = response.UserAttributes?.find((attr) => attr.Name === 'email');
            if (!response.Username || !emailAttr?.Value) {
                throw new Error('Invalid token');
            }
            return {
                userId: response.Username,
                email: emailAttr.Value,
            };
        }
        catch (error) {
            if (error.name === 'NotAuthorizedException') {
                throw new Error('Invalid or expired token');
            }
            if (error.name === 'TokenRefreshRequiredException') {
                throw new Error('Token refresh required');
            }
            throw error;
        }
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
//# sourceMappingURL=authService.js.map