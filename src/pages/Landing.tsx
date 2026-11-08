import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/landing/Header";
import { Hero } from "../components/landing/Hero";
import { Features } from "../components/landing/Features";
import { HowItWorks } from "../components/landing/HowItWorks";
import { ProductShowcase } from "../components/landing/ProductShowcase";
import { Benefits } from "../components/landing/Benefits";
import { Integrations } from "../components/landing/Integrations";
import { Pricing } from "../components/landing/Pricing";
import { FAQ } from "../components/landing/FAQ";
import { CTA } from "../components/landing/CTA";
import { Footer } from "../components/landing/Footer";

const Landing = () => {
  const navigate = useNavigate();

  // Check if user is already logged in and set dark mode
  useEffect(() => {
    // Set dark mode as default for landing page
    document.documentElement.classList.add("dark");

    const checkAuth = () => {
      // Check for auth token in localStorage
      const token = localStorage.getItem("auth_token");
      const sessionToken = sessionStorage.getItem("auth_token");

      // If user is authenticated, redirect to dashboard
      if (token || sessionToken) {
        navigate("/dashboard");
      }
    };

    checkAuth();

    // Cleanup: remove dark mode when leaving landing page
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <ProductShowcase />
      <Benefits />
      <Integrations />
      {/* <Pricing /> */}
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
};

export default Landing;
