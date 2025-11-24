import {
    AdminGetUserCommand,
    AdminResetUserPasswordCommand,
    AdminSetUserPasswordCommand,
    AdminUpdateUserAttributesCommand,
    AdminDisableUserCommand,
    AdminEnableUserCommand,
    AdminDeleteUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { cognitoClient, USER_POOL_ID } from '../config/cognito';

export interface CognitoUserInfo {
    userId: string;
    email: string;
    enabled: boolean;
    userStatus: string;
    createdAt?: Date | undefined;
    lastModified?: Date | undefined;
}

export class CognitoAdminService {
    /**
     * Get user info from Cognito (including email, status)
     */
    async getUserInfo(cognitoUserId: string): Promise<CognitoUserInfo> {
        try {
            const command = new AdminGetUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUserId,
            });

            const response = await cognitoClient.send(command);
            
            const email = response.UserAttributes?.find(attr => attr.Name === 'email')?.Value || '';
            
            return {
                userId: response.Username || cognitoUserId,
                email: email,
                enabled: response.Enabled || false,
                userStatus: response.UserStatus || 'UNKNOWN',
                createdAt: response.UserCreateDate,
                lastModified: response.UserLastModifiedDate,
            };
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found in Cognito');
            }
            throw error;
        }
    }

    /**
     * Reset user password (sends password reset code via email/SMS)
     * Note: AdminResetUserPasswordCommand sends a reset code, not a temporary password
     * User must use the code to set a new password
     */
    async resetUserPassword(cognitoUserId: string) {
        try {
            const command = new AdminResetUserPasswordCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUserId,
            });

            await cognitoClient.send(command);
            return {
                success: true,
                message: 'Password reset code sent to user email/SMS',
            };
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found');
            }
            throw error;
        }
    }

    /**
     * Set new password for user (admin sets password directly)
     * permanent: true = user doesn't need to change on next login
     */
    async setUserPassword(cognitoUserId: string, newPassword: string, permanent: boolean = true) {
        try {
            const command = new AdminSetUserPasswordCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUserId,
                Password: newPassword,
                Permanent: permanent,
            });

            await cognitoClient.send(command);
            return { success: true };
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found');
            }
            if (error.name === 'InvalidPasswordException') {
                throw new Error('Password does not meet requirements');
            }
            throw error;
        }
    }

    /**
     * Update user email
     */
    async updateUserEmail(cognitoUserId: string, newEmail: string) {
        try {
            const command = new AdminUpdateUserAttributesCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUserId,
                UserAttributes: [
                    {
                        Name: 'email',
                        Value: newEmail,
                    },
                    {
                        Name: 'email_verified',
                        Value: 'false', // User needs to verify new email
                    },
                ],
            });

            await cognitoClient.send(command);
            return { success: true };
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found');
            }
            if (error.name === 'AliasExistsException') {
                throw new Error('Email already exists');
            }
            throw error;
        }
    }

    /**
     * Disable user account
     */
    async disableUser(cognitoUserId: string) {
        try {
            const command = new AdminDisableUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUserId,
            });

            await cognitoClient.send(command);
            return { success: true };
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found');
            }
            throw error;
        }
    }

    /**
     * Enable user account
     */
    async enableUser(cognitoUserId: string) {
        try {
            const command = new AdminEnableUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUserId,
            });

            await cognitoClient.send(command);
            return { success: true };
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found');
            }
            throw error;
        }
    }

    /**
     * Delete user from Cognito
     */
    async deleteUser(cognitoUserId: string) {
        try {
            const command = new AdminDeleteUserCommand({
                UserPoolId: USER_POOL_ID,
                Username: cognitoUserId,
            });

            await cognitoClient.send(command);
            return { success: true };
        } catch (error: any) {
            if (error.name === 'UserNotFoundException') {
                throw new Error('User not found');
            }
            throw error;
        }
    }
}

export const cognitoAdminService = new CognitoAdminService();

