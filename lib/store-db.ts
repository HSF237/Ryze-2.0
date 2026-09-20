type StoreRecord = { kind: string; id: string; body: any };

const records = new Map<string, StoreRecord>();
const recordKey = (owner: string, kind: string, id: string) =>
  `${owner}\u0000${kind}\u0000${id}`;

export function database() {
  return {
    prepare() {
      return {
        bind(owner: string, kind: string, id: string, body: string, _updated?: number) {
          return {
            async run() {
              const key = recordKey(owner, kind, id);
              if (records.has(key)) return { meta: { changes: 0 } };
              records.set(key, { kind, id, body: JSON.parse(body) });
              return { meta: { changes: 1 } };
            },
          };
        },
      };
    },
  };
}

export async function readRecords(owner: string) {
  return [...records.entries()]
    .filter(([key]) => key.startsWith(`${owner}\u0000`))
    .map(([, record]) => structuredClone(record));
}

export async function getRecord(owner: string, kind: string, id = "main") {
  const record = records.get(recordKey(owner, kind, id));
  return record ? structuredClone(record.body) : null;
}

export async function putRecord(
  owner: string,
  kind: string,
  id: string,
  body: unknown,
) {
  records.set(recordKey(owner, kind, id), {
    kind,
    id,
    body: structuredClone(body),
  });
}
