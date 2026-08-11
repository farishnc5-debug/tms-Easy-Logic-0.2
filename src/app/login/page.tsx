import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-[#0b1b3a] via-[#12244e] to-[#193166] p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 600 800" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M50 700 L120 620 L180 640 L240 560 L300 580 L360 480 L420 500 L480 380 L540 400"
              stroke="white"
              strokeWidth="3"
              fill="none"
            />
            <circle cx="50" cy="700" r="6" fill="white" />
            <circle cx="540" cy="400" r="6" fill="white" />
          </svg>
        </div>
        <div className="relative z-10">
          <p className="text-4xl font-extrabold tracking-wide">
            Easy <span className="text-sky-400">Logic</span>
          </p>
          <p className="mt-1 text-xs tracking-[0.3em] text-slate-300">INTELLIGENT LOGISTICS OS</p>
        </div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            End-to-end visibility for your entire fleet, in real time.
          </h1>
          <p className="text-slate-300 max-w-md">
            Track shipments, dispatch drivers, monitor fleet health, and manage the full
            logistics cycle from a single operational cockpit.
          </p>
        </div>
        <div className="relative z-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Easy Logic. All rights reserved.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <p className="text-3xl font-extrabold tracking-wide text-[#0b1b3a]">
              Easy <span className="text-sky-500">Logic</span>
            </p>
            <p className="mt-1 text-[10px] tracking-[0.3em] text-slate-400">
              INTELLIGENT LOGISTICS OS
            </p>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to your operations dashboard.</p>

          <LoginForm />

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-600">Demo credentials</p>
            <p className="mt-1">faris.hnc5@gmail.com / password123 (Admin)</p>
            <p>faris.hnc6@gmail.com / password123 (Dispatcher)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
