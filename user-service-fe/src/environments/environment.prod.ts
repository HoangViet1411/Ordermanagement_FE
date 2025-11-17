export const environment = {
  production: true,
  apiUrl: 'https://your-api-domain.com/api', // TODO: Điền production API URL
  cognito: {
    // TODO: Điền thông tin Cognito cho production
    userPoolId: '', // Lấy từ COGNITO_USER_POOL_ID trong backend .env
    clientId: '', // Lấy từ COGNITO_CLIENT_ID trong backend .env
    region: 'us-east-1', // Lấy từ AWS_REGION trong backend .env
    domain: '' // Ví dụ: 'myapp.auth.us-east-1.amazoncognito.com'
  }
};

