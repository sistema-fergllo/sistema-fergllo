import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ success: false, error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    return reply({ success: false, error: "إعدادات خدمة Supabase غير مكتملة" }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return reply({ success: false, error: "يجب تسجيل دخول الأدمن أولًا" }, 401);

  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
  if (userError || !userData.user) return reply({ success: false, error: "جلسة الأدمن غير صالحة؛ سجّل الدخول مرة أخرى" }, 401);

  const adminClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from("user_profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileError || profile?.role !== "admin") {
    return reply({ success: false, error: "غير مسموح؛ إنشاء العملاء متاح للأدمن فقط" }, 403);
  }

  let input: { name?: string; username?: string; password?: string; project?: string; status?: string };
  try {
    input = await req.json();
  } catch {
    return reply({ success: false, error: "بيانات الطلب غير صحيحة" }, 400);
  }

  const name = String(input.name || "").trim();
  const username = String(input.username || "").trim().toLowerCase();
  const password = String(input.password || "");
  const project = String(input.project || "").trim();
  const status = String(input.status || "نشط");
  if (!name || !/^[a-z0-9._-]+$/.test(username) || password.length < 6) {
    return reply({ success: false, error: "راجع اسم العميل واسم المستخدم وكلمة المرور (6 أحرف على الأقل)" }, 400);
  }

  const syntheticEmail = username + "@fergllo.local";
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true,
    user_metadata: { account_type: "client", full_name: name, username },
  });
  if (createError || !created.user) {
    const message = createError?.message || "تعذر إنشاء حساب الدخول";
    const friendly = /already|registered|duplicate/i.test(message)
      ? "اسم المستخدم مستخدم بالفعل؛ اختر اسمًا آخر"
      : message;
    return reply({ success: false, error: friendly }, 400);
  }

  const clientId = crypto.randomUUID();
  const { error: accountError } = await adminClient.from("client_accounts").insert({
    id: clientId,
    name,
    username,
    project,
    email: "",
    status,
  });
  if (accountError) {
    await adminClient.auth.admin.deleteUser(created.user.id);
    const friendly = /duplicate|unique/i.test(accountError.message)
      ? "اسم المستخدم مستخدم بالفعل؛ اختر اسمًا آخر"
      : accountError.message;
    return reply({ success: false, error: "تعذر حفظ بيانات العميل: " + friendly }, 400);
  }

  const { error: profileInsertError } = await adminClient.from("user_profiles").insert({
    user_id: created.user.id,
    full_name: name,
    role: "client",
    client_id: clientId,
  });
  if (profileInsertError) {
    await adminClient.from("client_accounts").delete().eq("id", clientId);
    await adminClient.auth.admin.deleteUser(created.user.id);
    return reply({ success: false, error: "تعذر حفظ صلاحيات العميل: " + profileInsertError.message }, 400);
  }

  return reply({ success: true, client_id: clientId, username });
});
