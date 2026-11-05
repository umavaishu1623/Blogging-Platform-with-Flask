import { signOut } from "@/auth";

export function SignOutForm() {
  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return <form action={signOutAction}><button className="text-link" type="submit">Sign out</button></form>;
}