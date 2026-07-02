import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/rescue/")({
  head: () => ({ meta: [{ title: "Diem giai cuu - AgriConnect" }] }),
  component: RescueRedirect,
});

function RescueRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/rescue-points", replace: true });
  }, [navigate]);

  return null;
}
