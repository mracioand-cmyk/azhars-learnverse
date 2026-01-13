import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, subjectName, stage, grade, section } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Build context about the subject
    let subjectContext = `أنت مساعد تعليمي ذكي لمنصة "أزهاريون" التعليمية الأزهرية.`;
    subjectContext += `\nالمادة الحالية: ${subjectName}`;
    
    if (stage) {
      const stageLabel = stage === "preparatory" ? "المرحلة الإعدادية" : "المرحلة الثانوية";
      subjectContext += `\nالمرحلة: ${stageLabel}`;
    }
    
    if (grade) {
      const gradeLabel = grade === "first" ? "الصف الأول" : grade === "second" ? "الصف الثاني" : "الصف الثالث";
      subjectContext += `\nالصف: ${gradeLabel}`;
    }
    
    if (section) {
      const sectionLabel = section === "scientific" ? "علمي" : "أدبي";
      subjectContext += `\nالشعبة: ${sectionLabel}`;
    }

    const systemPrompt = `${subjectContext}

مهمتك:
- مساعدة الطلاب في فهم المادة والإجابة على أسئلتهم
- شرح المفاهيم بطريقة سهلة ومبسطة
- تقديم أمثلة توضيحية عند الحاجة
- التشجيع والتحفيز للطلاب
- الرد باللغة العربية الفصحى
- إذا كان السؤال خارج نطاق المادة، وجه الطالب بلطف للسؤال المناسب

أسلوبك:
- ودود ومشجع
- واضح ومباشر
- استخدم الأمثلة والتشبيهات
- قسم الإجابات الطويلة لنقاط
- استخدم الرموز التعبيرية باعتدال 📚✨`;

    // Format messages for Gemini API
    const geminiMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    // Add system instruction as first user message if not already present
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model", 
        parts: [{ text: "فهمت! أنا جاهز لمساعدة الطلاب في هذه المادة. كيف يمكنني مساعدتك؟" }]
      },
      ...geminiMessages
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة بعد قليل" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract the response text
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
      "عذراً، لم أتمكن من معالجة طلبك. حاول مرة أخرى.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "حدث خطأ غير متوقع" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
