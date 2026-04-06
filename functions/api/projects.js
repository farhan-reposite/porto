// functions/api/projects.js
// Handles GET (list all) and POST (create new)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

// GET /api/projects — return all projects sorted
export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT * FROM projects ORDER BY sort_order ASC, id ASC"
    ).all();

    // Parse tags from comma-separated string to array
    const projects = results.map((p) => ({
      ...p,
      tags: p.tags ? p.tags.split(",").map((t) => t.trim()) : [],
    }));

    return new Response(JSON.stringify(projects), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

// POST /api/projects — create a new project
export async function onRequestPost(context) {
  try {
    // Check admin password
    const authHeader = context.request.headers.get("Authorization");
    const adminPass = context.env.ADMIN_PASSWORD;

    if (!authHeader || authHeader !== `Bearer ${adminPass}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json();
    const { num, title, description, tags, sort_order } = body;

    if (!num || !title || !description || !tags) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: num, title, description, tags" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // tags comes as array from frontend, store as comma-separated
    const tagsStr = Array.isArray(tags) ? tags.join(",") : tags;

    const result = await context.env.DB.prepare(
      "INSERT INTO projects (num, title, description, tags, sort_order) VALUES (?, ?, ?, ?, ?)"
    )
      .bind(num, title, description, tagsStr, sort_order || 0)
      .run();

    return new Response(
      JSON.stringify({ success: true, id: result.meta.last_row_id }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}