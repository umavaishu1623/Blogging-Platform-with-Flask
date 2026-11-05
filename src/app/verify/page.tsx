import Link from "next/link";
import { verifyEmail } from "@/lib/actions/auth";

type VerifyPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { email, token } = await searchParams;
  const verified = email && token ? await verifyEmail(email, token) : false;

  return (
    <section className="verify-page page-width">
      <p className="eyebrow">ACCOUNT VERIFICATION</p>
      <h1>{verified ? "You're all set." : "This link has expired."}</h1>
      <p>{verified ? "Your email is verified. Sign in to save stories and start writing." : "Request a new verification email by creating an account or contact support if you need help."}</p>
      <Link className="button" href={verified ? "/login" : "/register"}>{verified ? "Continue to sign in" : "Back to registration"}</Link>
    </section>
  );
}