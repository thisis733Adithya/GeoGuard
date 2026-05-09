import AppShell from "@/components/AppShell";
import LoginForm from "@/components/LoginForm";

export const metadata = {
  title: "Admin Login | Geo Guard",
  description: "Restricted access — for authorised Geo Guard administrators only.",
};

export default function LoginPage() {
  return (
    <AppShell eyebrow="🔐 Restricted Access" title="Admin Login" subtitle="This portal is for authorised administrators only. Tourists do not need to log in — just enter your Tourist ID on the Tourist Dashboard.">
      <LoginForm />
    </AppShell>
  );
}
