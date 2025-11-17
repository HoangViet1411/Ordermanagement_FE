# Cognito Frontend Direct Refresh - Setup Guide

## 📋 Tổng quan

Frontend Direct Refresh cho phép frontend gọi trực tiếp Cognito API để refresh token mà không cần qua backend.

## ⚙️ Cấu hình

### 1. Lấy thông tin từ Backend

Bạn cần lấy các thông tin sau từ backend `.env` file:

- `COGNITO_CLIENT_ID`: Client ID của Cognito App Client
- `AWS_REGION`: AWS region (ví dụ: `us-east-1`)
- `COGNITO_USER_POOL_ID`: User Pool ID (để tạo domain nếu cần)

### 2. Tìm Cognito Domain

Có 3 cách để lấy Cognito domain:

#### Cách 1: Cognito Domain (Khuyến nghị)
- Vào AWS Console → Cognito → User Pools → Your Pool → App integration tab
- Tìm "Domain" section
- Format: `your-pool-name.auth.us-east-1.amazoncognito.com`

#### Cách 2: Custom Domain
- Nếu bạn đã setup custom domain
- Format: `auth.yourdomain.com`

#### Cách 3: Từ User Pool ID
- Nếu không có domain, có thể dùng API endpoint
- Format: `cognito-idp.us-east-1.amazonaws.com/{USER_POOL_ID}`

### 3. Cập nhật Environment File

Mở file `src/environments/environment.ts` và điền thông tin:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  cognito: {
    domain: 'your-pool-name.auth.us-east-1.amazoncognito.com', // Điền domain ở đây
    clientId: 'your-client-id-here', // Điền CLIENT_ID ở đây
    region: 'us-east-1' // Điền region ở đây
  }
};
```

### 4. Cấu hình CORS trong Cognito

**QUAN TRỌNG**: Bạn cần cấu hình CORS trong Cognito để cho phép frontend gọi trực tiếp:

1. Vào AWS Console → Cognito → User Pools → Your Pool
2. Vào tab "App integration" → "App client settings"
3. Tìm "Allowed callback URLs" và thêm:
   - `http://localhost:4200` (cho development)
   - `https://your-production-domain.com` (cho production)
4. Tìm "Allowed sign-out URLs" và thêm tương tự
5. **QUAN TRỌNG**: Trong "Allowed OAuth flows", đảm bảo có:
   - ✅ Authorization code grant
   - ✅ Implicit grant (nếu cần)
6. Trong "Allowed OAuth scopes", đảm bảo có:
   - ✅ openid
   - ✅ email
   - ✅ profile

### 5. Kiểm tra App Client Settings

Đảm bảo App Client của bạn:
- ✅ Không có Client Secret (Public client)
- ✅ Có "ALLOW_USER_PASSWORD_AUTH" flow enabled (nếu dùng password auth)
- ✅ Có "ALLOW_REFRESH_TOKEN_AUTH" flow enabled

## 🧪 Test

1. Start backend: `cd user-service && npm start`
2. Start frontend: `cd user-service-fe && npm start`
3. Đăng nhập tại `http://localhost:4200/signin`
4. Mở DevTools → Network tab
5. Đợi access token hết hạn (hoặc manually expire)
6. Thực hiện một API call
7. Kiểm tra xem interceptor có tự động refresh token không

## 🔍 Debug

Nếu gặp lỗi CORS:
- Kiểm tra Cognito domain đã đúng chưa
- Kiểm tra CORS settings trong Cognito
- Kiểm tra browser console để xem lỗi chi tiết

Nếu refresh token fail:
- Kiểm tra refresh token còn valid không
- Kiểm tra CLIENT_ID đã đúng chưa
- Kiểm tra Cognito domain đã đúng chưa

## 📝 Lưu ý

- **Security**: CLIENT_ID không phải là secret, có thể expose ở frontend
- **Refresh Token Rotation**: Nếu Cognito có enable token rotation, refresh token sẽ thay đổi mỗi lần refresh
- **Token Expiry**: Access token thường hết hạn sau 1 giờ, refresh token có thể kéo dài 30 ngày

