import {
    SignUpCommand,
    InitiateAuthCommand,
    GetUserCommand,
    GlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';

import { cognitoClient, CLIENT_ID } from '../config/cognito';
import User from '../models/User';
import Role from '../models/Role';

export interface SignUpDto {
    email: string;
    password: string;
}

export interface SignInDto {
    email: string;
    password: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
}

export class AuthService {
    async signUp(data: SignUpDto): Promise<{ userId: string; email: string }> {
        try {
            const command = new SignUpCommand({
                ClientId: CLIENT_ID,
                Username: data.email,
                Password: data.password,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: data.email,
                    },
                ],
            });

            const response = await cognitoClient.send(command);

            if (!response.UserSub) {
                throw new Error('Failed to create user');
            }

            // Note: Email confirmation is handled by frontend using Amplify
            // Backend only creates the user in Cognito
            return {
                userId: response.UserSub,
                email: data.email,
            };
        } catch (error: any) {
            // Handle Cognito specific errors
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

    async signIn(data: SignInDto): Promise<AuthResponse> {
        try {
            const command = new InitiateAuthCommand({
                ClientId: CLIENT_ID,
                AuthFlow: 'USER_PASSWORD_AUTH',
                AuthParameters: {
                    USERNAME: data.email,
                    PASSWORD: data.password
                }
            });

            const response = await cognitoClient.send(command);

            if (
                !response.AuthenticationResult ||
                !response.AuthenticationResult.AccessToken ||
                !response.AuthenticationResult.RefreshToken ||
                !response.AuthenticationResult.IdToken ||
                typeof response.AuthenticationResult.ExpiresIn !== "number"
            ) {
                throw new Error('Authentication failed');
            }

            return {
                accessToken: response.AuthenticationResult.AccessToken,
                refreshToken: response.AuthenticationResult.RefreshToken,
                idToken: response.AuthenticationResult.IdToken,
                expiresIn: response.AuthenticationResult.ExpiresIn
            };
        } catch (error: any) {
            // Handle Cognito specific errors
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
                throw new Error('Auth flow not enabled for this client. Please ask the Cognito administrator to enable "ALLOW_USER_PASSWORD_AUTH" in App Client settings.');
            }
            throw error;
        }
    }

    async verifyToken(accessToken: string): Promise<{ userId: string; email: string }> {
        try {
            const command = new GetUserCommand({
                AccessToken: accessToken,
            });
        
            const response = await cognitoClient.send(command);
        
            const emailAttr = response.UserAttributes?.find((attr) => attr.Name === 'email');
            
            if (!response.Username || !emailAttr?.Value) {
                throw new Error('Invalid token');
            }
        
            return {
                userId: response.Username,
                email: emailAttr.Value,
            };
        } catch (error: any) {
            // Handle Cognito specific errors
            if (error.name === 'NotAuthorizedException') {
                throw new Error('Invalid or expired token');
            }
            if (error.name === 'TokenRefreshRequiredException') {
                throw new Error('Token refresh required');
            }
            throw error;
        }
    }

    async getCurrentUser(accessToken: string): Promise<{ userId: string; email: string; attributes?: Record<string, string> }> {
        try {
            const command = new GetUserCommand({
                AccessToken: accessToken,
            });
        
            const response = await cognitoClient.send(command);
        
            const emailAttr = response.UserAttributes?.find((attr) => attr.Name === 'email');
            
            if (!response.Username || !emailAttr?.Value) {
                throw new Error('Invalid token');
            }

            // Convert UserAttributes array to object
            const attributes: Record<string, string> = {};
            response.UserAttributes?.forEach((attr) => {
                if (attr.Name && attr.Value) {
                    attributes[attr.Name] = attr.Value;
                }
            });
        
            return {
                userId: response.Username,
                email: emailAttr.Value,
                attributes,
            };
        } catch (error: any) {
            // Handle Cognito specific errors
            if (error.name === 'NotAuthorizedException') {
                throw new Error('Invalid or expired token');
            }
            if (error.name === 'TokenRefreshRequiredException') {
                throw new Error('Token refresh required');
            }
            throw error;
        }
    }

    /**
     * Get user from database by Cognito userId and load their roles
     */
    async getUserWithRoles(cognitoUserId: string): Promise<{ id: number; roles: string[] } | null> {
        try {
            const user = await User.findOne({
                where: {
                    cognitoUserId: cognitoUserId,
                },
                include: [{
                    model: Role,
                    as: 'roles',
                    attributes: ['roleName'],
                    through: {
                        attributes: [], // Don't include UserRole attributes
                    },
                }],
            });

            if (!user) {
                return null;
            }

            const roles = (user as any).roles?.map((role: Role) => role.roleName) || [];

            return {
                id: user.id,
                roles,
            };
        } catch (error) {
            console.error('Error getting user with roles:', error);
            throw error;
        }
    }

    /**
     * Logout user by invalidating tokens on Cognito
     */
    async logout(accessToken: string): Promise<void> {
        try {
            const command = new GlobalSignOutCommand({
                AccessToken: accessToken,
            });
            await cognitoClient.send(command);
            console.log('[AuthService] User logged out successfully');
        } catch (error: any) {
            // Nếu token đã invalid hoặc expired, vẫn coi như logout thành công
            if (error.name === 'NotAuthorizedException' || error.name === 'TokenRefreshRequiredException') {
                console.warn('[AuthService] Token already invalid during logout');
                return;
            }
            console.error('[AuthService] Error during logout:', error);
            throw error;
        }
    }
}

export const authService = new AuthService();