export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  // Cognito Configuration for Amplify
  cognito: {
    userPoolId: 'us-east-1_iLDblhBCN', // Lấy từ COGNITO_USER_POOL_ID trong backend .env
    clientId: '4sfoo1fl4iv7ramlf8h4ghde0u', // Lấy từ COGNITO_CLIENT_ID trong backend .env
    region: 'us-east-1', // Lấy từ AWS_REGION trong backend .env
    // Domain: Lấy từ AWS Console → Cognito → User Pools → Your Pool → App integration → Domain
    // Format: your-pool-name.auth.us-east-1.amazoncognito.com
    // Hoặc custom domain nếu đã config
    domain: 'iLDblhBCN.auth.us-east-1.amazoncognito.com' // TODO: Điền domain của bạn (không có https://)
  }
};

