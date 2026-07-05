import { Suspense } from "react";
import VerifyEmailPage from "./VerifyEmailPage";

export default function Page() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-bosporus-muted">…</div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
