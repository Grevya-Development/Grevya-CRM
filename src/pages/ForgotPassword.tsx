import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { message } from "antd";
import { ArrowLeft } from "lucide-react";
import DataSourcesOrbit from "../components/DataSourcesOrbit";
import { supabase } from "@/supabase/supabaseClient";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        document.documentElement.classList.add("dark");
        return () => {
            document.documentElement.classList.remove("dark");
        };
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            message.success("Password reset link sent to your email!");
        } catch (error: any) {
            console.error("Reset error:", error);
            message.error(error.message || "Failed to send reset email");
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
                />
            </div>

            <div className="flex-1 hidden lg:flex items-center justify-center bg-black relative">
                <DataSourcesOrbit />
            </div>

            <div className="w-[500px] flex items-center justify-center p-12">
                <div className="w-full max-w-md bg-black/40 backdrop-blur-xl border border-gray-800 rounded-2xl p-8">
                    <div className="mb-6 text-center">
                        <h2 className="text-1xl font-bold text-white mb-2">
                            Forgot Password
                        </h2>
                        <p className="text-gray-400 text-base">
                            Enter your email to reset password
                        </p>
                        <p className="text-gray-500 text-xs mt-1">v1.0.0</p>
                    </div>

                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-12 bg-transparent border border-gray-700 rounded-lg px-4 text-white placeholder:text-gray-500 focus:border-gray-600 focus:ring-1 focus:ring-gray-600"
                        />

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-300"
                        >
                            {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>

                    <div className="text-center mt-6">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;