import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const navItems = [
  { id: "features", label: "Features" },
  { id: "solutions", label: "Solutions" },
  { id: "contact", label: "Contact" },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      // Determine active section
      let currentSection = "";
      navItems.forEach((item) => {
        const element = document.getElementById(item.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 80 && rect.bottom >= 80) {
            currentSection = item.id;
          }
        }
      });
      setActiveSection(currentSection);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initialize on mount
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl shadow-lg border-b border-primary/10"
          : "bg-gradient-to-b from-background/60 to-transparent backdrop-blur-sm"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-3 transition-transform duration-200 hover:scale-105"
          >
            <img
              src="/grevya-logo-white.png"
              alt="Grevya CRM Logo"
              className="w-32 h-auto object-contain transition-opacity duration-200 hover:opacity-90"
            />
            <span className="text-xl font-semibold text-white"></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`font-medium transition-all duration-200 relative group ${
                  activeSection === item.id
                    ? "text-primary"
                    : "text-foreground/70 hover:text-primary"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-primary to-chart-4 transition-all duration-200 ${
                    activeSection === item.id
                      ? "w-full"
                      : "w-0 group-hover:w-full"
                  }`}
                />
              </button>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/login")}
              className="text-foreground/80 hover:text-primary hover:bg-primary/10 transition-all"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              className="bg-gradient-to-r from-primary to-chart-4 hover:shadow-lg hover:shadow-primary/50 transition-all"
            >
              Register
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 hover:bg-primary/10 rounded-lg transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6 text-primary" />
            ) : (
              <Menu className="w-6 h-6 text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 animate-fade-in bg-background/95 backdrop-blur-xl rounded-b-2xl border-t border-primary/10">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`font-medium text-left px-4 py-2 rounded-lg transition-all ${
                    activeSection === item.id
                      ? "text-primary bg-primary/10"
                      : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="flex flex-col space-y-2 pt-4 mt-4 border-t border-border/50 px-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="w-full text-foreground/80 hover:text-primary hover:bg-primary/10"
                >
                  Login
                </Button>
                {/* <Button
                  onClick={() => navigate("/register")}
                  className="w-full bg-gradient-to-r from-primary to-chart-4 hover:shadow-lg hover:shadow-primary/50"
                >
                  Register
                </Button> */}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
