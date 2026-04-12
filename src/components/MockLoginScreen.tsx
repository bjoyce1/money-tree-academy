import { ArrowLeft, Heart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MockLoginScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🌳</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Money Tree</h1>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">Welcome Back</h2>
          <p className="text-slate-400 text-lg">Sign in to continue your journey</p>
        </div>

        {/* Login Form */}
        <div className="space-y-6">
          {/* Email Field */}
          <div>
            <label className="block text-white font-medium mb-2">Email</label>
            <Input 
              type="email"
              placeholder="your@email.com"
              className="w-full h-14 bg-slate-800 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-white font-medium mb-2">Password</label>
            <Input 
              type="password"
              placeholder="Your password"
              className="w-full h-14 bg-slate-800 border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500"
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button className="text-purple-400 hover:text-purple-300 font-medium">
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <Button className="w-full h-14 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold text-lg rounded-xl border-0">
            Sign In
          </Button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-slate-900 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full h-14 bg-slate-800 border-slate-700 text-white hover:bg-slate-750 rounded-xl font-medium"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button 
              variant="outline" 
              className="w-full h-14 bg-slate-800 border-slate-700 text-white hover:bg-slate-750 rounded-xl font-medium"
            >
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
              Continue with Twitter
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center mt-8">
            <span className="text-slate-400">Don't have an account? </span>
            <button className="text-purple-400 hover:text-purple-300 font-medium">
              Create one
            </button>
          </div>

          {/* Back to Home */}
          <div className="text-center mt-8">
            <button className="flex items-center gap-2 text-slate-400 hover:text-white mx-auto">
              <ArrowLeft size={16} />
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}