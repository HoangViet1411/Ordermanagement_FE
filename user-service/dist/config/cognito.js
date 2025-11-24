"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLIENT_ID = exports.USER_POOL_ID = exports.cognitoClient = void 0;
const client_cognito_identity_provider_1 = require("@aws-sdk/client-cognito-identity-provider");
const AWS_REGION = process.env['AWS_REGION'] || 'us-east-1';
exports.cognitoClient = new client_cognito_identity_provider_1.CognitoIdentityProviderClient({
    region: AWS_REGION,
});
console.log('[Cognito Config] Using AWS Cognito (Region:', AWS_REGION + ')');
exports.USER_POOL_ID = process.env['COGNITO_USER_POOL_ID'] || '';
exports.CLIENT_ID = process.env['COGNITO_CLIENT_ID'] || '';
if (!exports.USER_POOL_ID || !exports.CLIENT_ID) {
    console.warn('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required in .env file');
}
else {
    console.log('[Cognito Config] User Pool ID:', exports.USER_POOL_ID);
    console.log('[Cognito Config] Client ID:', exports.CLIENT_ID.substring(0, 10) + '...');
}
//# sourceMappingURL=cognito.js.map