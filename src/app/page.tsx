import { redirect } from "next/navigation";

// La raíz redirige a login; el middleware maneja el redirect post-auth por rol
export default function RootPage() {
  redirect("/login");
}
