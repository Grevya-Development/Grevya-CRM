import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { message } from "antd";
import { Eye, EyeOff } from "lucide-react";
import DataSourcesOrbit from "../components/DataSourcesOrbit";
import { supabase } from "@/supabase/supabaseClient";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, []);


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      message.error("Please fill in both email and password");
      return;
    }

    if (!validateEmail(email)) {
      message.error("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      message.error("Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) throw error;

      if (data.user) {
        message.success(
          "Signup successful! Please check your email for verification.",
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      message.error(error.message || "Error signing up");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black relative">
      <div className="absolute top-6 left-6 z-10">
        <img
          src="/grevya-logo-white.png"
          alt="Grevya CRM Logo"
          className="h-16 w-44 object-contain"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
      </div>

      <div className="flex-1 hidden lg:flex items-center justify-center bg-black relative">
        <DataSourcesOrbit />
      </div>

      <div className="w-[500px] flex items-center justify-center p-12">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
          <div className="mb-6 text-center">
            <h2 className="text-1xl font-bold text-white mb-2">
              Create Account
            </h2>
            <p className="text-gray-400 text-base">Join us today!</p>
            <p className="text-gray-500 text-xs mt-1">v1.0.0</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300"
            >
              {isLoading ? "Creating Account..." : "Sign Up"}
            </Button>
          </form>

          <div className="text-center mt-6">
            <span className="text-gray-400">Already have an account? </span>
            <Link
              to="/login"
              className="text-white font-medium hover:underline"
            >
              Login
            </Link>
          </div>

          {/* Footer Links */}
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link
              to="/terms"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/support"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
