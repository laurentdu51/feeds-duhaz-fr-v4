import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const LegacyRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;

    console.log("LegacyRedirect: Checking path:", path);

    // Redirection pour /flux/youtube-* → /feeds
    if (path.startsWith("/flux/youtube")) {
      console.log("Redirecting /flux/youtube-* to /feeds");
      navigate("/feeds", { replace: true });
      return;
    }

    // Redirection pour /account/* → /auth
    if (path.startsWith("/account")) {
      console.log("Redirecting /account/* to /auth");
      navigate("/auth", { replace: true });
      return;
    }

    // Redirection pour /flux/* → page 410
    if (path.startsWith("/flux")) {
      console.log("Redirecting /flux/* to /gone (410)");
      navigate("/gone", { replace: true });
      return;
    }
  }, [location, navigate]);

  return null;
};

export default LegacyRedirect;
