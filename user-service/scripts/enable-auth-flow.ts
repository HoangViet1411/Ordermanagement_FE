import { CognitoIdentityProviderClient, DescribeUserPoolClientCommand, UpdateUserPoolClientCommand } from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const USER_POOL_ID = process.env['COGNITO_USER_POOL_ID'] || '';
const CLIENT_ID = process.env['COGNITO_CLIENT_ID'] || '';
const AWS_REGION = process.env['AWS_REGION'] || 'us-east-1';

async function enableAuthFlow() {
    if (!USER_POOL_ID || !CLIENT_ID) {
        console.error('❌ COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID are required in .env file');
        process.exit(1);
    }

    const client = new CognitoIdentityProviderClient({ region: AWS_REGION });

    try {
        console.log('📋 Fetching current App Client settings...');
        console.log('   User Pool ID:', USER_POOL_ID);
        console.log('   Client ID:', CLIENT_ID);

        // Step 1: Get current Client settings
        const describeCommand = new DescribeUserPoolClientCommand({
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
        });

        const currentClient = await client.send(describeCommand);
        
        if (!currentClient.UserPoolClient) {
            throw new Error('App Client not found');
        }

        const existingClient = currentClient.UserPoolClient;
        console.log('✅ Current auth flows:', existingClient.ExplicitAuthFlows || []);

        // Check if ALLOW_USER_PASSWORD_AUTH is already enabled
        const currentFlows = existingClient.ExplicitAuthFlows || [];
        if (currentFlows.includes('ALLOW_USER_PASSWORD_AUTH')) {
            console.log('✅ ALLOW_USER_PASSWORD_AUTH is already enabled!');
            return;
        }

        // Step 2: Update Client with ALLOW_USER_PASSWORD_AUTH enabled
        console.log('🔧 Updating App Client to enable ALLOW_USER_PASSWORD_AUTH...');

        const updateCommand = new UpdateUserPoolClientCommand({
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
            ClientName: existingClient.ClientName,
            ExplicitAuthFlows: [
                ...currentFlows,
                'ALLOW_USER_PASSWORD_AUTH',
            ],
            // Preserve other existing settings
            RefreshTokenValidity: existingClient.RefreshTokenValidity,
            AccessTokenValidity: existingClient.AccessTokenValidity,
            IdTokenValidity: existingClient.IdTokenValidity,
            TokenValidityUnits: existingClient.TokenValidityUnits,
            ReadAttributes: existingClient.ReadAttributes,
            WriteAttributes: existingClient.WriteAttributes,
            PreventUserExistenceErrors: existingClient.PreventUserExistenceErrors,
            EnableTokenRevocation: existingClient.EnableTokenRevocation,
            AllowedOAuthFlows: existingClient.AllowedOAuthFlows,
            AllowedOAuthScopes: existingClient.AllowedOAuthScopes,
            AllowedOAuthFlowsUserPoolClient: existingClient.AllowedOAuthFlowsUserPoolClient,
            CallbackURLs: existingClient.CallbackURLs,
            LogoutURLs: existingClient.LogoutURLs,
            DefaultRedirectURI: existingClient.DefaultRedirectURI,
            SupportedIdentityProviders: existingClient.SupportedIdentityProviders,
        });

        const response = await client.send(updateCommand);

        if (response.UserPoolClient) {
            console.log('✅ Auth flow enabled successfully!');
            console.log('   Updated auth flows:', response.UserPoolClient.ExplicitAuthFlows || []);
            console.log('✅ You can now use USER_PASSWORD_AUTH for sign in!');
        }
    } catch (error: any) {
        console.error(' Error enabling auth flow:', error.message);
        if (error.name === 'AccessDeniedException') {
            console.error('   ⚠️  You need admin permissions to update App Client settings.');
            console.error('   Please ask the Cognito administrator to enable ALLOW_USER_PASSWORD_AUTH manually.');
        } else if (error.name === 'ResourceNotFoundException') {
            console.error('   ⚠️  User Pool or Client not found. Please check your .env configuration.');
        }
        process.exit(1);
    }
}

enableAuthFlow();

