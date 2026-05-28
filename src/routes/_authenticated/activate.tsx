import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/activate")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
