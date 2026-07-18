import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topic, language, prompt_template } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "O campo topic e obrigatorio." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY nao configurada nas secrets do Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const basePrompt = prompt_template ||
      `Voce e um criador de licoes de idiomas para um app de aprendizado gamificado chamado FALLA.
Crie uma licao curta sobre o tema "${topic}" no idioma "${language || 'en'}".

Responda SOMENTE em JSON valido, no seguinte formato exato:
{
  "lesson": {
    "id": "ai_lesson_slug",
    "title": "titulo curto",
    "description": "descricao breve",
    "xpReward": 20,
    "questions": [
      {
        "id": "q1",
        "type": "multiple-choice",
        "prompt": "pergunta",
        "options": ["opcao1", "opcao2", "opcao3", "opcao4"],
        "correctAnswer": "opcao correta",
        "characterHint": "Lico",
        "hintText": "dica curta do mascote"
      }
    ]
  }
}

Crie entre 4 e 6 perguntas, variando os tipos entre multiple-choice e sentence-builder quando fizer sentido. Nao inclua nenhum texto fora do JSON.`;

    const geminiResponse = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: basePrompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      throw new Error(`Erro na API Gemini: ${errText}`);
    }

    const geminiData = await geminiResponse.json();
    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error("Resposta vazia da API Gemini.");
    }

    const parsed = JSON.parse(rawText);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error(error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
