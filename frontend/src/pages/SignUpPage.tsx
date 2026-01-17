import { SignUp } from "@clerk/clerk-react";

const SignUpPage = () => {
  return (
    <section className="flex min-h-[60vh] items-center justify-center">
      <div className="rounded-3xl bg-white p-6 shadow-lg ring-1 ring-slate-100">
        <SignUp routing="path" path="/sign-up" />
      </div>
    </section>
  );
};

export default SignUpPage;
