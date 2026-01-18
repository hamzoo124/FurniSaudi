// @ts-ignore
import { supabase } from "./lib/supabase";



async function testConnection() {
  const { data, error } = await supabase.from("products").select("*").limit(1);

  if (error) {
    console.error("❌ Supabase connection failed:", error.message);
  } else {
    console.log("✅ Supabase connection successful! Sample data:", data);
  }
}

testConnection();
 
