import { Link, NavLink } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton
} from "@clerk/clerk-react";
import { Sparkles } from "lucide-react";

const TopNav = () => {
  return (
    <header className="border-b border-amber-100 bg-white/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-200 text-amber-900">
            <Sparkles className="h-5 w-5" />
          </span>
          Virtue Machine
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/app"
            className={({ isActive }) =>
              isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-900"
            }
          >
            App
          </NavLink>
          <SignedOut>
            <SignInButton>
              <button className="rounded-full border border-slate-200 px-4 py-2 text-slate-700 hover:border-slate-300">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="rounded-full bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </nav>
      </div>
    </header>
  );
};

export default TopNav;
