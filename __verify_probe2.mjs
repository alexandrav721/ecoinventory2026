import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
const envOf = (p,u,k) => { const e = Object.fromEntries(
  fs.readFileSync(p,"utf8").split("\n").filter(l=>l.includes("=")&&!l.trim().startsWith("#"))
   .map(l=>{const i=l.indexOf("=");return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,"")];}));
  return { url: e[u], client: createClient(e[u], e[k]) }; };
const app = envOf("/Users/akexandravargas/Claude/ecoinventory-mobile/.env","EXPO_PUBLIC_SUPABASE_URL","EXPO_PUBLIC_SUPABASE_ANON_KEY");
const web = envOf("/Users/akexandravargas/Claude/ecoinventory2026-brand-preview/.env","VITE_SUPABASE_URL","VITE_SUPABASE_PUBLISHABLE_KEY");

const synth = id => /^(.)\1{7}-/.test(id.replace(/-/g,"").slice(0,8)+"-") || /^1{8}-1{4}-1{4}-1{4}-1{10}/.test(id) || /^([0-9a-f])\1+$/.test(id.replace(/-/g,"").slice(0,12));

console.log("### WEB all profile ids + created_at");
let r = await web.client.from("profiles").select("id, created_at").order("created_at",{ascending:true});
if (r.error) console.log("  err:", JSON.stringify(r.error)); else r.data.forEach(p=>console.log("  ", p.id, p.created_at));

console.log("\n### APP all profile ids + created_at");
r = await app.client.from("profiles").select("id, created_at").order("created_at",{ascending:true});
if (r.error) console.log("  err:", JSON.stringify(r.error)); else r.data.forEach(p=>console.log("  ", p.id, p.created_at));

console.log("\n### WEB inventory_items distinct owners");
r = await web.client.from("inventory_items").select("user_id");
if (r.error) console.log("  err:", JSON.stringify(r.error)); else {
  const c = {}; r.data.forEach(x=>c[x.user_id]=(c[x.user_id]||0)+1);
  Object.entries(c).forEach(([k,v])=>console.log("  ",k,"->",v,"items"));
}
console.log("\n### APP inventory_items distinct owners");
r = await app.client.from("inventory_items").select("user_id");
if (r.error) console.log("  err:", JSON.stringify(r.error)); else {
  const c = {}; r.data.forEach(x=>c[x.user_id]=(c[x.user_id]||0)+1);
  Object.entries(c).forEach(([k,v])=>console.log("  ",k,"->",v,"items"));
}
