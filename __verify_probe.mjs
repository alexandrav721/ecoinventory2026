import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const envOf = (p,u,k) => { const e = Object.fromEntries(
  fs.readFileSync(p,"utf8").split("\n").filter(l=>l.includes("=")&&!l.trim().startsWith("#"))
   .map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,"")];}));
  return { url: e[u], client: createClient(e[u], e[k]) }; };
const app = envOf("/Users/akexandravargas/Claude/ecoinventory-mobile/.env","EXPO_PUBLIC_SUPABASE_URL","EXPO_PUBLIC_SUPABASE_ANON_KEY");
const web = envOf("/Users/akexandravargas/Claude/ecoinventory2026-brand-preview/.env","VITE_SUPABASE_URL","VITE_SUPABASE_PUBLISHABLE_KEY");

for (const [name,o] of [["APP",app],["WEB",web]]) {
  console.log("=====",name,o.url);
  // storageKey namespacing check
  try { console.log("  storageKey:", o.client.auth.storageKey); } catch(e){ console.log("  storageKey err", e.message); }
  const ids = await o.client.from("profiles").select("id");
  console.log("  profiles.select(id) -> error:", ids.error ? JSON.stringify(ids.error) : "NONE", "| count:", ids.data ? ids.data.length : null);
  if (ids.data) { o.ids = ids.data.map(r=>r.id); console.log("  first 3 ids:", o.ids.slice(0,3)); }
  const pc = await o.client.from("profiles").select("*",{count:"exact",head:true});
  console.log("  profiles exact count:", pc.count, "| error:", pc.error ? JSON.stringify(pc.error) : "NONE");
  const ic = await o.client.from("inventory_items").select("*",{count:"exact",head:true});
  console.log("  inventory_items exact count:", ic.count, "| error:", ic.error ? JSON.stringify(ic.error) : "NONE");
}
if (app.ids && web.ids) {
  const s = new Set(web.ids);
  const inter = app.ids.filter(i=>s.has(i));
  console.log("\nAPP visible ids:", app.ids.length, "WEB visible ids:", web.ids.length, "INTERSECTION:", inter.length, inter);
}
