import { Amplify } from 'aws-amplify';
import { environment } from '../../../environments/environment';

/**
 * Amplify Configuration (v6)
 * 
 * Cấu hình Amplify để sử dụng AWS Cognito
 * Lấy thông tin từ environment.ts
 * 
 * Format cho Amplify v6:
 * - Sử dụng nested object structure
 * - userPoolId và userPoolClientId là required
 */
export function configureAmplify(): void {
  const userPoolId = environment.cognito.userPoolId;
  const clientId = environment.cognito.clientId;
  const region = environment.cognito.region || 'us-east-1';

  // Validate configuration
  if (!userPoolId || !clientId) {
    console.warn(
      'Amplify Auth is not configured. Please set userPoolId and clientId in environment.ts\n' +
      '   This is required for authentication to work properly.'
    );
    // Không throw error để app vẫn chạy được, nhưng auth sẽ không hoạt động
    return;
  }

  // Amplify v6 configuration format
  // Lưu ý: Region không cần set trong config vì Amplify tự detect từ userPoolId
  const amplifyConfig = {
    Auth: {
      Cognito: {
        userPoolId: userPoolId,
        userPoolClientId: clientId,
        loginWith: {
          email: true,
          username: false,
          phone: false
        },
        // Thêm signUpVerificationMethod để match với Cognito settings
        signUpVerificationMethod: 'code' as const // 'code' hoặc 'link'
      }
    }
  };

  try {
    Amplify.configure(amplifyConfig);
    console.log('✅ Amplify Auth configured successfully');
    console.log('   User Pool ID:', userPoolId);
    console.log('   Client ID:', clientId.substring(0, 10) + '...');
    console.log('   Region:', region);
    console.log('   Login with: email');
  } catch (error) {
    console.error('❌ Failed to configure Amplify:', error);
    // Không throw để app vẫn chạy được, nhưng auth sẽ fail
    console.warn('⚠️ Authentication features will not work until Amplify is properly configured');
  }
}

