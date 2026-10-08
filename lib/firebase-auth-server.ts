import type { DecodedIdToken } from "firebase-admin/auth";
import { firebaseAdmin } from "@/lib/firebase-admin";

export type StoreUser = {
  userId: string;
  email: string;
  fullName: string | null;
};

export async function getFirebaseUser(req: Request): Promise<StoreUser | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  let token: DecodedIdToken;
  try {
    token = await firebaseAdmin().auth.verifyIdToken(header.slice(7), true);
  } catch {
    return null;
  }

  if (!token.email) return null;
  return {
    userId: token.uid,
    email: token.email,
    fullName: typeof token.name === "string" ? token.name : null,
  };
}
