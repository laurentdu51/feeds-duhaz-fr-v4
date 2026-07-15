import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LegacyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;

    // Redirection pour /flux/youtube-* → /feeds
    if (path.startsWith("/flux/youtube")) {
      navigate("/feeds", { replace: true });
      return;
    }

    // Redirection pour /account/* → /auth
    if (path.startsWith("/account")) {
      navigate("/auth", { replace: true });
      return;
    }

    // Redirection pour /flux/* → page 410
    if (path.startsWith("/flux")) {
      navigate("/gone", { replace: true });
      return;
    }
  }, [location, navigate]);

  return null;
};

export default LegacyRedirect;
