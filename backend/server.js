import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import {supabase} from "./supabase.js";



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("✅ Backend is running and Supabase is connected!");
});

// Example: Test Supabase connection
app.get("/test-supabase", async (req, res) => {
  const { data, error } = await supabase.from("users").select("*").limit(1);
  console.log(data, error);
  if (error) {
    console.error("❌ Supabase connection failed:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
  res.json({ success: true, message: "✅ Connected to Supabase!", data });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
