import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

// AWS Region
const AWS_REGION = process.env['AWS_REGION'] || 'us-east-1';

// Cognito Client - AWS SDK sẽ tự động lấy credentials từ:
// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
// 2. ~/.aws/credentials file (hoặc C:\Users\<username>\.aws\credentials trên Windows)
// 3. IAM role (nếu chạy trên EC2/ECS/Lambda)
export const cognitoClient = new CognitoIdentityProviderClient({
    region: AWS_REGION,
});

console.log('[Cognito Config] Using AWS Cognito (Region:', AWS_REGION + ')');

// User Pool ID và Client ID (sẽ được người khác cung cấp)
export const USER_POOL_ID = process.env['COGNITO_USER_POOL_ID'] || '';
export const CLIENT_ID = process.env['COGNITO_CLIENT_ID'] || '';

// Validate required config
if (!USER_POOL_ID || !CLIENT_ID) {
    console.warn('COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required in .env file');
} else {
    console.log('[Cognito Config] User Pool ID:', USER_POOL_ID);
    console.log('[Cognito Config] Client ID:', CLIENT_ID.substring(0, 10) + '...');
}