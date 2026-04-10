import * as Yup from 'yup';

export const loginSchema = Yup.object({
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

export const forgotPasswordSchema = Yup.object({
  email: Yup.string().email('Enter a valid email address').required('Email is required'),
});

export const otpSchema = Yup.object({
  otp: Yup.string()
    .required('OTP is required'),
});

export const resetPasswordSchema = Yup.object({
  otp: Yup.string()
    .matches(/^\d{6}$/, 'Enter a valid 6-digit OTP')
    .required('OTP is required'),
  newPassword: Yup.string().min(8, 'Password must be at least 8 characters').required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Confirm your new password'),
});
