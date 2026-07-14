import { redirect } from "next/navigation";

/** Alias route: /admin → /founder */
export default function AdminRedirect() {
  redirect("/founder");
}
