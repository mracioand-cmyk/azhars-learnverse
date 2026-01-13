import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ChatMsg = { role: "user" | "assistant"; content: string };

function stageLabel(stage?: string) {
  if (stage === "preparatory") return "المرحلة الإعدادية";
  if (stage === "secondary") return "المرحلة الثانوية";
  return undefined;
}

function gradeLabel(grade?: string) {
  if (grade === "first") return "الصف الأول";
  if (grade === "second") return "الصف الثاني";
  if (grade === "third") return "الصف الثالث";
  return undefined;
}

function sectionLabel(section?: string | null) {
  if (section === "scientific") return "علمي";
  if (section === "literary") return "أدبي";
  return undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const messages = (body?.messages ?? []) as ChatMsg[];
    const subjectName = (body?.subjectName ?? "") as string;
    const stage = body?.stage as string | undefined;
    const grade = body?.grade as string | undefined;
    const section = (body?.section ?? null) as string | null;

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "الرسائل غير صالحة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const metaParts: string[] = [];
    if (subjectName) metaParts.push(`المادة: ${subjectName}`);
    const s = stageLabel(stage);
    const g = gradeLabel(grade);
    const sec = sectionLabel(section);
    if (s) metaParts.push(`المرحلة: ${s}`);
    if (g) metaParts.push(`الصف: ${g}`);
    if (sec) metaParts.push(`الشعبة: ${sec}`);

    const systemPrompt = `أنت مساعد تعليمي ذكي لمنصة "أزهاريون".
${metaParts.length ? metaParts.join("\n") : ""}

قواعد مهمة:
- اشرح للطلاب ببساطة وباللغة العربية الفصحى.
- قدّم أمثلة قصيرة وخطوات عند الحاجة.
- إذا كان السؤال خارج نطاق المادة، وضّح ذلك بلطف واقترح سؤالاً مناسباً.
- لا تختلق معلومات؛ إذا لم تكن متأكدًا قل: لا أعلم.
`;

    const gatewayResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (!gatewayResp.ok) {
      const t = await gatewayResp.text();
      console.error("AI gateway error:", gatewayResp.status, t);

      if (gatewayResp.status === 429) {
        return new Response(JSON.stringify({ error: "المساعد مشغول الآن. حاول بعد دقيقة." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (gatewayResp.status === 402) {
        return new Response(JSON.stringify({ error: "تم استنفاد رصيد الذكاء الاصطناعي. يرجى إضافة رصيد ثم إعادة المحاولة." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "حدث خطأ في خدمة الذكاء الاصطناعي." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await gatewayResp.json().catch(() => ({} as any));
    const content = data?.choices?.[0]?.message?.content as string | undefined;

    return new Response(JSON.stringify({ response: content ?? "عذراً، لم أتمكن من الرد الآن. حاول مرة أخرى." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير متوقع" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
