import Link from "next/link";
import { VerifyAccountForm } from "@/components/auth/verify-account-form";

type VerifyPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const { email, token } = await searchParams;
  return (
    <section className="verify-page page-width">
      <p className="eyebrow">ACCOUNT VERIFICATION</p>
      <h1>One last step.</h1>
      <p>Confirm your address to finish creating your account.</p>
      {email && token ? <VerifyAccountForm email={email} token={token} /> : <Link className="button" href="/register">Back to registration</Link>}
    </section>
  );
}