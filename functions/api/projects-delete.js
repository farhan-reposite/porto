// functions/api/projects-delete.js
// Handles POST to /api/projects-delete with { id } in body
// (Using POST instead of DELETE because Cloudflare Pages file-based routing
//  maps filenames to paths — this keeps it simple)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

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
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing required field: id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    await context.env.DB.prepare("DELETE FROM projects WHERE id = ?")
      .bind(id)
      .run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}