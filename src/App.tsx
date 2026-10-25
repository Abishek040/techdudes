
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
import AuroraBackground from "@/components/ui/aurora-background";

import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute } from "@/components/ProtectedRoute";

// Existing TechDudes pages
import HomePage from "./pages/HomePage";
import ServicesPage from "./pages/ServicesPage";
import ProjectsPage from "./pages/ProjectsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import TeamPage from "./pages/TeamPage";
import NotFound from "./pages/NotFound";

// Personal portfolio
import Portfolio from "./pages/Portfolio";

// Legal pages
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";

// Internship pages
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
import EmailVerified from "./pages/internship/EmailVerified";

// Admin pages
import AdminInternship from "./pages/admin/AdminInternship";

const queryClient = new QueryClient();

// Scroll to top when navigating between pages
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Sonner />

        <div className="relative flex min-h-screen flex-col">
          {/* Shared TechDudes background */}
          <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <AuroraBackground
              gradientColors={[
                "rgba(99, 102, 241, 0.20)",
                "rgba(139, 92, 246, 0.20)",
              ]}
              pulseDuration={8}
              starCount={80}
            />
          </div>

          <div className="relative z-10 flex min-h-screen flex-1 flex-col">
            <BrowserRouter>
              <ScrollToTop />

              <Navbar />

              {/* Route content fills available space */}
              <div className="flex-1">
                <Routes>
                  {/* Main TechDudes website */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/services" element={<ServicesPage />} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/team" element={<TeamPage />} />

                  {/* Personal portfolio */}
                  <Route path="/abishek" element={<Portfolio />} />

                  {/* Legal pages */}
                  <Route path="/terms" element={<Terms />} />
                  <Route
                    path="/privacy-policy"
                    element={<PrivacyPolicy />}
                  />
                  <Route
                    path="/refund-policy"
                    element={<RefundPolicy />}
                  />

                  {/* Public certificate verification */}
                  <Route path="/verify" element={<VerifyCertificate />} />
                  <Route
                    path="/verify/:code"
                    element={<VerifyCertificate />}
                  />
                  <Route
                    path="/verify-certificate/:code"
                    element={<VerifyCertificate />}
                  />

                  {/* Email verification */}
                  <Route
                    path="/auth/email-verified"
                    element={<EmailVerified />}
                  />

                  {/* Internship portal */}
                  <Route
                    path="/internship"
                    element={<InternshipLanding />}
                  />
                  <Route
                    path="/internship/login"
                    element={<InternshipLogin />}
                  />
                  <Route
                    path="/internship/register"
                    element={<InternshipRegister />}
                  />
                  <Route
                    path="/internship/enroll/:slug"
                    element={<InternshipEnroll />}
                  />

                  {/* Internship learning modules */}
                  <Route
                    path="/internship/modules/:enrollmentId"
                    element={<InternshipModules />}
                  />
                  <Route
                    path="/internship/modules/:enrollmentId/:moduleId"
                    element={<InternshipModules />}
                  />

                  {/* Internship quiz */}
                  <Route
                    path="/internship/quiz/:enrollmentId"
                    element={<InternshipQuiz />}
                  />

                  {/* Certificate payment */}
                  <Route
                    path="/internship/pay/:enrollmentId"
                    element={<InternshipPay />}
                  />

                  {/* Student dashboard */}
                  <Route
                    path="/internship/dashboard"
                    element={<InternshipDashboard />}
                  />

                  {/* Internship certificate */}
                  <Route
                    path="/internship/certificate/:enrollmentId"
                    element={<InternshipCertificateView />}
                  />

                  {/* Protected admin dashboard */}
                  <Route
                    path="/admin/internship"
                    element={
                      <AdminRoute>
                        <AdminInternship />
                      </AdminRoute>
                    }
                  />

                  {/* 404 page */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>

              {/* Render the shared footer only once */}
              <Footer />
            </BrowserRouter>
          </div>
        </div>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
