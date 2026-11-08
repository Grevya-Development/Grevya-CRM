import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { message } from "antd";
import { Eye, EyeOff } from "lucide-react";
import DataSourcesOrbit from "../components/DataSourcesOrbit";

import { supabase } from "@/supabase/supabaseClient";

const Login = () => {
  const userpassword = import.meta.env.VITE_LOGIN_PASSWORD;
  const useremail = import.meta.env.VITE_LOGIN_EMAIL;

  const [username, setUsername] = useState(useremail);
  const [password, setPassword] = useState(userpassword);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        message.success("Login successful! Redirecting...");

        setTimeout(() => {
          navigate("/dashboard");
        }, 800);
      }
    } catch (error: any) {
      console.error("Login error:", error);
      message.error(error.message || "Invalid login credentials");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleGoogleLogin = async () => {
  //   try {
  //     await supabase.auth.signInWithOAuth({
  //       provider: "google",
  //       options: {
  //         scopes: "https://www.googleapis.com/auth/calendar",
  //         queryParams: {
  //           access_type: "offline",
  //           prompt: "consent"
  //         },
  //         redirectTo: `${window.location.origin}/dashboard`
  //       }
  //     })
  //   } catch (error: any) {
  //     message.error(error.message || "Google login failed")
  //   }
  // }

  const handleSkipLogin = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex bg-black relative">
      <div className="absolute top-6 left-6 z-10">
        <img
          src="/grevya-logo-white.png"
          alt="Grevya CRM Logo"
          className="h-16 w-44 object-contain"
        />
      </div>

      <div className="flex-1 hidden lg:flex items-center justify-center bg-black relative">
        <DataSourcesOrbit />
      </div>

      <div className="w-[500px] flex items-center justify-center p-12">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-1xl font-bold text-white mb-2">Login</h2>
            <p className="text-gray-400 text-base">Glad you're back.!</p>
            <p className="text-gray-500 text-xs mt-1">v1.0.0</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="Email Address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 pr-12 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
              >
                {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-gray-700 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
              />
              <label
                htmlFor="remember"
                className="text-sm text-gray-400 cursor-pointer"
              >
                Remember me
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>

            {/* <Button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white text-black font-medium rounded-lg hover:bg-gray-200 transition-all duration-300"
            >
              Login with Google
            </Button> */}

            {/* Forgot Password */}
            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Forgot password ?
              </Link>
            </div>
          </form>

          <div className="text-center">
            <span className="text-gray-400">Don't have an account ? </span>
            <Link
              to="/signup"
              className="text-white font-medium hover:underline"
            >
              Signup
            </Link>
          </div>

          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link
              to="/terms"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              to="/support"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Support
            </Link>
            <Link
              to="/customer-care"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Customer Care
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
