'use client'
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center p-24">
        <h2>
        Welcome to the page where you can see your profile.
        If you are already member
        </h2>
        <h1>
          <Link href="/login">Login</Link>
        </h1>
        <h2>If you are new. Please</h2>
        <h1>
          <Link href="/signup">Sign up</Link>
        </h1>
    </div>
  );
}
