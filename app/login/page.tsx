import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Pulsora — Demo access" };

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="panel mt-6 p-6">
          <div className="label">Private demo</div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Enter the demo password</h1>
          <p className="mt-1 text-sm muted">Pulsora is in private preview. Ask the founder for access.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
