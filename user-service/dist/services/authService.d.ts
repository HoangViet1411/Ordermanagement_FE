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
export declare class AuthService {
    signUp(data: SignUpDto): Promise<{
        userId: string;
        email: string;
    }>;
    signIn(data: SignInDto): Promise<AuthResponse>;
    verifyToken(accessToken: string): Promise<{
        userId: string;
        email: string;
    }>;
}
export declare const authService: AuthService;
//# sourceMappingURL=authService.d.ts.map