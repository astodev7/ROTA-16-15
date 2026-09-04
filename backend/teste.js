import supabase from "./supabase.js";

const { data, error } = await supabase
    .from("produtos")
    .select("*");