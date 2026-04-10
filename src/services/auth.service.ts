import { api } from '../app/api';
import { User } from '../context/AuthContext';

interface BackendAuthUser {

    organizationId?: string | null;
    organizationName?: string;
    organization?: {
        id?: string | null;
        name?: string | null;
    } | null;
    id: string;
    firstName: string;
    lastName: string;
    profilePic?: string | {
        url?: string | null;
        key?: string | null;
    } | null;
    email: string;
    userLevel: 'SuperAdmin' | 'BranchManager' | 'Marketer' | 'Authorizer';
    userType: 'Initiator' | 'Reviewer' | 'None' | 'Authorizer';
    branchId?: string | null;
    branch?: {
        id?: string | null;
        name?: string | null;
    } | null;
    mustChangePassword: boolean;
}

interface BackendLoginResponse {
    message: string;
    email: string;
    expiresAt: string;
}

interface BackendVerifyOtpResponse {
    payload: {
        token: string;
        refreshToken: string;
        message: string;
        user: BackendAuthUser;
    },
    success: boolean;
}

export interface LoginPayload {
    email: string;
    password: string;
    deviceId: string;
}

export interface LoginResponse {
    success: boolean;
    requiresOtp: boolean;
    token?: string;
    user?: User;
}

export interface VerifyOtpPayload {
    email: string;
    otp: string;
    deviceId: string;
}

export interface VerifyOtpResponse {
    success: boolean;
    token: string;
    user: User;
}

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    email: string;
    otp: string;
    newPassword: string;
}

export interface ResendOtpPayload {
    email: string;
    deviceId: string;
}

const mapUserRole = (userLevel: BackendAuthUser['userLevel']): User['role'] => {
    if (userLevel === 'SuperAdmin') {
        return 'super_admin';
    }

    if (userLevel === 'Marketer') {
        return 'marketer';
    }

    if (userLevel === 'Authorizer') {
        return 'authorizer';
    }

    return 'manager';
};

const mapBackendUser = (user: BackendAuthUser): User => ({
    id: user.id,
    name: `${user?.firstName} ${user?.lastName}`.trim(),
    email: user?.email,
    role: mapUserRole(user.userLevel),
    organizationId: user.organizationId ?? user.organization?.id ?? undefined,
    organizationName: user.organizationName ?? user.organization?.name ?? undefined,
    branch: user.branch?.name ?? user.branchId ?? undefined,
    avatar:
        typeof user.profilePic === 'string'
            ? user.profilePic
            : user.profilePic?.url ?? '',
});

export const authService = {
    login: async (payload: LoginPayload): Promise<LoginResponse> => {
        await api.post<BackendLoginResponse, LoginPayload>('/auth/login', payload);

        return {
            success: true,
            requiresOtp: true,
        };
    },
    verifyOtp: async (payload: VerifyOtpPayload): Promise<VerifyOtpResponse> => {
        const response = await api.post<BackendVerifyOtpResponse, VerifyOtpPayload>(
            '/auth/verify-login-otp',
            payload
        );

        console.log('OTP Response for:', response);
        return {
            success: true,
            token: response.payload?.token ?? '',
            user: mapBackendUser(response.payload?.user),
        };
    },
    forgotPassword: (payload: ForgotPasswordPayload) =>
        api.post<{ message: string }, ForgotPasswordPayload>('/auth/request-password-change-otp', payload),
    resetPassword: (payload: ResetPasswordPayload) =>
        api.post<{ message: string }, ResetPasswordPayload>('/auth/reset-password-with-otp', payload),
    resendOtp: (payload: ResendOtpPayload) =>
        api.post<{ message: string }, ResendOtpPayload>('/auth/resend-password-change-otp', payload),
};
