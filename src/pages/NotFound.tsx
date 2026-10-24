import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center">
        <p className="brand-eyebrow mb-3">Veritas SynapseCore</p>
        <h1 className="text-5xl font-semibold mb-4 text-ink">404</h1>
        <div className="section-rule mx-auto mb-6" />
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        <a
          href="/"
          className="text-navy hover:text-gold transition-colors underline underline-offset-4"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
