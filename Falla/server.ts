import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Ensure Gemini is initialized safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

const app = express();
app.use(express.json());

// In-Memory Database for courses and dynamic content
let courses = [
  {
    id: "en_basic",
    name: "Inglês para Iniciantes",
    language: "en",
    flag: "🇺🇸",
    description: "Aprenda o básico do inglês com foco em conversação, gramática e vocabulário essencial de forma divertida!",
    modules: [
      {
        id: "en_mod_1",
        title: "Apresentações & Cumprimentos",
        description: "Aprenda a dizer oi, tchau, agradecer e fazer perguntas simples de convivência diária.",
        lessons: [
          {
            id: "en_les_1",
            title: "Primeiros Passos",
            description: "Palavras mágicas e cumprimentos essenciais.",
            xpReward: 20,
            questions: [
              {
                id: "q_en_1",
                type: "multiple-choice",
                prompt: "Como se diz 'Olá' em inglês?",
                options: ["Goodbye", "Thank you", "Hello", "Please"],
                correctAnswer: "Hello",
                characterHint: "Lico",
                hintText: "Eu sou o Livro Lico! Essa palavra é usada no mundo todo para cumprimentar as pessoas!"
              },
              {
                id: "q_en_2",
                type: "sentence-builder",
                prompt: "Monte a frase: 'Eu sou um menino'",
                options: ["boy", "am", "I", "a", "girl"],
                correctAnswer: ["I", "am", "a", "boy"],
                characterHint: "Guga",
                hintText: "Oi, eu sou o Guga! Monte a frase começando pelo sujeito 'I' (Eu)!"
              },
              {
                id: "q_en_3",
                type: "match-pairs",
                prompt: "Combine as traduções corretas:",
                options: ["Please", "Por favor", "Thank you", "Obrigado", "Goodbye", "Adeus"],
                correctAnswer: ["Please:Por favor", "Thank you:Obrigado", "Goodbye:Adeus"],
                characterHint: "Teddy",
                hintText: "Sempre seja educado, amiguinho! Teddy aprova a cortesia!"
              },
              {
                id: "q_en_4",
                type: "speak-sim",
                prompt: "Pronuncie em voz alta:",
                text: "Nice to meet you",
                translation: "Prazer em te conhecer",
                correctAnswer: "nice to meet you",
                characterHint: "Pingo",
                hintText: "Fale devagar e de forma limpa! 'Náis tu mít iu'!"
              }
            ]
          },
          {
            id: "en_les_2",
            title: "Diálogo Simples",
            description: "Perguntando o nome e respondendo.",
            xpReward: 25,
            questions: [
              {
                id: "q_en_5",
                type: "multiple-choice",
                prompt: "Qual é a pergunta correta para saber o nome de alguém?",
                options: ["How old are you?", "What is your name?", "Where are you from?", "Who are you?"],
                correctAnswer: "What is your name?",
                characterHint: "Bia",
                hintText: "Bia aqui! 'Name' significa nome em inglês. Bem óbvio, né?"
              },
              {
                id: "q_en_6",
                type: "sentence-builder",
                prompt: "Monte a frase: 'Meu nome é Guga'",
                options: ["Guga", "name", "My", "is", "your"],
                correctAnswer: ["My", "name", "is", "Guga"],
                characterHint: "Guga",
                hintText: "A palavra 'My' indica posse, ou seja, meu!"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "es_basic",
    name: "Espanhol Divertido",
    language: "es",
    flag: "🇪🇸",
    description: "Conquiste o espanhol dominando o vocabulário das cores, saudações e frases do cotidiano.",
    modules: [
      {
        id: "es_mod_1",
        title: "Saludos & Colores",
        description: "Comece a falar espanhol com segurança!",
        lessons: [
          {
            id: "es_les_1",
            title: "Cumprimentos e Cores",
            description: "Dizendo 'hola' e aprendendo cores vibrantes.",
            xpReward: 20,
            questions: [
              {
                id: "q_es_1",
                type: "multiple-choice",
                prompt: "Qual cor representa 'Rojo' em espanhol?",
                options: ["Azul", "Amarelo", "Vermelho", "Verde"],
                correctAnswer: "Vermelho",
                characterHint: "Pip",
                hintText: "Eu sou o Lápis Pip! Rojo é a cor do morango e do tomate!"
              },
              {
                id: "q_es_2",
                type: "sentence-builder",
                prompt: "Monte a frase: 'Olá, bom dia'",
                options: ["días", "Hola", "buenos", "tardes"],
                correctAnswer: ["Hola", "buenos", "días"],
                characterHint: "Lico",
                hintText: "Lico dando uma dica: lembre-se de colocar o 'buenos' antes de 'días'!"
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "pt_basic",
    name: "Português para Todos",
    language: "pt",
    flag: "🇧🇷",
    description: "Para falantes de outros idiomas que querem dominar a língua portuguesa com gírias e expressões regionais.",
    modules: [
      {
        id: "pt_mod_1",
        title: "Bem-vindo ao Brasil",
        description: "Expressões essenciais do português brasileiro.",
        lessons: [
          {
            id: "pt_les_1",
            title: "Tudo bem?",
            description: "O cumprimento mais famoso do Brasil.",
            xpReward: 20,
            questions: [
              {
                id: "q_pt_1",
                type: "multiple-choice",
                prompt: "O que significa 'Tudo bem' em português?",
                options: ["What is your name?", "How are you?", "Excuse me", "Welcome"],
                correctAnswer: "How are you?",
                characterHint: "Pingo",
                hintText: "Pingo aqui! No Brasil, 'Tudo bem?' é usado para absolutamente qualquer encontro!"
              },
              {
                id: "q_pt_2",
                type: "sentence-builder",
                prompt: "Monte a frase: 'Obrigado pela ajuda'",
                options: ["ajuda", "pela", "Obrigado", "de", "nada"],
                correctAnswer: ["Obrigado", "pela", "ajuda"],
                characterHint: "Teddy",
                hintText: "Ser gentil aquece o coração! Expresse gratidão!"
              }
            ]
          }
        ]
      }
    ]
  }
];

// Leaderboard Dynamic Mock Database (Updates randomly on requests to simulate activity)
let leaderboard = [
  { id: "1", name: "Davi", xp: 1240, streak: 45, state: "SP", country: "🇧🇷 Brasil", avatar: "🦊" },
  { id: "2", name: "Alice", xp: 1100, streak: 32, state: "RJ", country: "🇧🇷 Brasil", avatar: "🐼" },
  { id: "3", name: "Gabriel", xp: 950, streak: 12, state: "MG", country: "🇧🇷 Brasil", avatar: "🐸" },
  { id: "4", name: "Lucas", xp: 870, streak: 8, state: "RS", country: "🇧🇷 Brasil", avatar: "🐯" },
  { id: "5", name: "Manuela", xp: 820, streak: 15, state: "BA", country: "🇧🇷 Brasil", avatar: "🦁" },
  { id: "6", name: "Mateo", xp: 740, streak: 20, state: "Madrid", country: "🇪🇸 Espanha", avatar: "🐒" },
  { id: "7", name: "Sofia", xp: 690, streak: 19, state: "Lisboa", country: "🇵🇹 Portugal", avatar: "🦄" },
  { id: "8", name: "Emma", xp: 620, streak: 5, state: "California", country: "🇺🇸 EUA", avatar: "🐻" },
];

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// GET all courses
app.get("/api/courses", (req, res) => {
  res.json(courses);
});

// POST to add/update a course (Admin content manager)
app.post("/api/courses", (req, res) => {
  const newCourse = req.body;
  if (!newCourse.id || !newCourse.name) {
    return res.status(400).json({ error: "O curso precisa de um ID e um Nome válidos." });
  }

  // Check if exists
  const index = courses.findIndex(c => c.id === newCourse.id);
  if (index !== -1) {
    courses[index] = { ...courses[index], ...newCourse };
  } else {
    courses.push({
      modules: [],
      ...newCourse
    });
  }
  res.json({ success: true, courses });
});

// POST to add a lesson to a course module
app.post("/api/courses/:courseId/modules/:moduleId/lessons", (req, res) => {
  const { courseId, moduleId } = req.params;
  const newLesson = req.body;

  const course = courses.find(c => c.id === courseId);
  if (!course) return res.status(404).json({ error: "Curso não encontrado." });

  const mod = course.modules.find(m => m.id === moduleId);
  if (!mod) return res.status(404).json({ error: "Módulo não encontrado." });

  if (!newLesson.id || !newLesson.title) {
    return res.status(400).json({ error: "A lição necessita de um ID e Título válidos." });
  }

  const index = mod.lessons.findIndex(l => l.id === newLesson.id);
  if (index !== -1) {
    mod.lessons[index] = newLesson;
  } else {
    mod.lessons.push(newLesson);
  }

  res.json({ success: true, courses });
});

// GET Leaderboard (With live XP updates simulation)
app.get("/api/leaderboard", (req, res) => {
  // Simulate active typing/learning by other users
  leaderboard = leaderboard.map(user => {
    if (Math.random() > 0.6) {
      return {
        ...user,
        xp: user.xp + Math.floor(Math.random() * 15) + 5
      };
    }
    return user;
  });

  // Sort by XP
  leaderboard.sort((a, b) => b.xp - a.xp);

  res.json(leaderboard);
});

// AI endpoints using @google/genai SDK
// Endpoint 1: Gemini Explains a Language Context or Error (As a custom tutor Mascot!)
app.post("/api/gemini/explain", async (req, res) => {
  const { phrase, language, mascot, userPrompt } = req.body;

  if (!ai) {
    return res.json({
      explanation: `[Modo Offline - Gemini API Key não configurada]\n\nOlá! Eu sou o ${mascot || "Lico"}. Para habilitar explicações inteligentes de IA personalizadas para cada frase, lembre-se de configurar a variável GEMINI_API_KEY no painel de Secrets da plataforma!\n\nExplicação de demonstração: A frase "${phrase}" está correta. Continue estudando para desbloquear todo o seu potencial!`,
      success: false
    });
  }

  try {
    const mascotStylePrompt = mascot === "Teddy" 
      ? "Você é o ursinho Teddy. Você é fofinho, carinhoso, calmo, acolhedor e perdoa erros facilmente. Dê uma explicação carinhosa e diga que está tudo bem errar."
      : mascot === "Bia"
      ? "Você é a Bia, uma garota cientista de 11 anos altamente focada, analítica, muito inteligente e que dá explicações claras, técnicas mas acessíveis com um tom científico e empoderador."
      : mascot === "Luna"
      ? "Você é a corujinha Luna. Você é extremamente determinada, foca na disciplina, no hábito diário e no Streak. Dê uma explicação direta e encorajadora para não desistir!"
      : "Você é o Livro Lico. Você é sábio, divertido, adora curiosidades históricas sobre palavras e fala de maneira animada com crianças e jovens.";

    const systemInstruction = `Você é um tutor de idiomas ultra carismático dentro do app FALLA (similar ao Duolingo). 
${mascotStylePrompt}
Mantenha sua explicação curta (máximo 4 parágrafos pequenos), extremamente amigável, clara para iniciantes e adaptada à personalidade do seu mascote. 
Utilize emojis condizentes com o personagem. Explique as regras de gramática, vocabulário ou montagem de frases em português do Brasil de maneira lúdica.`;

    const promptText = `Por favor, explique a frase ou dúvida a seguir: "${phrase || userPrompt}" no idioma "${language || "Inglês"}".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction
      }
    });

    res.json({
      explanation: response.text,
      success: true
    });
  } catch (error: any) {
    console.error("Gemini Explain Error:", error);
    res.status(500).json({ error: "Erro ao processar com a IA. Tente novamente mais tarde." });
  }
});

// Endpoint 2: Gemini AI Custom Lesson Generator!
// Let the user enter a custom topic (e.g. "Space expedition", "Buying an ice cream") and language,
// and Gemini will return a complete structured lesson in JSON format!
app.post("/api/gemini/generate-lesson", async (req, res) => {
  const { topic, language } = req.body;

  if (!ai) {
    // Generate a fallback offline lesson
    const fallbackLesson = {
      id: `ai_les_${Date.now()}`,
      title: `Prática de ${topic || "Tema Livre"}`,
      description: "Lição gerada offline de demonstração.",
      xpReward: 30,
      questions: [
        {
          id: "fallback_q1",
          type: "multiple-choice",
          prompt: `Como se diz 'Oi' no contexto de '${topic}'?`,
          options: ["Hello", "Table", "Chair", "Car"],
          correctAnswer: "Hello",
          characterHint: "Lico",
          hintText: "Dica offline: Hello é um cumprimento universal!"
        },
        {
          id: "fallback_q2",
          type: "sentence-builder",
          prompt: "Monte a frase: 'Eu gosto disso'",
          options: ["it", "like", "I", "you"],
          correctAnswer: ["I", "like", "it"],
          characterHint: "Pip",
          hintText: "Dica offline: Comece com o pronome pessoal I."
        }
      ]
    };

    return res.json({
      lesson: fallbackLesson,
      isOffline: true,
      message: "Modo de demonstração offline ativado (Sem chave API). Para lições geradas dinamicamente com IA de verdade sobre qualquer assunto do mundo, adicione sua chave GEMINI_API_KEY!"
    });
  }

  try {
    const targetLangFull = language === "es" ? "Espanhol" : language === "pt" ? "Português" : "Inglês";
    const systemInstruction = `Você é a inteligência criativa do FALLA. Sua função é gerar uma lição interativa e divertida sobre o tema "${topic}" no idioma "${targetLangFull}" para estudantes lusófonos.
O resultado final DEVE estar no formato JSON seguindo estritamente a estrutura fornecida.
Não inclua nenhuma introdução ou formatação markdown de código além do próprio objeto JSON puro.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.STRING },
        title: { type: Type.STRING, description: "Título curto e animado da lição baseada no tema, em Português." },
        description: { type: Type.STRING, description: "Descrição divertida explicando o que o aluno vai aprender nesta lição específica do tema." },
        xpReward: { type: Type.INTEGER },
        questions: {
          type: Type.ARRAY,
          description: "Lista de exatamente 4 questões variadas sobre o tema para o estudante praticar.",
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              type: { 
                type: Type.STRING, 
                description: "Tipo de questão: 'multiple-choice' ou 'sentence-builder'." 
              },
              prompt: { type: Type.STRING, description: "Instrução clara para o aluno em Português, ex: 'Como se diz...' ou 'Monte a frase...'." },
              text: { type: Type.STRING, description: "Opcional. A frase ou termo em questão para tradução." },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "Para 'multiple-choice': 4 opções de resposta. Para 'sentence-builder': lista de palavras avulsas que formam a frase correta quando reordenadas, acrescidas de 1 ou 2 palavras distratoras adicionais."
              },
              correctAnswer: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Para 'multiple-choice': um array contendo uma única string com a resposta correta exata correspondente a uma das opções. Para 'sentence-builder': um array com as palavras corretas em ordem exata para formar a frase traduzida."
              },
              characterHint: { type: Type.STRING, description: "Escolha um dos mascotes para dar a dica: 'Lico', 'Teddy', 'Bia' ou 'Luna'." },
              hintText: { type: Type.STRING, description: "Dica divertida baseada na personalidade do mascote escolhido para ajudar o aluno a responder." }
            },
            required: ["id", "type", "prompt", "options", "correctAnswer", "characterHint", "hintText"]
          }
        }
      },
      required: ["id", "title", "description", "xpReward", "questions"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Gere uma lição completa de 4 questões sobre o tema: "${topic}" no idioma "${targetLangFull}". Escolha 2 de múltipla escolha (multiple-choice) e 2 de construtor de frase (sentence-builder).`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema
      }
    });

    const parsedLesson = JSON.parse(response.text.trim());
    res.json({
      lesson: parsedLesson,
      isOffline: false
    });
  } catch (error: any) {
    console.error("Gemini Generate Lesson Error:", error);
    res.status(500).json({ error: "Erro ao gerar a lição com a IA de maneira dinâmica. Tente novamente mais tarde." });
  }
});

async function startServer() {
  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FALLA backend server is running on http://localhost:${PORT}`);
  });
}

startServer();
