import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const useInternshipBackToDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handlePopState = () => {
      navigate("/internship/dashboard", { replace: true });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate, location.pathname]);
};

export default useInternshipBackToDashboard;