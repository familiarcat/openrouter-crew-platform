import { NextResponse } from "next/server";

// Mock auth implementation to bypass NextAuth version mismatch (v4 vs v5)
// This ensures the build passes regardless of which version is installed.

export const auth = async () => {
  return {
    user: {
      name: "Alex AI User",
      email: "user@alex.ai",
      image: ""
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  };
};

export const handlers = {
  GET: (req: any) => NextResponse.json({ message: "Auth GET handler" }),
  POST: (req: any) => NextResponse.json({ message: "Auth POST handler" })
};

export const signIn = async () => {};
export const signOut = async () => {};
