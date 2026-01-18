import { Route, Routes, Navigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Dashboard from "@/pages/Dashboard";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";
import TopNav from "@/components/TopNav";
import About from "@/pages/About";
import Home from "@/pages/Home";
import { WorkerProvider } from "@/providers/WorkerProvider";

const App = () => {
  return (
    <WorkerProvider>
      <div className="min-h-screen bg-linear-to-b from-amber-50 via-white to-rose-50 text-slate-900">
        <TopNav />
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/sign-in/*" element={<SignInPage />} />
            <Route path="/sign-up/*" element={<SignUpPage />} />
            <Route
              path="/app"
              element={
                <>
                  <SignedIn>
                    <Dashboard />
                  </SignedIn>
                  <SignedOut>
                    <Navigate to="/sign-in" replace />
                  </SignedOut>
                </>
              }
            />
          </Routes>
        </main>
      </div>
    </WorkerProvider>
  );
};

export default App;
