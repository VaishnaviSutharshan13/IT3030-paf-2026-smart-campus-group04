import { useMemo } from "react";
import { useLocation } from "react-router-dom";

export default function useAuthRedirect() {
  const location = useLocation();

  return useMemo(() => {
    const from = location.state?.from?.pathname;
    return from && from !== "/login" ? from : null;
  }, [location.state]);
}
