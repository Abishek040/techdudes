import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ============================================================
// AURORA BACKGROUND
// ============================================================

import AuroraBackground from "@/components/ui/aurora-background";

import { AuthProvider } from "./contexts/AuthContext";

// ============================================================
// ROUTE PROTECTION
// ============================================================

import { AdminRoute } from "@/components/ProtectedRoute";

// ============================================================
// EXISTING TECHDUDES PAGES
// ============================================================

import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import ProjectsPage from "./pages/ProjectsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import TeamPage from "./pages/TeamPage";
import NotFound from "./pages/NotFound";

// ============================================================
// INTERNSHIP PAGES
// ============================================================

import InternshipLanding from "./pages/internship/InternshipLanding";
import InternshipLogin from "./pages/internship/Login";
import InternshipRegister from "./pages/internship/Register";
import InternshipEnroll from "./pages/internship/Enroll";
import InternshipModules from "./pages/internship/Modules";
import InternshipQuiz from "./pages/internship/Quiz";
import InternshipPay from "./pages/internship/Pay";
import InternshipDashboard from "./pages/internship/Dashboard";
import InternshipCertificateView from "./pages/internship/CertificateView";
import VerifyCertificate from "./pages/internship/VerifyCertificate";

// NEW: Email confirmation success page
import EmailVerified from "./pages/internship/EmailVerified";

// ============================================================
// ADMIN
// ============================================================

import AdminInternship from "./pages/admin/AdminInternship";

// ============================================================
// REACT QUERY
// ============================================================

const queryClient = new QueryClient();

// ============================================================
// SCROLL TO TOP
// ============================================================

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

// ============================================================
// APP
// ============================================================

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />

        {/* ====================================================
            GLOBAL PAGE CONTAINER
           ==================================================== */}

        <div className="relative min-h-screen">

          {/* ==================================================
              GLOBAL AURORA BACKGROUND
             ================================================== */}

          <AuroraBackground
            gradientColors={[
              "rgba(99, 102, 241, 0.20)",
              "rgba(139, 92, 246, 0.20)",
            ]}
            pulseDuration={8}
            starCount={80}
          />

          {/* ==================================================
              MAIN WEBSITE CONTENT
             ================================================== */}

          <div className="relative z-10 min-h-screen">

            <BrowserRouter>

              {/* =================================================
                  SCROLL TO TOP
                 ================================================= */}

              <ScrollToTop />

              {/* =================================================
                  GLOBAL NAVBAR
                 ================================================= */}

              <Navbar />

              {/* =================================================
                  ROUTES
                 ================================================= */}

              <Routes>

                {/* =================================================
                    EXISTING TECHDUDES WEBSITE
                   ================================================= */}

                <Route
                  path="/"
                  element={<HomePage />}
                />

                <Route
                  path="/services"
                  element={<ServicesPage />}
                />

                <Route
                  path="/projects"
                  element={<ProjectsPage />}
                />

                <Route
                  path="/about"
                  element={<AboutPage />}
                />

                <Route
                  path="/contact"
                  element={<ContactPage />}
                />

                <Route
                  path="/team"
                  element={<TeamPage />}
                />

                {/* =================================================
                    PUBLIC CERTIFICATE VERIFICATION
                   ================================================= */}

                <Route
                  path="/verify"
                  element={<VerifyCertificate />}
                />

                <Route
                  path="/verify/:code"
                  element={<VerifyCertificate />}
                />

                <Route
                  path="/verify-certificate/:code"
                  element={<VerifyCertificate />}
                />

                {/* =================================================
                    EMAIL VERIFICATION
                   ================================================= */}

                <Route
                  path="/auth/email-verified"
                  element={<EmailVerified />}
                />

                {/* =================================================
                    INTERNSHIP PORTAL
                   ================================================= */}

                {/* -------------------------------------------------
                    Internship Landing Page
                   ------------------------------------------------- */}

                <Route
                  path="/internship"
                  element={<InternshipLanding />}
                />

                {/* -------------------------------------------------
                    Student Login
                   ------------------------------------------------- */}

                <Route
                  path="/internship/login"
                  element={<InternshipLogin />}
                />

                {/* -------------------------------------------------
                    Student Registration
                   ------------------------------------------------- */}

                <Route
                  path="/internship/register"
                  element={<InternshipRegister />}
                />

                {/* -------------------------------------------------
                    Internship Enrollment
                   ------------------------------------------------- */}

                <Route
                  path="/internship/enroll/:slug"
                  element={<InternshipEnroll />}
                />

                {/* =================================================
                    INTERNSHIP LEARNING MODULES
                   ================================================= */}

                {/* -------------------------------------------------
                    Module List
                   ------------------------------------------------- */}

                <Route
                  path="/internship/modules/:enrollmentId"
                  element={<InternshipModules />}
                />

                {/* -------------------------------------------------
                    Individual Module
                   ------------------------------------------------- */}

                <Route
                  path="/internship/modules/:enrollmentId/:moduleId"
                  element={<InternshipModules />}
                />

                {/* =================================================
                    INTERNSHIP QUIZ
                   ================================================= */}

                <Route
                  path="/internship/quiz/:enrollmentId"
                  element={<InternshipQuiz />}
                />

                {/* =================================================
                    CERTIFICATE PAYMENT
                   ================================================= */}

                <Route
                  path="/internship/pay/:enrollmentId"
                  element={<InternshipPay />}
                />

                {/* =================================================
                    STUDENT DASHBOARD
                   ================================================= */}

                <Route
                  path="/internship/dashboard"
                  element={<InternshipDashboard />}
                />

                {/* =================================================
                    CERTIFICATE
                   ================================================= */}

                <Route
                  path="/internship/certificate/:enrollmentId"
                  element={<InternshipCertificateView />}
                />

                {/* =================================================
                    ADMIN INTERNSHIP DASHBOARD
                   ================================================= */}

                <Route
                  path="/admin/internship"
                  element={
                    <AdminRoute>
                      <AdminInternship />
                    </AdminRoute>
                  }
                />

                {/* =================================================
                    404
                   ================================================= */}

                <Route
                  path="*"
                  element={<NotFound />}
                />

              </Routes>

              {/* =================================================
                  GLOBAL FOOTER
                 ================================================= */}

              <Footer />

            </BrowserRouter>

          </div>
        </div>

      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;