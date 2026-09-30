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

  // ============================================================
  // CHECK WHETHER USER IS INSIDE INTERNSHIP PORTAL
  // ============================================================

  const isInternshipPage =
    location.pathname.startsWith("/internship");

  const isLoggedIn = !!user;

  const showInternshipNavbar =
    isInternshipPage && isLoggedIn;

  // ============================================================
  // SCROLL DETECTION
  // ============================================================

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // ============================================================
  // CLOSE MOBILE MENU WHEN ROUTE CHANGES
  // ============================================================

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // ============================================================
  // LOGOUT
  // ============================================================

  const handleLogout = async () => {
    setOpen(false);

    await logout();

    navigate("/internship/login");
  };

  // ============================================================
  // STUDENT NAME
  // ============================================================

  const studentName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Student";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "glass py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4">

        {/* ======================================================
            LOGO
           ====================================================== */}

        <Link
          to="/"
          className="flex items-center gap-2"
        >
          <img
            src="/logo.png"
            alt="Tech Dudes Logo"
            className="h-10 w-auto object-contain"
          />

          <span className="text-2xl font-bold gradient-text">
            TechDudes
          </span>
        </Link>

        {/* ======================================================
            DESKTOP NAVIGATION
           ====================================================== */}

        <div className="hidden md:flex items-center gap-8">

          {/* ====================================================
              INTERNSHIP LOGGED-IN NAVIGATION
             ==================================================== */}

          {showInternshipNavbar ? (
            <>
              {/* Student name */}

              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <User
                  size={18}
                  className="text-primary"
                />

                <span>
                  {studentName}
                </span>
              </div>

              {/* Logout */}

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 neon-btn text-sm"
              >
                <LogOut size={16} />

                <span>
                  Logout
                </span>
              </button>
            </>
          ) : (

            /* ==================================================
               NORMAL TECHDUDES NAVIGATION
               ================================================== */

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

              <Link
                to="/contact"
                className="neon-btn text-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* ======================================================
            MOBILE MENU BUTTON
           ====================================================== */}

        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="md:hidden text-foreground p-2"
          aria-label={
            open
              ? "Close menu"
              : "Open menu"
          }
        >
          {open ? (
            <X size={24} />
          ) : (
            <Menu size={24} />
          )}
        </button>
      </div>

      {/* ========================================================
          MOBILE MENU
         ======================================================== */}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{
              opacity: 0,
              height: 0,
            }}
            animate={{
              opacity: 1,
              height: "auto",
            }}
            exit={{
              opacity: 0,
              height: 0,
            }}
            className="md:hidden glass mt-2 mx-4 rounded-xl overflow-hidden"
          >
            <div className="flex flex-col p-4 gap-3">

              {/* =================================================
                  INTERNSHIP LOGGED-IN MOBILE MENU
                 ================================================= */}

              {showInternshipNavbar ? (
                <>
                  {/* Student information */}

                  <div className="flex items-center gap-3 py-3 px-3 rounded-lg bg-primary/10">
                    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/20">
                      <User
                        size={18}
                        className="text-primary"
                      />
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

                  {/* Logout */}

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 neon-btn text-sm text-center mt-2"
                  >
                    <LogOut size={16} />

                    <span>
                      Logout
                    </span>
                  </button>
                </>

              ) : (

                /* ================================================
                   NORMAL MOBILE NAVIGATION
                   ================================================ */

                <>
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`text-sm font-medium py-2 px-3 rounded-lg transition-colors ${
                        location.pathname === link.path
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}

                  <Link
                    to="/contact"
                    className="neon-btn text-sm text-center mt-2"
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