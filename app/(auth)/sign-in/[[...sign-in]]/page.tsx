import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-950 px-4 py-12">
      <SignIn
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "mx-auto w-full max-w-md",
            card: "bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl rounded-3xl p-6",
            headerTitle: "text-white text-2xl font-bold",
            headerSubtitle: "text-slate-400 text-sm",
            socialButtonsBlockButton: "border-slate-800 bg-slate-950 text-slate-200 hover:bg-slate-800",
            formFieldLabel: "text-slate-300 font-semibold text-xs",
            formFieldInput: "bg-slate-950/80 border-slate-800 text-white rounded-xl focus:border-cyan-500",
            formButtonPrimary: "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl h-11",
            footerActionText: "text-slate-400 text-xs",
            footerActionLink: "text-cyan-400 hover:text-cyan-300 font-semibold text-xs",
          },
        }}
      />
    </div>
  );
}