import { getCompanyName } from "../../dashboard/actions";
import LoginForm from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  // Server-side so the brand is in the first paint rather than arriving after a
  // client fetch. getCompanyName caches for an hour and falls back on its own.
  const [companyName, { reason }] = await Promise.all([
    getCompanyName(),
    searchParams,
  ]);

  return <LoginForm companyName={companyName} reason={reason ?? null} />;
}
