import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const { error: tableError } = await supabase.from("mistakes").select("id").limit(1);
console.log("mistakes table select:", tableError ? `ERROR: ${tableError.message} (code ${tableError.code})` : "OK");

const { error: rpcError } = await supabase.rpc("record_mistake", {
  p_word: "__migration_check__",
  p_sentence_id: "__migration_check__",
});
console.log(
  "record_mistake rpc:",
  rpcError ? `ERROR: ${rpcError.message} (code ${rpcError.code})` : "OK (unexpected - no FK violation?)",
);
