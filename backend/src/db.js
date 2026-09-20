import pg from "pg";
const { Pool } = pg;

export function createDatabase(connectionString) {
  const pool = new Pool({ connectionString, max: 20, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 5_000, allowExitOnIdle: false });
  pool.on("error", (error) => console.error(JSON.stringify({ level: "error", event: "postgres_pool_error", message: error.message })));
  return {
    query: (text, values) => pool.query(text, values),
    async tx(work) {
      const client = await pool.connect();
      try { await client.query("BEGIN"); const result = await work(client); await client.query("COMMIT"); return result; }
      catch (error) { await client.query("ROLLBACK"); throw error; }
      finally { client.release(); }
    },
    close: () => pool.end(),
  };
}
