import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import loginIllustration from '../assets/images/Group.png';
import prepRouteLogo from '../assets/images/preproute-logo.png';

const loginSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.userId, data.password);
    if (success) {
      toast.success('Successfully logged in!');
      navigate('/');
    } else {
      toast.error('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-white select-none">

      {/* Left side: Mascot & Illustration */}
      <div
        className="hidden lg:flex w-1/2 flex-col justify-center items-center p-12"
        style={{ backgroundColor: "#F7FBFF" }}
      >
        <img
          src={loginIllustration}
          alt="Login Illustration"
          className="w-[450px] h-auto object-contain mx-auto"
        />
      </div>

      {/* Right side: Login Form Panel */}
      <div className="w-full lg:w-1/2 flex justify-center items-center p-8 bg-white">
        <div className="w-full max-w-xl bg-white rounded-3xl p-12 md:p-16 flex flex-col justify-center min-h-[85vh]">

          <div className="mb-8">
            {/* Logo */}
            <div className="flex items-center gap-2 mb-10">
              <img
                src={prepRouteLogo}
                alt="PrepRoute Logo"
              />
            </div>

            <h2 className="text-xl font-extrabold text-slate-600 tracking-tight">Login</h2>
            <p className="text-slate-400 text-xs mt-1.5 font-semibold">Use your company provided Login credentials</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-3.5 text-xs bg-rose-50 border border-rose-100 text-rose-600 rounded-lg font-bold">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="userId" className="block text-base font-bold text-slate-500">
                User ID
              </label>
              <input
                id="userId"
                type="text"
                placeholder="Enter User ID"
                {...register("userId")}
                className={`w-full h-11 px-4 rounded-lg border text-[16px] font-medium leading-[150%] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/10 ${errors.userId
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                  }`}
              />
              {errors.userId && (
                <p className="mt-1 text-base text-red-500 font-bold">
                  {errors.userId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-base font-bold text-slate-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter Password"
                {...register("password")}
                className={`w-full h-11 px-4 rounded-lg border text-[16px] font-medium leading-[150%] transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/10 ${errors.password
                  ? "border-red-300 focus:border-red-500"
                  : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                  }`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500 font-bold">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-left">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  toast.error("Please contact support to reset password.");
                }}
                className="text-[14px] font-normal text-[#1B5DEF] hover:text-[#1B5DEF] transition-colors select-none"
              >
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-base font-medium leading-[150%] rounded-lg transition-all duration-150 shadow-md shadow-blue-500/10 flex justify-center items-center cursor-pointer mt-2"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              ) : (
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
export default Login;
