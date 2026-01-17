import { SignIn } from "@clerk/clerk-react";

const SignInPage = () => {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
        <SignIn routing="path" path="/sign-in" />
      </div>
    </section>
  );
};

export default SignInPage;
