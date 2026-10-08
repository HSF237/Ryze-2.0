import { firebaseAdmin } from "@/lib/firebase-admin";

type StoreRecord = { kind: string; id: string; body: any; updated: number };
const recordsFor = (owner: string) =>
  firebaseAdmin().db.collection("users").doc(owner).collection("records");
const recordId = (kind: string, id: string) =>
  `${encodeURIComponent(kind)}__${encodeURIComponent(id)}`;

export function database() {
  return {
    prepare(_sql?: string) {
      return {
        bind(owner: string, kind: string, id: string, body: string, _updated?: number) {
          return {
            async run() {
              try {
                await recordsFor(owner).doc(recordId(kind, id)).create({
                  kind,
                  id,
                  body: JSON.parse(body),
                  updated: Date.now(),
                });
                return { meta: { changes: 1 } };
              } catch (error: any) {
                if (error?.code === 6 || error?.code === "already-exists")
                  return { meta: { changes: 0 } };
                throw error;
              }
            },
          };
        },
      };
    },
  };
}

export async function readRecords(owner: string) {
  const snapshot = await recordsFor(owner).get();
  return snapshot.docs.map((doc) => doc.data() as StoreRecord);
}

export async function getRecord(owner: string, kind: string, id = "main") {
  const snapshot = await recordsFor(owner).doc(recordId(kind, id)).get();
  return snapshot.exists ? snapshot.data()!.body : null;
}

export async function putRecord(
  owner: string,
  kind: string,
  id: string,
  body: unknown,
) {
  await recordsFor(owner).doc(recordId(kind, id)).set({
    kind,
    id,
    body,
    updated: Date.now(),
  });
}

export async function readImportedCatalog() {
  const snapshot = await firebaseAdmin().db.collection("catalog").limit(250).get();
  return snapshot.docs.map((doc) => doc.data());
}
