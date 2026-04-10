import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheckIcon,
  AlertCircleIcon,
  LoaderIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from
  'lucide-react';
import { useFormik } from 'formik';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { otpSchema } from '../validators/authSchemas';
export function VerifyOtp() {
  const { verifyOtp, pendingEmail, deviceId } = useAuth();
  const navigate = useNavigate();
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  // Redirect if no pending email
  useEffect(() => {
    if (!pendingEmail) {
      navigate('/login');
    }
  }, [pendingEmail, navigate]);
  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formik = useFormik({
    initialValues: {
      otp: '',
    },
    validationSchema: otpSchema,
    validateOnMount: true,
    onSubmit: async (values) => {
      await handleVerify(values.otp);
    },
  });

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    formik.setFieldValue('otp', newOtp.join(''));
    formik.setFieldTouched('otp', true, false);
    setError('');
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (value && index === 5 && newOtp.every((d) => d !== '')) {
      formik.submitForm();
    }
  }
  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }
  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.
      getData('text').
      replace(/\D/g, '').
      slice(0, 6);
    if (pasted.length === 0) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    formik.setFieldValue('otp', newOtp.join(''));
    formik.setFieldTouched('otp', true, false);
    const nextEmpty = newOtp.findIndex((d) => d === '');
    const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === 6) {
      formik.submitForm();
    }
  }
  async function handleVerify(otpString?: string) {
    const code = otpString || otp.join('');
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await verifyOtp(code);
      if (result.success) {
        // Small delay to show success state
        await new Promise((r) => setTimeout(r, 500));
        const destination = result.user.role === 'marketer' ? '/marketer/dashboard' : '/dashboard';
        navigate(destination);
      }
    } catch (err: any) {
      const message = err?.message || 'Invalid OTP. Please try again.';
      setError(message);

      setOtp(Array(6).fill(''));
      formik.setFieldValue('otp', '', false);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }
  function handleResend() {
    if (resendTimer > 0) return;
    setResendTimer(60);
    setOtp(Array(6).fill(''));
    formik.setFieldValue('otp', '', false);
    formik.setFieldTouched('otp', false, false);
    setError('');
    inputRefs.current[0]?.focus();
    console.log('[Auth] OTP resent to:', pendingEmail, '| Device:', deviceId);
  }
  const maskedEmail = pendingEmail ?
    pendingEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') :
    '';
  return (
    <div className="min-h-screen flex w-full font-body">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <Logo width={180} height={60} className="mb-8" />
          <motion.div
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: 0.2
            }}>

            <h1 className="text-4xl lg:text-5xl font-heading font-bold leading-tight mb-4">
              Secure Access <br />
              <span className="text-accent">Verification</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              We've sent a one-time password to verify your identity and protect
              your account.
            </p>
          </motion.div>
        </div>
        <div className="relative z-10">
          <p className="text-sm text-white/60">Powered by WizBizHub Limited</p>
        </div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - OTP Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.95
          }}
          animate={{
            opacity: 1,
            scale: 1
          }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-gray-100">

          <div className="lg:hidden mb-8 flex justify-center">
            <Logo width={140} height={46} />
          </div>

          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-sm font-body text-gray-500 hover:text-primary transition-colors mb-6">

            <ArrowLeftIcon size={14} />
            Back to Login
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheckIcon size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-primary">
                Verify OTP
              </h2>
              <p className="text-sm text-gray-500">
                Enter the 6-digit code sent to {maskedEmail}
              </p>
            </div>
          </div>

          <AnimatePresence>
            {error &&
              <motion.div
                initial={{
                  opacity: 0,
                  y: -8
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -8
                }}
                className="flex items-center gap-2 p-3 mt-5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-body">

                <AlertCircleIcon size={16} className="flex-shrink-0" />
                {error}
              </motion.div>
            }
          </AnimatePresence>

          {/* OTP Input Boxes */}
          <div
            className="flex justify-center gap-3 mt-8 mb-6"
            onPaste={handlePaste}>

            {otp.map((digit, index) =>
              <motion.input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                id={`otp-${index}`}
                name={`otp-${index}`}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={(e) => e.target.select()}
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                transition={{
                  delay: index * 0.05
                }}
                className={`w-12 h-14 text-center text-xl font-heading font-bold rounded-xl border-2 outline-none transition-all ${digit ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 bg-gray-50 text-gray-800'} focus:border-primary focus:ring-2 focus:ring-primary/20`}
                disabled={loading} />

            )}
          </div>

          {formik.touched.otp && formik.errors.otp &&
            <p className="text-xs text-red-600 mb-4 text-center">{formik.errors.otp}</p>
          }

          {/* Verify Button */}
          <button
            type="button"
            onClick={() => formik.submitForm()}
            disabled={loading || !formik.isValid}
            className="w-full bg-accent hover:bg-[#e64a19] text-white font-heading font-bold py-3 rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">

            {loading ?
              <>
                <LoaderIcon size={18} className="animate-spin" />
                Verifying...
              </> :

              <>
                <CheckCircleIcon size={18} />
                Verify & Continue
              </>
            }
          </button>

          {/* Resend */}
          <div className="text-center mt-6">
            {resendTimer > 0 ?
              <p className="text-sm text-gray-400 font-body">
                Resend code in{' '}
                <span className="font-bold text-primary">{resendTimer}s</span>
              </p> :

              <button
                onClick={handleResend}
                className="text-sm font-body font-medium text-primary hover:text-primary/80 transition-colors">

                Didn't receive the code? Resend OTP
              </button>
            }
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Demo: Enter any 6 digits (e.g. 123456) to verify
          </p>
        </motion.div>
      </div>
    </div>);

}