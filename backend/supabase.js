import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
console.log(supabaseServiceRoleKey
  
)

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("❌ Missing Supabase environment variables in backend .env file");
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
