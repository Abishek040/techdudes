
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogOut, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { label: "Home", path: "/" },
  { label: "Services", path: "/services" },
  { label: "Projects", path: "/projects" },
  { label: "About", path: "/about" },
  { label: "Team", path: "/team" },
  { label: "Contact", path: "/contact" },
  { label: "Internships", path: "/internship" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, profile, logout } = useAuth();

  // Hide the global TechDudes navbar on Abishek's portfolio only.
  const isPortfolioPage = location.pathname === "/abishek";

  const isInternshipPage = location.pathname.startsWith("/internship");
  const isLoggedIn = !!user;
  const showInternshipNavbar = isInternshipPage && isLoggedIn;

  // Scroll detection
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Close mobile menu and reset scroll styling on route changes.
  useEffect(() => {
    setOpen(false);
    setScrolled(window.scrollY > 20);
  }, [location.pathname]);

  // Hide this navbar only on the portfolio route.
  if (isPortfolioPage) {
    return null;
  }

  // Logout
  const handleLogout = async () => {
    setOpen(false);

    await logout();

    navigate("/internship/login");
  };

  // Student name
  const studentName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass py-3" : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/logo.png"
            alt="TechDudes Logo"
            className="h-10 w-auto object-contain"
          />

          <span className="text-2xl font-bold gradient-text">TechDudes</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {showInternshipNavbar ? (
            <>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User size={18} className="text-primary" />
                <span>{studentName}</span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="neon-btn flex items-center gap-2 text-sm"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-primary ${
                    location.pathname === link.path
                      ? "neon-text"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link to="/contact" className="neon-btn text-sm">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setOpen((previous) => !previous)}
          className="p-2 text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass mx-4 mt-2 overflow-hidden rounded-xl md:hidden"
          >
            <div className="flex flex-col gap-3 p-4">
              {showInternshipNavbar ? (
                <>
                  <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                      <User size={18} className="text-primary" />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        Logged in as
                      </span>
                      <span className="text-sm font-medium text-foreground">
                        {studentName}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="neon-btn mt-2 flex items-center justify-center gap-2 text-center text-sm"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        location.pathname === link.path
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <Link
                    to="/contact"
                    className="neon-btn mt-2 text-center text-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
