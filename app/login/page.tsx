"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { getFirebaseAuth, initializeFirebaseClient } from "@/lib/firebase-client";

function safeReturnTo(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const params = typeof window === "undefined" ? null : new URLSearchParams(location.search);
  const returnTo = safeReturnTo(params?.get("returnTo") || null);

  useEffect(() => {
    initializeFirebaseClient().then(async () => {
      if (params?.get("logout") === "1") {
        await signOut(getFirebaseAuth());
        location.replace("/");
      }
    });
  }, []);

  async function emailAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();
    try {
      if (mode === "signup") {
        const result = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
        if (name) await updateProfile(result.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
      }
      location.replace(returnTo);
    } catch (cause: any) {
      setError(cause?.code === "auth/invalid-credential" ? "Incorrect email or password." : "We couldn't sign you in. Please check your details.");
    } finally {
      setBusy(false);
    }
  }

  async function googleAuth() {
    setBusy(true);
    setError("");
    try {
      await signInWithPopup(getFirebaseAuth(), new GoogleAuthProvider());
      location.replace(returnTo);
    } catch (cause: any) {
      if (cause?.code !== "auth/popup-closed-by-user") setError("Google sign-in could not be completed.");
      setBusy(false);
    }
  }

  async function resetPassword() {
    const email = prompt("Enter the email address for your RYZE account:")?.trim();
    if (!email) return;
    try {
      await sendPasswordResetEmail(getFirebaseAuth(), email);
      alert("Password reset email sent.");
    } catch {
      setError("We couldn't send the reset email. Check the address and try again.");
    }
  }

  return (
    <main className="auth-page">
      <a className="auth-brand" href="/">RYZE <span>STORES</span></a>
      <section className="auth-card">
        <p className="eyebrow">YOUR RYZE</p>
        <h1>{mode === "signin" ? "Welcome back." : "Create your account."}</h1>
        <p>Save your bag, track orders and receive member-only offers.</p>
        <button className="btn outlined full" onClick={googleAuth} disabled={busy}>Continue with Google</button>
        <div className="auth-divider"><span>or use email</span></div>
        <form className="form-stack" onSubmit={emailAuth}>
          {mode === "signup" && <label>Full name<input name="name" required minLength={2} autoComplete="name" /></label>}
          <label>Email<input name="email" type="email" required autoComplete="email" /></label>
          <label>Password<input name="password" type="password" required minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="btn primary full" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        {mode === "signin" && <button className="text-link auth-text-button" onClick={resetPassword}>Forgot password?</button>}
        <button className="text-link auth-text-button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(""); }}>
          {mode === "signin" ? "New to RYZE? Create an account" : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
