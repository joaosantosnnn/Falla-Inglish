import React, { useState, useEffect } from 'react';
import { Course, Question, QuestionType, LearningTip, Achievement, AiTutorConfig, Mascot } from '../types';
import { ProfileBanner } from '../data/banners';
import { supabase } from '../lib/supabaseClient';
import { 
  Plus, Trash2, Save, BookOpen, Layers, Check, AlertCircle, 
  Trophy, Sparkles, Smile, MessageSquare, Terminal, HelpCircle, Eye, Settings,
  Users, Bell, FileSpreadsheet, Upload, Download, Palette, Wand2
} from 'lucide-react';
import * as XLSX from 'xlsx';

// Metadados pedagógicos lidos da planilha.
// A planilha nunca define módulo, fase, ordem ou destino da importação.
interface ParsedImportRow {
  line: number;
  tituloLicao: string;
  descricaoLicao: string;
  question: Question;
}

interface AdminPanelProps {
  courses: Course[];
  onRefreshCourses: () => void;
  learningTips: LearningTip[];
  onRefreshTips: () => void;
  achievements: Achievement[];
  onRefreshAchievements: () => void;
  aiTutorConfig: AiTutorConfig;
  onRefreshAiTutorConfig: () => void;
  interfaceTexts: Record<string, string>;
  onRefreshInterfaceTexts: () => void;
  banners: ProfileBanner[];
  onAddCustomBanner: (newBanner: ProfileBanner) => void;
  onDeleteCustomBanner: (bannerId: string) => void;
  mascots: Mascot[];
  onAddCustomMascot: (newMascot: Mascot) => void;
  onDeleteCustomMascot: (mascotId: string) => void;
}

export default function AdminPanel({ 
  courses, 
  onRefreshCourses,
  learningTips,
  onRefreshTips,
  achievements,
  onRefreshAchievements,
  aiTutorConfig,
  onRefreshAiTutorConfig,
  interfaceTexts,
  onRefreshInterfaceTexts,
  banners,
  onAddCustomBanner,
  onDeleteCustomBanner,
  mascots,
  onAddCustomMascot,
  onDeleteCustomMascot
}: AdminPanelProps) {
  
  // Inner Admin Tabs
  const [adminTab, setAdminTab] = useState<'courses' | 'mascots' | 'leaderboard' | 'tips' | 'achievements' | 'ai-tutor' | 'interface' | 'users' | 'push' | 'import-questions' | 'edit-lesson' | 'sql-blueprint' | 'banners'>('courses');

  // New Banner Form States
  const [formBannerName, setFormBannerName] = useState("");
  const [formBannerId, setFormBannerId] = useState("");
  const [formBannerImageUrl, setFormBannerImageUrl] = useState("");
  const [formBannerPrice, setFormBannerPrice] = useState(25);
  const [formBannerUnlockedByDefault, setFormBannerUnlockedByDefault] = useState(false);
  const [formBannerIsAnimated, setFormBannerIsAnimated] = useState(false);
  const [formBannerAnimationType, setFormBannerAnimationType] = useState<'gradient' | 'hue' | 'shimmer' | 'stripes'>('gradient');

  const [activeCourseId, setActiveCourseId] = useState<string>("");
  const [activeModId, setActiveModId] = useState<string>("");

  // Fonte única de verdade do painel administrativo.
  // Somente cursos e módulos realmente persistidos no Supabase entram aqui.
  const [adminCourses, setAdminCourses] = useState<Course[]>([]);
  const [loadingAdminCourses, setLoadingAdminCourses] = useState(false);
  const [adminCoursesError, setAdminCoursesError] = useState<string | null>(null);
  
  // New Course State
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseLang, setNewCourseLang] = useState<'en' | 'es' | 'pt'>('en');
  const [newCourseFlag, setNewCourseFlag] = useState("🇺🇸");
  const [newCourseDesc, setNewCourseDesc] = useState("");

  // New Lesson State
  const [newLessonId, setNewLessonId] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newLessonDesc, setNewLessonDesc] = useState("");

  // Mantido apenas para compatibilidade; o ID do módulo agora é gerado automaticamente.
  const [newModuleId, setNewModuleId] = useState("");
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newModuleDesc, setNewModuleDesc] = useState("");
  
  // Temp Questions being made for the new Lesson
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qPrompt, setQPrompt] = useState("");
  const [qType, setQType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [qOptions, setQOptions] = useState<string[]>(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState<string>("");
  const [qMascot, setQMascot] = useState("Lico");
  const [qHint, setQHint] = useState("");

  const [message, setMessage] = useState<string | null>(null);

  // Edit Existing Lesson (Fase) State
  const [editCourseId, setEditCourseId] = useState("");
  const [editModId, setEditModId] = useState("");
  const [editLessonId, setEditLessonId] = useState("");
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonDesc, setEditLessonDesc] = useState("");
  const [editQuestions, setEditQuestions] = useState<Question[]>([]);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [eqType, setEqType] = useState<QuestionType>(QuestionType.MULTIPLE_CHOICE);
  const [eqPrompt, setEqPrompt] = useState("");
  const [eqOptions, setEqOptions] = useState<string[]>(["", "", "", ""]);
  const [eqCorrect, setEqCorrect] = useState("");
  const [eqMascot, setEqMascot] = useState("Lico");
  const [eqHint, setEqHint] = useState("");

  // New Leaderboard Entry State
  const [leadId, setLeadId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadXp, setLeadXp] = useState(100);
  const [leadStreak, setLeadStreak] = useState(5);
  const [leadState, setLeadState] = useState("SP");
  const [leadCountry, setLeadCountry] = useState("🇧🇷 Brasil");
  const [leadAvatar, setLeadAvatar] = useState("🦊");

  // New Mascot State
  const [mascotId, setMascotId] = useState("");
  const [mascotName, setMascotName] = useState("");
  const [mascotImageUrl, setMascotImageUrl] = useState("");
  const [mascotRole, setMascotRole] = useState("");
  const [mascotDescription, setMascotDescription] = useState("");
  const [mascotTrait, setMascotTrait] = useState("");
  const [mascotQuote, setMascotQuote] = useState("");
  const [mascotStyleColor, setMascotStyleColor] = useState("from-blue-400 to-indigo-500");
  const [mascotEmoji, setMascotEmoji] = useState("🐾");

  // Learning Tip State
  const [tipId, setTipId] = useState("");
  const [tipText, setTipText] = useState("");
  const [tipMascotId, setTipMascotId] = useState("lico");

  // Achievement State
  const [achId, setAchId] = useState("");
  const [achTitle, setAchTitle] = useState("");
  const [achDesc, setAchDesc] = useState("");
  const [achEmoji, setAchEmoji] = useState("🏆");
  const [achXp, setAchXp] = useState(150);

  // AI Config State
  const [aiPrompt, setAiPrompt] = useState(aiTutorConfig?.prompt_template || "");
  const [aiDefaultTopic, setAiDefaultTopic] = useState(aiTutorConfig?.default_topic || "");

  // Interface Text State
  const [intKey, setIntKey] = useState("");
  const [intValue, setIntValue] = useState("");

  // User Management State
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<any | null>(null);

  // Push Notifications State
  const [pushTitle, setPushTitle] = useState("");
  const [pushBody, setPushBody] = useState("");
  const [pushFrequency, setPushFrequency] = useState<'daily' | 'weekly' | 'once'>('daily');
  const [pushType, setPushType] = useState<'ad' | 'reminder'>('reminder');
  const [pushTimesPerDay, setPushTimesPerDay] = useState<number>(1);
  const [pushTimesPerHour, setPushTimesPerHour] = useState<number>(0);
  const [pushScheduledTime, setPushScheduledTime] = useState<string>("09:00");
  const [pushNotifications, setPushNotifications] = useState<any[]>([]);
  const [loadingPush, setLoadingPush] = useState(false);

  // Excel Question Import State
  const [importMode, setImportMode] = useState<'new-lesson' | 'existing-lesson'>('new-lesson');
  const [importLessonId, setImportLessonId] = useState("");
  const [importLessonTitle, setImportLessonTitle] = useState("");
  const [importLessonDesc, setImportLessonDesc] = useState("");
  const [importLessonOrder, setImportLessonOrder] = useState<string>(""); // posição/ordem da fase (opcional)
  const [importSelectedLessonId, setImportSelectedLessonId] = useState("");
  const [importQuestionsPerFase, setImportQuestionsPerFase] = useState<string>("");
  // Limita quantas questões do arquivo serão usadas na operação atual.
  // Vazio = usar todas as questões válidas encontradas na planilha.
  const [importQuestionLimit, setImportQuestionLimit] = useState<string>("");
  const [importQtyFases, setImportQtyFases] = useState<string>(""); // alternativa a "questões por fase": quantas fases criar
  // Comportamento quando o ID da fase de destino já existe (nunca sobrescreve silenciosamente):
  //  - 'append'  : adiciona as novas questões ao final da fase existente (padrão, mais seguro)
  //  - 'replace' : substitui somente as questões dessa fase (mantém id/posição)
  //  - 'new-id'  : ignora colisão e cria uma fase nova com outro ID gerado automaticamente
  const [importCollisionBehavior, setImportCollisionBehavior] = useState<'append' | 'replace' | 'new-id'>('append');
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [parsedSheetRows, setParsedSheetRows] = useState<ParsedImportRow[]>([]); // somente conteúdo pedagógico; nunca segmentação
  const [validationErrors, setValidationErrors] = useState<{ line: number; error: string }[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const loadAdminCourses = async (options?: {
    preferredCourseId?: string;
    preferredModuleId?: string;
    keepCurrentSelection?: boolean;
  }) => {
    setLoadingAdminCourses(true);
    setAdminCoursesError(null);

    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, data')
        .order('id', { ascending: true });

      if (error) throw error;

      const realCourses: Course[] = (data || [])
        .map((row: any) => row?.data as Course)
        .filter((course: Course | null | undefined): course is Course =>
          Boolean(course?.id)
        )
        .map(course => ({
          ...course,
          modules: Array.isArray(course.modules) ? course.modules : []
        }));

      setAdminCourses(realCourses);

      const desiredCourseId =
        options?.preferredCourseId ||
        (options?.keepCurrentSelection ? activeCourseId : "") ||
        realCourses[0]?.id ||
        "";

      const selectedCourse =
        realCourses.find(course => course.id === desiredCourseId) ||
        realCourses[0];

      const desiredModuleId =
        options?.preferredModuleId ||
        (options?.keepCurrentSelection ? activeModId : "");

      const selectedModule =
        selectedCourse?.modules?.find(module => module.id === desiredModuleId) ||
        selectedCourse?.modules?.[0];

      setActiveCourseId(selectedCourse?.id || "");
      setActiveModId(selectedModule?.id || "");

      if (
        importSelectedLessonId &&
        !selectedModule?.lessons?.some(
          lesson => lesson.id === importSelectedLessonId
        )
      ) {
        setImportSelectedLessonId("");
      }

      return realCourses;
    } catch (error: any) {
      const message =
        error?.message || "Não foi possível carregar os cursos do Supabase.";
      console.error("Erro ao carregar dados reais do Admin:", error);
      setAdminCourses([]);
      setAdminCoursesError(message);
      return [];
    } finally {
      setLoadingAdminCourses(false);
    }
  };

  useEffect(() => {
    if (
      adminTab === 'courses' ||
      adminTab === 'edit-lesson' ||
      adminTab === 'import-questions'
    ) {
      void loadAdminCourses({ keepCurrentSelection: true });
    }
  }, [adminTab]);

  const downloadExcelTemplate = () => {
    const headers = [
      "modulo_id",
      "modulo_nome",
      "titulo_licao",
      "descricao_licao",
      "ordem_fase",
      "tipo_questao",
      "enunciado",
      "alternativa_a",
      "alternativa_b",
      "alternativa_c",
      "alternativa_d",
      "alternativa_e",
      "resposta_correta",
      "nivel_dificuldade",
      "categoria",
      "texto_dica",
      "palavras",
      "pares",
      "texto_frase",
      "traducao",
      "nome_mascote"
    ];

    const sampleRows = [
      // Multiple Choice
      [
        activeModId || "ingles_iniciante_mod_1",
        "Módulo Principal",
        "Saudações",
        "Aprenda a cumprimentar em inglês.",
        1,
        "multiple-choice",
        "Como se diz 'Bom dia' em inglês?",
        "Good morning",
        "Good afternoon",
        "Good night",
        "Goodbye",
        "",
        "Good morning",
        "Fácil",
        "Vocabulário",
        "A expressão correta para saudar alguém pela manhã é 'Good morning'.",
        "",
        "",
        "",
        "",
        "Lico"
      ],
      // Sentence Builder
      [
        activeModId || "ingles_iniciante_mod_1",
        "Módulo Principal",
        "Saudações",
        "Aprenda a cumprimentar em inglês.",
        1,
        "sentence-builder",
        "Monte a frase: 'Eu sou um menino'",
        "",
        "",
        "",
        "",
        "",
        "I | am | a | boy",
        "Fácil",
        "Gramática",
        "Monte a frase começando pelo sujeito 'I' (Eu)!",
        "boy | am | I | a | girl",
        "",
        "Eu sou um menino",
        "I am a boy",
        "Guga"
      ],
      // Match Pairs
      [
        activeModId || "ingles_iniciante_mod_1",
        "Módulo Principal",
        "Saudações",
        "Aprenda a cumprimentar em inglês.",
        1,
        "match-pairs",
        "Combine as traduções corretas:",
        "",
        "",
        "",
        "",
        "",
        "", // Resposta embutida nos pares
        "Médio",
        "Vocabulário",
        "Combine as palavras em português com suas traduções em inglês.",
        "",
        "Please=Por favor | Thank you=Obrigado | Goodbye=Adeus",
        "",
        "",
        "Teddy"
      ],
      // Speak Sim
      [
        activeModId || "ingles_iniciante_mod_1",
        "Módulo Principal",
        "Saudações",
        "Aprenda a cumprimentar em inglês.",
        1,
        "speak-sim",
        "Pronuncie em voz alta:",
        "",
        "",
        "",
        "",
        "",
        "nice to meet you",
        "Médio",
        "Pronúncia",
        "Fale devagar e de forma limpa! 'Náis tu mít iu'!",
        "",
        "",
        "Nice to meet you",
        "Prazer em te conhecer",
        "Pingo"
      ]
    ];

    const wsData = [headers, ...sampleRows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const wsInstructionsData = [
      ["Coluna", "Descrição / Regras", "Exemplo"],
      ["modulo_id", "ID do módulo correspondente no aplicativo.", activeModId || "ingles_iniciante_mod_1"],
      ["modulo_nome", "Nome legível do módulo para referência na planilha.", "Módulo Principal"],
      ["titulo_licao", "[Usado apenas no modo 'Usar módulos e fases da planilha'] Título da fase/lição. Linhas com o mesmo módulo + título + ordem_fase viram a mesma fase.", "Saudações"],
      ["descricao_licao", "[Usado apenas no modo 'Usar módulos e fases da planilha'] Descrição da fase/lição.", "Aprenda a cumprimentar em inglês."],
      ["ordem_fase", "[Usado apenas no modo 'Usar módulos e fases da planilha'] Número/ordem da fase dentro do módulo. Opcional nos demais modos.", 1],
      ["tipo_questao", "Deve ser exatamente: 'multiple-choice', 'sentence-builder', 'match-pairs' ou 'speak-sim'.", "sentence-builder"],
      ["enunciado", "O texto da pergunta ou comando que será exibido para o estudante.", "Como se diz 'Obrigado' em inglês?"],
      ["alternativa_a", "[Apenas para multiple-choice] Primeira opção de resposta.", "Good morning"],
      ["alternativa_b", "[Apenas para multiple-choice] Segunda opção de resposta.", "Good afternoon"],
      ["alternativa_c", "[Apenas para multiple-choice] Terceira opção de resposta.", "Good night"],
      ["alternativa_d", "[Apenas para multiple-choice] Quarta opção de resposta.", "Goodbye"],
      ["alternativa_e", "[Opcional, apenas para multiple-choice] Quinta opção de resposta.", ""],
      ["resposta_correta", "[Requerido em multiple-choice, sentence-builder, speak-sim] Resposta correta esperada.", "I | am | a | boy"],
      ["nivel_dificuldade", "Nível de dificuldade da questão (Fácil, Médio, Difícil).", "Fácil"],
      ["categoria", "[Opcional] Categoria/assunto da questão, se o sistema utilizar.", "Vocabulário"],
      ["texto_dica", "Explicação ou dica do mascote exibida ao errar ou pedir ajuda (antiga 'explicacao').", "A palavra 'Thank you' é a forma padrão de agradecer em inglês."],
      ["palavras", "[Apenas para sentence-builder] Opções de palavras embaralhadas separadas por ' | '.", "boy | am | I | a | girl"],
      ["pares", "[Apenas para match-pairs] Termos e correspondentes no formato 'termo1=corr1 | termo2=corr2'.", "Please=Por favor | Thank you=Obrigado"],
      ["texto_frase", "[Apenas para speak-sim / sentence-builder] Frase original (campo 'text').", "Nice to meet you"],
      ["traducao", "[Apenas para speak-sim / sentence-builder] Tradução da frase original (campo 'translation').", "Prazer em te conhecer"],
      ["nome_mascote", "Nome do mascote que dá a dica (Lico, Guga, Teddy, Pingo, Mia, Bia, Pip, Zeca).", "Lico"],
      [],
      ["REGRAS POR TIPO DE QUESTÃO:"],
      ["Tipo de Questão", "Colunas Requeridas", "Regra de Preenchimento / Formato"],
      ["multiple-choice", "alternativa_a, alternativa_b, resposta_correta", "resposta_correta deve ser idêntica a uma das alternativas (A-D)"],
      ["sentence-builder", "palavras, resposta_correta", "palavras separadas por ' | '. resposta_correta contém as palavras na ordem correta separadas por ' | '."],
      ["match-pairs", "pares", "pares no formato 'termo=correspondente | termo2=correspondente2'. resposta_correta pode ficar em branco."],
      ["speak-sim", "texto_frase, resposta_correta", "texto_frase é o texto que o aluno vê. resposta_correta é o texto que o aluno deve falar (em minúsculas)."],
      [],
      ["MODOS DE IMPORTAÇÃO:"],
      ["Adicionar a uma fase existente", "As questões são adicionadas ao final da fase escolhida. As demais fases do módulo não são alteradas."],
      ["Criar uma nova fase", "Cria 1 fase com título/descrição informados na tela. Se o ID já existir, a fase é atualizada (nunca as outras)."],
      ["Criar várias fases", "Divide as questões da planilha em N fases automaticamente (por quantidade de questões por fase, ou por quantidade de fases)."],
      ["Usar módulos e fases da planilha", "Ignora a seleção manual e usa as colunas modulo_id/titulo_licao/descricao_licao/ordem_fase de cada linha para agrupar e criar/atualizar módulos e fases."]
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(wsInstructionsData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questões");
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instruções");

    XLSX.writeFile(wb, "modelo_importacao_falla.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setImportFileName(file.name);
    setParsedQuestions([]);
    setParsedSheetRows([]);
    setValidationErrors([]);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        
        const rawRows = XLSX.utils.sheet_to_json<any>(sheet);
        
        if (rawRows.length === 0) {
          setValidationErrors([{ line: 1, error: "A planilha está vazia ou sem cabeçalhos válidos." }]);
          setIsUploading(false);
          return;
        }

        const questionsList: Question[] = [];
        const sheetRowsList: ParsedImportRow[] = [];
        const errorsList: { line: number; error: string }[] = [];

        rawRows.forEach((row, index) => {
          const lineNumber = index + 2;

          const getVal = (possibleKeys: string[]) => {
            for (const key of Object.keys(row)) {
              const cleanKey = key.trim().toLowerCase();
              if (possibleKeys.includes(cleanKey)) {
                return row[key]?.toString()?.trim() || "";
              }
            }
            return "";
          };

          const tituloLicao = getVal(["titulo_licao", "titulo_lição", "titulo da licao", "titulo_lesson", "lesson_title"]);
          const descricaoLicao = getVal(["descricao_licao", "descrição_lição", "descricao da licao", "descricao_lesson"]);
          const qTypeVal = getVal(["tipo_questao", "tipo questao", "tipo", "tipo_pergunta", "tipo_da_questao"]);
          const prompt = getVal(["enunciado", "enunciado_questao", "prompt", "pergunta"]);
          const altA = getVal(["alternativa_a", "alternativa a", "opcao_a", "opção a"]);
          const altB = getVal(["alternativa_b", "alternativa b", "opcao_b", "opção b"]);
          const altC = getVal(["alternativa_c", "alternativa c", "opcao_c", "opção c"]);
          const altD = getVal(["alternativa_d", "alternativa d", "opcao_d", "opção d"]);
          const altE = getVal(["alternativa_e", "alternativa e", "opcao_e", "opção e"]);
          const correctAnswer = getVal(["resposta_correta", "resposta correta", "correta", "resposta_certa", "resposta certa"]);
          const difficulty = getVal(["nivel_dificuldade", "nivel", "dificuldade", "nivel de dificuldade"]);
          const categoria = getVal(["categoria", "assunto", "tema"]);
          const explanation = getVal(["texto_dica", "texto dica", "explicacao", "explicação", "dica", "hint"]);
          
          const palabras = getVal(["palavras", "opcoes_palavras", "words"]);
          const pares = getVal(["pares", "match_pairs", "pairs"]);
          const textoFrase = getVal(["texto_frase", "frase", "text", "texto"]);
          const traducao = getVal(["traducao", "tradução", "translation"]);
          const nomeMascote = getVal(["nome_mascote", "mascote", "characterhint", "character_hint", "character"]);


          const rowErrors: string[] = [];

          const cleanType = qTypeVal.toLowerCase().replace(/_/g, '-').trim();
          let resolvedType: QuestionType | null = null;
          if (cleanType === "multiple-choice" || cleanType === "multiplechoice" || cleanType === "mult") {
            resolvedType = QuestionType.MULTIPLE_CHOICE;
          } else if (cleanType === "sentence-builder" || cleanType === "sentencebuilder" || cleanType === "sentence") {
            resolvedType = QuestionType.SENTENCE_BUILDER;
          } else if (cleanType === "match-pairs" || cleanType === "matchpairs" || cleanType === "match") {
            resolvedType = QuestionType.MATCH_PAIRS;
          } else if (cleanType === "speak-sim" || cleanType === "speaksim" || cleanType === "speak") {
            resolvedType = QuestionType.SPEAK_SIM;
          }

          if (!resolvedType) {
            rowErrors.push(`Tipo de questão inválido ou vazio: '${qTypeVal}'. Deve ser um de: 'multiple-choice', 'sentence-builder', 'match-pairs' ou 'speak-sim'.`);
          }

          let resolvedPrompt = prompt;
          if (!resolvedPrompt && resolvedType) {
            if (resolvedType === QuestionType.MULTIPLE_CHOICE) resolvedPrompt = "Selecione a resposta correta:";
            else if (resolvedType === QuestionType.SENTENCE_BUILDER) resolvedPrompt = "Ordene as palavras para formar a frase correspondente:";
            else if (resolvedType === QuestionType.MATCH_PAIRS) resolvedPrompt = "Combine as traduções corretas:";
            else if (resolvedType === QuestionType.SPEAK_SIM) resolvedPrompt = "Pronuncie em voz alta:";
            else resolvedPrompt = "Responda à questão:";
          }

          let parsedOptions: string[] | undefined = undefined;
          let parsedCorrectAnswer: string | string[] = "";

          if (resolvedType === QuestionType.MULTIPLE_CHOICE) {
            if (!altA || !altB) {
              rowErrors.push("Tipo 'multiple-choice' requer as alternativas 'alternativa_a' e 'alternativa_b' preenchidas.");
            }
            if (!correctAnswer) {
              rowErrors.push("Tipo 'multiple-choice' requer 'resposta_correta' preenchida.");
            } else {
              const options = [altA, altB, altC, altD, altE].filter(Boolean);
              const cleanOptionsLower = options.map(o => o.toLowerCase());
              if (!options.includes(correctAnswer) && !cleanOptionsLower.includes(correctAnswer.toLowerCase())) {
                rowErrors.push(`A resposta correta "${correctAnswer}" deve coincidir exatamente com uma das alternativas preenchidas (${options.join(", ")}).`);
              } else {
                const foundOpt = options.find(o => o.toLowerCase() === correctAnswer.toLowerCase());
                parsedCorrectAnswer = foundOpt || correctAnswer;
              }
              parsedOptions = options;
            }
          } 
          
          else if (resolvedType === QuestionType.SENTENCE_BUILDER) {
            if (!palabras) {
              rowErrors.push("Tipo 'sentence-builder' requer a coluna 'palavras' preenchida (palavras embaralhadas separadas por ' | ').");
            }
            if (!correctAnswer) {
              rowErrors.push("Tipo 'sentence-builder' requer a coluna 'resposta_correta' preenchida (palavras na ordem correta separadas por ' | ').");
            }

            if (palabras && correctAnswer) {
              const options = palabras.split("|").map(p => p.trim()).filter(Boolean);
              const correctWords = correctAnswer.split("|").map(p => p.trim()).filter(Boolean);

              if (options.length === 0) {
                rowErrors.push("A coluna 'palavras' não possui palavras válidas.");
              }
              if (correctWords.length === 0) {
                rowErrors.push("A coluna 'resposta_correta' não possui palavras válidas.");
              }

              const optionLowerSet = new Set(options.map(o => o.toLowerCase()));
              for (const word of correctWords) {
                if (!optionLowerSet.has(word.toLowerCase())) {
                  rowErrors.push(`A palavra '${word}' de 'resposta_correta' não existe na coluna 'palavras' (${options.join(", ")}).`);
                }
              }

              parsedOptions = options;
              parsedCorrectAnswer = correctWords;
            }
          } 
          
          else if (resolvedType === QuestionType.MATCH_PAIRS) {
            if (!pares) {
              rowErrors.push("Tipo 'match-pairs' requer a coluna 'pares' preenchida (no formato 'termo1=correspondente1 | termo2=correspondente2').");
            } else {
              const pairStrings = pares.split("|").map(p => p.trim()).filter(Boolean);
              if (pairStrings.length === 0) {
                rowErrors.push("A coluna 'pares' está vazia ou mal formatada.");
              } else {
                const options: string[] = [];
                const correctAnswerArr: string[] = [];
                
                for (const pairStr of pairStrings) {
                  const parts = pairStr.split("=").map(p => p.trim());
                  if (parts.length !== 2 || !parts[0] || !parts[1]) {
                    rowErrors.push(`Par inválido em 'pares': '${pairStr}'. Deve usar o formato 'termo=correspondente'.`);
                    continue;
                  }
                  options.push(parts[0], parts[1]);
                  correctAnswerArr.push(`${parts[0]}:${parts[1]}`);
                }

                parsedOptions = options;
                parsedCorrectAnswer = correctAnswerArr;
              }
            }
          } 
          
          else if (resolvedType === QuestionType.SPEAK_SIM) {
            if (!textoFrase) {
              rowErrors.push("Tipo 'speak-sim' requer a coluna 'texto_frase' preenchida.");
            }
            if (!correctAnswer) {
              rowErrors.push("Tipo 'speak-sim' requer a coluna 'resposta_correta' preenchida (frase esperada a ser falada).");
            }

            if (textoFrase && correctAnswer) {
              parsedCorrectAnswer = correctAnswer;
            }
          }

          if (rowErrors.length > 0) {
            errorsList.push({
              line: lineNumber,
              error: rowErrors.join(" | ")
            });
          } else if (resolvedType) {
            const question: Question = {
              id: `q_excel_${Date.now()}_${index}`,
              type: resolvedType,
              prompt: resolvedPrompt,
              text: textoFrase || undefined,
              translation: traducao || undefined,
              options: parsedOptions,
              correctAnswer: parsedCorrectAnswer,
              characterHint: nomeMascote || "Lico",
              hintText: explanation || `Essa é uma questão de nível ${difficulty || 'Geral'}.`
            };
            questionsList.push(question);
            sheetRowsList.push({
              line: lineNumber,
              tituloLicao,
              descricaoLicao,
              question
            });
          }
        });

        setParsedQuestions(questionsList);
        setParsedSheetRows(sheetRowsList);

        const firstValidRow = sheetRowsList[0];
        if (firstValidRow?.tituloLicao && !importLessonTitle.trim()) {
          setImportLessonTitle(firstValidRow.tituloLicao);
        }
        if (firstValidRow?.descricaoLicao && !importLessonDesc.trim()) {
          setImportLessonDesc(firstValidRow.descricaoLicao);
        }

        setValidationErrors(errorsList);
      } catch (err: any) {
        console.error(err);
        setValidationErrors([{ line: 0, error: "Falha ao ler o arquivo Excel: " + err.message }]);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Aplica o comportamento escolhido quando o ID de destino já existe como uma fase.
  // Nunca sobrescreve título/descrição/questões de outra fase sem que isso seja explicitamente pedido.
  const applyCollisionBehavior = (
    existingLessons: any[],
    targetId: string,
    newLesson: { id: string; title: string; description: string; xpReward: number; questions: Question[]; order?: number },
    behavior: 'append' | 'replace' | 'new-id'
  ): any[] => {
    const idx = existingLessons.findIndex(l => l.id === targetId);

    if (idx === -1) {
      // Não existe conflito: apenas adiciona a nova fase (imutável)
      return [...existingLessons, newLesson];
    }

    if (behavior === 'new-id') {
      // Evita a colisão criando um ID novo, garantindo que a fase existente não seja tocada
      const safeLesson = { ...newLesson, id: `${newLesson.id}_${Math.random().toString(36).slice(2, 6)}` };
      return [...existingLessons, safeLesson];
    }

    if (behavior === 'replace') {
      // Substitui somente as questões (e título/descrição) da fase que já existe com esse ID
      return existingLessons.map(l => (l.id === targetId ? { ...l, ...newLesson } : l));
    }

    // 'append' (padrão e mais seguro): mantém título/descrição/ordem já existentes e só acrescenta questões
    return existingLessons.map(l =>
      l.id === targetId
        ? { ...l, questions: [...(l.questions || []), ...newLesson.questions] }
        : l
    );
  };

  const handleConfirmExcelImport = async () => {
    if (!activeCourseId || !activeModId) {
      alert("Selecione um Curso e um Módulo.");
      return;
    }

    const totalQuestions = parsedQuestions.length;
    if (totalQuestions !== 10 && totalQuestions !== 100) {
      alert(
        `A planilha contém ${totalQuestions} questão(ões) válida(s). ` +
        "Esta importação aceita somente arquivos com exatamente 10 ou 100 questões."
      );
      return;
    }

    if (importMode === 'existing-lesson') {
      if (!importSelectedLessonId) {
        alert("Selecione uma fase existente.");
        return;
      }
      if (totalQuestions !== 10) {
        alert("Para adicionar questões a uma fase existente, importe exatamente 10 questões.");
        return;
      }
    } else if (!importLessonTitle.trim()) {
      alert("Preencha o Título da nova fase.");
      return;
    }

    setIsConfirming(true);

    try {
      const { data: row, error: fetchError } = await supabase
        .from('courses')
        .select('id, data')
        .eq('id', activeCourseId)
        .single();

      if (fetchError || !row?.data) {
        throw new Error(fetchError?.message || "Curso não encontrado no Supabase.");
      }

      const courseData: Course = JSON.parse(JSON.stringify(row.data));
      const modules = Array.isArray(courseData.modules) ? courseData.modules : [];

      // Fonte única de verdade: o módulo escolhido no painel.
      const targetModuleId = activeModId;

      if (!targetModuleId) {
        throw new Error("Selecione um módulo.");
      }

      const targetModuleIndex = modules.findIndex(
        module => module.id === targetModuleId
      );

      if (targetModuleIndex === -1) {
        const availableModules = modules
          .map(module => `${module.id} — ${module.title}`)
          .join("\n");

        throw new Error(
          "O módulo selecionado no painel não foi encontrado na versão atual do curso.\n\n" +
          `ID selecionado: ${targetModuleId}\n\n` +
          "Módulos realmente disponíveis no banco:\n" +
          (availableModules || "Nenhum módulo encontrado.")
        );
      }

      const targetModule = modules[targetModuleIndex];
      const realModuleId = targetModule.id;
      const existingLessons = Array.isArray(targetModule.lessons)
        ? targetModule.lessons
        : [];

      const lessonsBefore = existingLessons.length;
      const questionsBefore = existingLessons.reduce(
        (total, lesson) => total + (lesson.questions?.length || 0),
        0
      );

      let updatedLessons = [...existingLessons];
      let expectedLessonsAfter = lessonsBefore;
      const expectedQuestionsAfter = questionsBefore + totalQuestions;

      if (importMode === 'existing-lesson') {
        const existingLesson = existingLessons.find(
          lesson => lesson.id === importSelectedLessonId
        );

        if (!existingLesson) {
          throw new Error("A fase selecionada não foi encontrada dentro do módulo real.");
        }

        updatedLessons = existingLessons.map(lesson =>
          lesson.id === importSelectedLessonId
            ? {
                ...lesson,
                questions: [...(lesson.questions || []), ...parsedQuestions]
              }
            : lesson
        );
      } else {
        const questionGroups: Question[][] = [];
        for (let index = 0; index < parsedQuestions.length; index += 10) {
          questionGroups.push(parsedQuestions.slice(index, index + 10));
        }

        const baseId =
          importLessonId.trim() ||
          generateLessonId(importLessonTitle, realModuleId);

        const timestamp = Date.now();

        const highestOrder = existingLessons.reduce(
          (highest, lesson, index) => {
            const order =
              typeof (lesson as any).order === "number"
                ? (lesson as any).order
                : index + 1;
            return Math.max(highest, order);
          },
          0
        );

        const newLessons = questionGroups.map((group, index) => {
          const phaseNumber = highestOrder + index + 1;
          const hasMultiplePhases = questionGroups.length > 1;

          return {
            id: hasMultiplePhases
              ? `${baseId}_p${phaseNumber}_${timestamp}`
              : `${baseId}_${timestamp}`,
            title: hasMultiplePhases
              ? `${importLessonTitle.trim()} - Fase ${phaseNumber}`
              : importLessonTitle.trim(),
            description: importLessonDesc.trim(),
            xpReward: 20,
            questions: group,
            order: phaseNumber
          };
        });

        updatedLessons = [...existingLessons, ...newLessons];
        expectedLessonsAfter = lessonsBefore + questionGroups.length;
      }

      const updatedModules = modules.map((module, index) =>
        index === targetModuleIndex
          ? { ...module, lessons: updatedLessons }
          : module
      );

      const updatedCourse: Course = {
        ...courseData,
        modules: updatedModules
      };

      const { data: updatedRow, error: updateError } = await supabase
        .from('courses')
        .update({ data: updatedCourse })
        .eq('id', activeCourseId)
        .select('id, data')
        .single();

      if (updateError || !updatedRow?.data) {
        throw new Error(
          updateError?.message ||
          "O Supabase não confirmou a gravação das questões."
        );
      }

      const returnedModule = (updatedRow.data as Course).modules?.find(
        module => module.id === realModuleId
      );

      if (!returnedModule) {
        throw new Error("O módulo não apareceu no retorno da atualização.");
      }

      const returnedLessonCount = returnedModule.lessons?.length || 0;
      const returnedQuestionCount = (returnedModule.lessons || []).reduce(
        (total, lesson) => total + (lesson.questions?.length || 0),
        0
      );

      if (returnedLessonCount !== expectedLessonsAfter) {
        throw new Error(
          `A gravação não criou a quantidade esperada de fases. ` +
          `Esperado: ${expectedLessonsAfter}; encontrado: ${returnedLessonCount}.`
        );
      }

      if (returnedQuestionCount !== expectedQuestionsAfter) {
        throw new Error(
          `A gravação não vinculou todas as questões ao módulo. ` +
          `Esperado: ${expectedQuestionsAfter}; encontrado: ${returnedQuestionCount}.`
        );
      }

      const { data: verifyRow, error: verifyError } = await supabase
        .from('courses')
        .select('data')
        .eq('id', activeCourseId)
        .single();

      if (verifyError || !verifyRow?.data) {
        throw new Error(
          verifyError?.message || "Não foi possível verificar a importação."
        );
      }

      const verifiedModule = (verifyRow.data as Course).modules?.find(
        module => module.id === realModuleId
      );

      if (!verifiedModule) {
        throw new Error("A verificação final não encontrou o módulo.");
      }

      const verifiedLessonCount = verifiedModule.lessons?.length || 0;
      const verifiedQuestionCount = (verifiedModule.lessons || []).reduce(
        (total, lesson) => total + (lesson.questions?.length || 0),
        0
      );

      if (
        verifiedLessonCount !== expectedLessonsAfter ||
        verifiedQuestionCount !== expectedQuestionsAfter
      ) {
        throw new Error(
          "A verificação final detectou que as fases ou questões não permaneceram salvas."
        );
      }

      const createdPhases =
        importMode === 'existing-lesson' ? 0 : totalQuestions / 10;

      alert(
        importMode === 'existing-lesson'
          ? `Sucesso confirmado!\n\n10 questões adicionadas à fase selecionada.\nMódulo: ${targetModule.title}\nID real: ${realModuleId}`
          : `Sucesso confirmado!\n\n${createdPhases} fase(s) criada(s).\n${totalQuestions} questões vinculadas.\nMódulo: ${targetModule.title}\nID real: ${realModuleId}`
      );

      await Promise.resolve(onRefreshCourses());
      await loadAdminCourses({
        preferredCourseId: activeCourseId,
        preferredModuleId: realModuleId
      });

      setParsedQuestions([]);
      setParsedSheetRows([]);
      setValidationErrors([]);
      setImportFile(null);
      setImportFileName("");
      setImportLessonId("");
      setImportLessonTitle("");
      setImportLessonDesc("");
      setImportLessonOrder("");
      setImportQuestionsPerFase("");
      setImportQuestionLimit("");
      setImportQtyFases("");
      setImportSelectedLessonId("");
    } catch (err: any) {
      console.error("Erro na importação:", err);
      alert(
        "As questões NÃO foram vinculadas ao módulo.\n\n" +
        "Motivo: " + (err?.message || String(err))
      );
    } finally {
      setIsConfirming(false);
    }
  };

  const fetchDbUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDbUsers(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar usuários:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      
      if (selectedUserForDetail && selectedUserForDetail.id === userId) {
        setSelectedUserForDetail((prev: any) => prev ? { ...prev, role: newRole } : null);
      }
      
      setMessage("Cargo do usuário atualizado com sucesso!");
      fetchDbUsers();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao alterar cargo: " + err.message);
    }
  };

  const handleUpdateUserPlan = async (userId: string, plan: string, days?: number) => {
    try {
      const expiryDate = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() : null;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan,
          plan_expires_at: expiryDate
        })
        .eq('id', userId);
      if (error) throw error;

      if (selectedUserForDetail && selectedUserForDetail.id === userId) {
        setSelectedUserForDetail((prev: any) => prev ? { ...prev, plan, plan_expires_at: expiryDate } : null);
      }

      setMessage("Plano de assinatura do usuário atualizado!");
      fetchDbUsers();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao alterar plano: " + err.message);
    }
  };

  const fetchPushNotifications = async () => {
    setLoadingPush(true);
    try {
      const { data, error } = await supabase
        .from('push_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPushNotifications(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar notificações push:", err);
    } finally {
      setLoadingPush(false);
    }
  };

  const handleCreatePushNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pushTitle || !pushBody) {
      alert("Por favor, preencha o título e o corpo da notificação!");
      return;
    }
    try {
      const { error } = await supabase
        .from('push_notifications')
        .insert({
          title: pushTitle,
          body: pushBody,
          frequency: pushFrequency,
          type: pushType,
          times_per_day: pushTimesPerDay,
          times_per_hour: pushTimesPerHour,
          scheduled_time: pushScheduledTime
        });
      
      if (error) {
        // If there's a missing column error on the client's DB, fallback gracefully and show warning
        const errMsg = error.message || "";
        if (errMsg.includes("times_per_day") || errMsg.includes("column") || errMsg.includes("does not exist")) {
          console.warn("Colunas de agendamento não encontradas. Tentando inserção compatível de fallback.", error);
          const { error: fallbackErr } = await supabase
            .from('push_notifications')
            .insert({
              title: pushTitle,
              body: pushBody,
              frequency: pushFrequency,
              type: pushType
            });
          
          if (fallbackErr) throw fallbackErr;
          
          alert("Sucesso! A notificação foi enviada. No entanto, para usar as configurações avançadas de agendamento (vezes por dia/hora, horário), execute o script SQL atualizado na aba 'Blueprint SQL' para adicionar as colunas necessárias na tabela!");
        } else {
          throw error;
        }
      } else {
        setMessage("Notificação Push agendada e enviada com sucesso!");
      }
      
      setPushTitle("");
      setPushBody("");
      // reset specific fields to default if desired
      fetchPushNotifications();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao criar notificação push: " + err.message);
    }
  };

  const handleDeletePushNotification = async (id: string) => {
    if (!confirm("Excluir esta configuração de notificação?")) return;
    try {
      const { error } = await supabase
        .from('push_notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setMessage("Configuração excluída com sucesso!");
      fetchPushNotifications();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  useEffect(() => {
    if (adminTab === 'users') {
      fetchDbUsers();
    } else if (adminTab === 'push') {
      fetchPushNotifications();
    }
  }, [adminTab]);

  // Populate AI config on load/refresh
  useEffect(() => {
    if (aiTutorConfig) {
      setAiPrompt(aiTutorConfig.prompt_template);
      setAiDefaultTopic(aiTutorConfig.default_topic);
    }
  }, [aiTutorConfig]);

  const handleCreateLeaderboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !leadName) {
      alert("Preencha o ID e o Nome do competidor.");
      return;
    }

    try {
      const { error } = await supabase
        .from('leaderboard')
        .upsert({
          id: leadId,
          name: leadName,
          xp: Number(leadXp),
          streak: Number(leadStreak),
          state: leadState,
          country: leadCountry,
          avatar: leadAvatar
        });

      if (error) throw error;

      setMessage(`Estudante "${leadName}" cadastrado com sucesso no Leaderboard!`);
      setLeadId("");
      setLeadName("");
      setLeadXp(100);
      setLeadStreak(5);
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar estudante no ranking do Supabase: " + (e.message || e));
    }
  };

  const handleDeleteLeaderboard = async (id: string) => {
    if (!confirm(`Excluir competidor "${id}"?`)) return;
    try {
      const { error } = await supabase.from('leaderboard').delete().eq('id', id);
      if (error) throw error;
      setMessage("Competidor excluído com sucesso!");
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  const handleCreateMascot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mascotId || !mascotName) {
      alert("Preencha o ID e o Nome do mascote.");
      return;
    }

    const newMascot: Mascot = {
      id: mascotId,
      name: mascotName,
      trait: mascotTrait || mascotDescription || mascotRole || "Novo mascote incrível!",
      role: mascotRole || "Mascote Falla",
      quote: mascotQuote || "Estou super pronto para novos desafios!",
      avatarUrl: mascotImageUrl || undefined,
      styleColor: mascotStyleColor || "from-blue-400 to-indigo-500",
      emoji: mascotEmoji || "🐾"
    };

    try {
      const { error } = await supabase
        .from('mascots')
        .upsert({
          id: mascotId,
          name: mascotName,
          image_url: mascotImageUrl || null,
          role: mascotRole,
          description: mascotDescription || mascotTrait,
          trait: mascotTrait || mascotDescription,
          quote: mascotQuote,
          style_color: mascotStyleColor,
          emoji: mascotEmoji
        });

      if (error) {
        console.warn("Aviso ao salvar no Supabase:", error.message);
      }
    } catch (err: any) {
      console.warn("Erro ao salvar no Supabase:", err);
    }

    onAddCustomMascot(newMascot);
    setMessage(`Mascote "${mascotName}" cadastrado com sucesso!`);
    setMascotId("");
    setMascotName("");
    setMascotImageUrl("");
    setMascotRole("");
    setMascotDescription("");
    setMascotTrait("");
    setMascotQuote("");
    setTimeout(() => setMessage(null), 4000);
  };

  const handleDeleteMascot = async (id: string) => {
    if (!confirm(`Excluir mascote "${id}"?`)) return;
    try {
      const { error } = await supabase.from('mascots').delete().eq('id', id);
      if (error) {
        console.warn("Aviso ao excluir do Supabase:", error.message);
      }
    } catch (e: any) {
      console.warn("Erro ao excluir do Supabase:", e);
    }

    onDeleteCustomMascot(id);
    setMessage("Mascote removido com sucesso!");
    setTimeout(() => setMessage(null), 4000);
  };

  const selectedCourse = adminCourses.find(c => c.id === activeCourseId);
  const modules = selectedCourse?.modules || [];

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseId || !newCourseName) {
      alert("Preencha o ID e Nome do curso.");
      return;
    }

    const coursePayload = {
      id: newCourseId,
      name: newCourseName,
      language: newCourseLang,
      flag: newCourseFlag,
      description: newCourseDesc,
      modules: [
        {
          id: `${newCourseId}_mod_1`,
          title: "Módulo Principal",
          description: "Primeiros passos no aprendizado.",
          lessons: []
        }
      ]
    };

    try {
      const { error } = await supabase
        .from('courses')
        .upsert({ id: newCourseId, data: coursePayload });

      if (error) throw error;

      setMessage("Curso cadastrado com sucesso! Veja as alterações no menu superior.");
      onRefreshCourses();
      setActiveCourseId(newCourseId);
      setNewCourseId("");
      setNewCourseName("");
      setNewCourseDesc("");
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar curso no Supabase: " + (e.message || e));
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm(`Deseja excluir permanentemente o curso "${courseId}"?`)) return;
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId);
      if (error) throw error;
      setMessage("Curso excluído com sucesso!");
      onRefreshCourses();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      alert("Erro ao excluir curso: " + e.message);
    }
  };

  const addQuestionToTempList = () => {
    if (!qPrompt || !qCorrect) {
      alert("Por favor, preencha o enunciado e a resposta correta.");
      return;
    }

    const correctAns = qType === QuestionType.SENTENCE_BUILDER 
      ? qCorrect.split(',').map(s => s.trim()) 
      : qCorrect.trim();

    const filteredOptions = qOptions.filter(o => o.trim() !== "");

    const newQ: Question = {
      id: `q_${Date.now()}`,
      type: qType,
      prompt: qPrompt,
      options: filteredOptions.length > 0 ? filteredOptions : undefined,
      correctAnswer: correctAns,
      characterHint: qMascot,
      hintText: qHint
    };

    setQuestions([...questions, newQ]);
    setQPrompt("");
    setQCorrect("");
    setQOptions(["", "", "", ""]);
    setQHint("");
  };

  const generateLessonId = (title: string, modPrefix?: string): string => {
    const slug = (title || 'licao')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'licao';
    const prefix = modPrefix ? `${modPrefix}_` : '';
    const suffix = Math.random().toString(36).slice(2, 6);
    return `${prefix}${slug}_${suffix}`;
  };

  const updateEqOption = (index: number, val: string) => {
    const updated = [...eqOptions];
    updated[index] = val;
    setEqOptions(updated);
  };

  const addQuestionToEditList = () => {
    if (!eqPrompt || !eqCorrect) {
      alert("Preencha a pergunta e a resposta correta.");
      return;
    }
    const correctAns = eqType === QuestionType.SENTENCE_BUILDER
      ? eqCorrect.split(',').map(s => s.trim())
      : eqCorrect;

    const newQ: Question = {
      id: `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: eqType,
      prompt: eqPrompt,
      options: eqOptions.filter(o => o.trim() !== ""),
      correctAnswer: correctAns as any,
      characterHint: eqMascot,
      hintText: eqHint
    };

    setEditQuestions([...editQuestions, newQ]);
    setEqPrompt("");
    setEqOptions(["", "", "", ""]);
    setEqCorrect("");
    setEqHint("");
  };

  const handleLoadLessonForEdit = async (courseId: string, modId: string, lessonId: string) => {
    if (!courseId || !modId || !lessonId) return;
    setEditLoading(true);
    try {
      const { data: row, error } = await supabase
        .from('courses')
        .select('data')
        .eq('id', courseId)
        .single();

      if (error || !row) throw new Error(error?.message || "Curso não encontrado no Supabase.");

      const courseData = row.data as Course;
      const mod = courseData.modules?.find(m => m.id === modId);
      const lesson = mod?.lessons?.find(l => l.id === lessonId);

      if (!lesson) {
        throw new Error("Fase não encontrada no banco de dados.");
      }

      setEditLessonTitle(lesson.title);
      setEditLessonDesc(lesson.description || "");
      setEditQuestions(lesson.questions || []);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao carregar a fase: " + (e.message || e));
      setEditQuestions([]);
      setEditLessonTitle("");
      setEditLessonDesc("");
    } finally {
      setEditLoading(false);
    }
  };


  // Abre a fase escolhida no editor, preservando o curso e o módulo de origem.
  const handleOpenLessonEditor = async (
    courseId: string,
    modId: string,
    lessonId: string
  ) => {
    setEditCourseId(courseId);
    setEditModId(modId);
    setEditLessonId(lessonId);
    setEditLessonTitle("");
    setEditLessonDesc("");
    setEditQuestions([]);
    setAdminTab('edit-lesson');

    await handleLoadLessonForEdit(courseId, modId, lessonId);

    // Leva o administrador ao início do formulário de edição.
    window.setTimeout(() => {
      document
        .getElementById('falla-edit-lesson-form')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleSaveEditedLesson = async () => {
    if (!editCourseId || !editModId || !editLessonId) {
      alert("Selecione Curso, Módulo e Fase.");
      return;
    }
    if (editQuestions.length === 0) {
      alert("A fase precisa ter pelo menos 1 questão. Adicione questões ou exclua a fase pelo SQL se quiser removê-la.");
      return;
    }

    setEditSaving(true);
    try {
      const { data: row, error: fetchError } = await supabase
        .from('courses')
        .select('data')
        .eq('id', editCourseId)
        .single();

      if (fetchError || !row) throw new Error(fetchError?.message || "Curso não encontrado no Supabase.");

      const courseData = row.data as Course;
      const mod = courseData.modules?.find(m => m.id === editModId);
      if (!mod) throw new Error("Módulo não encontrado no curso.");

      const lessonIdx = mod.lessons?.findIndex(l => l.id === editLessonId) ?? -1;
      if (lessonIdx === -1 || !mod.lessons) throw new Error("Fase não encontrada no módulo.");

      mod.lessons[lessonIdx] = {
        ...mod.lessons[lessonIdx],
        title: editLessonTitle,
        description: editLessonDesc,
        questions: editQuestions
      };

      const { error: updateError } = await supabase
        .from('courses')
        .update({ data: courseData })
        .eq('id', editCourseId);

      if (updateError) throw updateError;

      setMessage(`Fase "${editLessonTitle}" atualizada com sucesso! (${editQuestions.length} questões)`);
      onRefreshCourses();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar alterações: " + (e.message || e));
    } finally {
      setEditSaving(false);
    }
  };


  /**
   * Gera automaticamente um ID legível e único para o módulo.
   *
   * Exemplos:
   * - Curso em inglês + título "Módulo 3 - Viagens" => en_mod_3
   * - Sem número no título => usa o próximo número disponível.
   * - Em caso de colisão inesperada => adiciona um sufixo curto.
   */
  const generateUniqueModuleId = (
    courseData: Course,
    moduleTitle: string
  ): string => {
    const languagePrefix =
      courseData.language ||
      courseData.id.split('_')[0] ||
      'course';

    const existingIds = new Set(
      (courseData.modules || []).map(module => module.id)
    );

    // Prioriza o número informado no título: "Módulo 3", "Modulo 3", etc.
    const titleNumberMatch = moduleTitle.match(/m[oó]dulo\s*(\d+)/i);
    let moduleNumber = titleNumberMatch
      ? Number(titleNumberMatch[1])
      : 0;

    // Se o título não tiver número, encontra o próximo número disponível.
    if (!moduleNumber || moduleNumber < 1) {
      const usedNumbers = (courseData.modules || [])
        .map(module => {
          const idMatch = module.id.match(/_mod_(\d+)/i);
          if (idMatch) return Number(idMatch[1]);

          const titleMatch = module.title.match(/m[oó]dulo\s*(\d+)/i);
          return titleMatch ? Number(titleMatch[1]) : 0;
        })
        .filter(number => Number.isFinite(number) && number > 0);

      moduleNumber = Math.max(0, ...usedNumbers) + 1;
    }

    let generatedId = `${languagePrefix}_mod_${moduleNumber}`;

    // Evita duplicidade mesmo quando o número escolhido já estiver em uso.
    if (existingIds.has(generatedId)) {
      const shortSuffix =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID().split('-')[0]
          : `${Date.now()}`.slice(-8);

      generatedId = `${generatedId}_${shortSuffix}`;
    }

    return generatedId;
  };

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeCourseId) {
      alert("Selecione um Curso.");
      return;
    }

    const normalizedTitle = newModuleTitle.trim();
    const normalizedDescription = newModuleDesc.trim();

    if (!normalizedTitle) {
      alert("Preencha o Título do módulo.");
      return;
    }

    try {
      setMessage("Salvando o novo módulo no banco de dados...");

      // 1. Busca a versão mais recente diretamente do Supabase.
      // Não usamos a lista da interface porque ela também pode conter módulos
      // provisórios adicionados pelo App.tsx, que ainda não existem no banco.
      const { data: row, error: fetchError } = await supabase
        .from('courses')
        .select('id, data')
        .eq('id', activeCourseId)
        .single();

      if (fetchError || !row?.data) {
        throw new Error(
          fetchError?.message ||
          "Curso não encontrado no Supabase."
        );
      }

      const currentCourse = row.data as Course;
      const existingModules = Array.isArray(currentCourse.modules)
        ? currentCourse.modules
        : [];

      // 2. Gera o ID usando apenas os módulos que realmente estão no banco.
      const generatedModuleId = generateUniqueModuleId(
        { ...currentCourse, modules: existingModules },
        normalizedTitle
      );

      // Proteção adicional contra duplicidade de título.
      const duplicatedTitle = existingModules.some(
        module =>
          module.title.trim().toLocaleLowerCase('pt-BR') ===
          normalizedTitle.toLocaleLowerCase('pt-BR')
      );

      if (duplicatedTitle) {
        throw new Error(
          `Já existe um módulo com o título "${normalizedTitle}" no banco.`
        );
      }

      const newModule = {
        id: generatedModuleId,
        title: normalizedTitle,
        description: normalizedDescription,
        lessons: []
      };

      // 3. Atualização imutável: mantém exatamente todos os módulos,
      // fases e questões existentes e acrescenta somente o novo módulo.
      const updatedCourse: Course = {
        ...currentCourse,
        modules: [...existingModules, newModule]
      };

      // 4. Salva e exige o retorno da linha alterada.
      // Se a política RLS impedir a atualização ou nenhuma linha for afetada,
      // o Supabase retornará erro em vez de mostrar um sucesso falso.
      const { data: updatedRow, error: updateError } = await supabase
        .from('courses')
        .update({ data: updatedCourse })
        .eq('id', activeCourseId)
        .select('id, data')
        .single();

      if (updateError || !updatedRow?.data) {
        throw new Error(
          updateError?.message ||
          "O Supabase não confirmou a atualização do curso."
        );
      }

      // 5. Confirma no retorno imediato que o módulo foi persistido.
      const returnedCourse = updatedRow.data as Course;
      const returnedModule = returnedCourse.modules?.find(
        module => module.id === generatedModuleId
      );

      if (!returnedModule) {
        throw new Error(
          "O banco respondeu à atualização, mas o novo módulo não apareceu no JSON salvo."
        );
      }

      // 6. Faz uma segunda leitura independente para confirmar a persistência.
      const { data: verifyRow, error: verifyError } = await supabase
        .from('courses')
        .select('data')
        .eq('id', activeCourseId)
        .single();

      if (verifyError || !verifyRow?.data) {
        throw new Error(
          verifyError?.message ||
          "Não foi possível verificar o módulo após a gravação."
        );
      }

      const verifiedCourse = verifyRow.data as Course;
      const verifiedModule = verifiedCourse.modules?.find(
        module => module.id === generatedModuleId
      );

      if (!verifiedModule) {
        throw new Error(
          "A verificação final não encontrou o novo módulo no banco. Nenhuma mensagem de sucesso foi exibida."
        );
      }

      // Garante que nenhum módulo ou fase anterior desapareceu.
      if ((verifiedCourse.modules?.length || 0) < existingModules.length + 1) {
        throw new Error(
          "A verificação detectou perda de módulos. A operação foi interrompida."
        );
      }

      for (const oldModule of existingModules) {
        const savedOldModule = verifiedCourse.modules?.find(
          module => module.id === oldModule.id
        );

        if (!savedOldModule) {
          throw new Error(
            `A verificação detectou que o módulo "${oldModule.title}" desapareceu.`
          );
        }

        if (
          (savedOldModule.lessons?.length || 0) <
          (oldModule.lessons?.length || 0)
        ) {
          throw new Error(
            `A verificação detectou perda de fases no módulo "${oldModule.title}".`
          );
        }
      }

      await Promise.resolve(onRefreshCourses());
      await loadAdminCourses({
        preferredCourseId: activeCourseId,
        preferredModuleId: generatedModuleId
      });

      setActiveModId(generatedModuleId);
      setNewModuleId("");
      setNewModuleTitle("");
      setNewModuleDesc("");
      setMessage(
        `Módulo criado e confirmado no Supabase! ID: ${generatedModuleId}`
      );

      alert(
        `Módulo criado com sucesso!\n\n` +
        `Título: ${normalizedTitle}\n` +
        `ID: ${generatedModuleId}\n\n` +
        `A gravação foi confirmada no Supabase.`
      );

      setTimeout(() => setMessage(null), 6000);
    } catch (e: any) {
      console.error("Erro ao criar módulo:", e);
      setMessage(null);
      alert(
        "O módulo NÃO foi criado no banco de dados.\n\n" +
        "Motivo: " + (e?.message || String(e))
      );
    }
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourseId || !activeModId) {
      alert("Selecione um Curso e um Módulo.");
      return;
    }
    if (!newLessonId || !newLessonTitle) {
      alert("Preencha o ID e o Título da lição.");
      return;
    }
    if (questions.length === 0) {
      alert("Adicione pelo menos 1 questão à lição.");
      return;
    }

    try {
      const { data: row, error: fetchError } = await supabase
        .from('courses')
        .select('data')
        .eq('id', activeCourseId)
        .single();

      if (fetchError || !row) {
        throw new Error(fetchError?.message || "Curso não encontrado no Supabase.");
      }

      const courseData = row.data as Course;
      if (!courseData) throw new Error("Estrutura do curso está vazia.");

      const mod = courseData.modules?.find(m => m.id === activeModId);
      if (!mod) {
        throw new Error("Módulo não encontrado no curso.");
      }

      const newLesson = {
        id: newLessonId,
        title: newLessonTitle,
        description: newLessonDesc,
        xpReward: 20,
        questions
      };

      if (!mod.lessons) {
        mod.lessons = [];
      }

      const lessonIdx = mod.lessons.findIndex(l => l.id === newLessonId);
      if (lessonIdx !== -1) {
        mod.lessons[lessonIdx] = newLesson;
      } else {
        mod.lessons.push(newLesson);
      }

      const { error: updateError } = await supabase
        .from('courses')
        .update({ data: courseData })
        .eq('id', activeCourseId);

      if (updateError) throw updateError;

      setMessage("Nova lição criada com sucesso! Carregada instantaneamente no aplicativo.");
      onRefreshCourses();
      setNewLessonId("");
      setNewLessonTitle("");
      setNewLessonDesc("");
      setQuestions([]);
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      console.error(e);
      alert("Erro ao salvar lição no Supabase: " + (e.message || e));
    }
  };

  const updateOption = (index: number, val: string) => {
    const updated = [...qOptions];
    updated[index] = val;
    setQOptions(updated);
  };

  // Learning Tip Handlers
  const handleSaveTip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tipId || !tipText) {
      alert("Preencha o ID e o Texto da dica.");
      return;
    }
    try {
      const { error } = await supabase
        .from('learning_tips')
        .upsert({ id: tipId, tip: tipText, mascot_id: tipMascotId });
      if (error) throw error;
      setMessage(`Dica "${tipId}" salva com sucesso!`);
      setTipId("");
      setTipText("");
      onRefreshTips();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar dica: " + err.message);
    }
  };

  const handleDeleteTip = async (id: string) => {
    if (!confirm("Excluir esta dica de aprendizado?")) return;
    try {
      const { error } = await supabase.from('learning_tips').delete().eq('id', id);
      if (error) throw error;
      setMessage("Dica de aprendizado excluída com sucesso!");
      onRefreshTips();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  // Achievement Handlers
  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!achId || !achTitle) {
      alert("Preencha o ID e o Título da conquista.");
      return;
    }
    try {
      const { error } = await supabase
        .from('achievements')
        .upsert({ 
          id: achId, 
          title: achTitle, 
          description: achDesc, 
          emoji: achEmoji, 
          xp_required: Number(achXp) 
        });
      if (error) throw error;
      setMessage(`Conquista "${achTitle}" salva com sucesso!`);
      setAchId("");
      setAchTitle("");
      setAchDesc("");
      onRefreshAchievements();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar conquista: " + err.message);
    }
  };

  const handleDeleteAchievement = async (id: string) => {
    if (!confirm("Excluir esta conquista?")) return;
    try {
      const { error } = await supabase.from('achievements').delete().eq('id', id);
      if (error) throw error;
      setMessage("Conquista excluída com sucesso!");
      onRefreshAchievements();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao excluir conquista: " + err.message);
    }
  };

  // AI Config Handler
  const handleSaveAiConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('ai_tutor_config')
        .upsert({ 
          id: 'main_config', 
          prompt_template: aiPrompt, 
          default_topic: aiDefaultTopic 
        });
      if (error) throw error;
      setMessage("Configuração do Tutor de IA salva com sucesso!");
      onRefreshAiTutorConfig();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar prompt da IA: " + err.message);
    }
  };

  // Interface Text Handlers
  const handleSaveInterfaceText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intKey || !intValue) {
      alert("Preencha a Chave e o Valor do texto de interface.");
      return;
    }
    try {
      const { error } = await supabase
        .from('interface_texts')
        .upsert({ key: intKey, value: intValue });
      if (error) throw error;
      setMessage(`Texto de interface "${intKey}" atualizado!`);
      setIntKey("");
      setIntValue("");
      onRefreshInterfaceTexts();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao salvar texto: " + err.message);
    }
  };

  const handleDeleteInterfaceText = async (key: string) => {
    if (!confirm(`Excluir chave de texto "${key}"?`)) return;
    try {
      const { error } = await supabase.from('interface_texts').delete().eq('key', key);
      if (error) throw error;
      setMessage("Texto excluído com sucesso!");
      onRefreshInterfaceTexts();
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      alert("Erro ao excluir: " + err.message);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xs space-y-6">
      
      {/* Admin Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            ⚙️ Painel Multi-Controle Central FALLA
          </h2>
          <p className="text-[10px] text-slate-400 font-extrabold mt-0.5 uppercase tracking-wide">
            Administração Completa de Conteúdos, IA e Configurações em Tempo Real
          </p>
        </div>
        <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-200 uppercase self-start">
          Admin Ativo
        </span>
      </div>

      {/* Admin Tab Selectors */}
      <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        {[
          { id: 'courses', label: 'Cursos & Lições', icon: BookOpen },
          { id: 'mascots', label: 'Mascotes', icon: Smile },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'tips', label: 'Dicas de Estudo', icon: HelpCircle },
          { id: 'achievements', label: 'Conquistas', icon: Sparkles },
          { id: 'ai-tutor', label: 'Config Tutor IA', icon: Terminal },
          { id: 'interface', label: 'Textos de Interface', icon: MessageSquare },
          { id: 'banners', label: 'Banners de Perfil', icon: Palette },
          { id: 'users', label: 'Gerenciar Usuários', icon: Users },
          { id: 'push', label: 'Notificações Push', icon: Bell },
          { id: 'import-questions', label: 'Importar Questões', icon: FileSpreadsheet },
          { id: 'edit-lesson', label: 'Editar Fases', icon: Eye },
          { id: 'sql-blueprint', label: 'Blueprint SQL', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = adminTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-tight transition-all cursor-pointer ${
                isActive 
                  ? 'bg-white text-slate-800 shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <Icon size={12} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-800 rounded-2xl p-4 text-xs font-black flex items-center gap-2">
          <Check size={16} className="text-falla-green" /> {message}
        </div>
      )}

      {/* ----------------- SUB-TAB: COURSES ----------------- */}
      {adminTab === 'courses' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          
          {/* New Course Form */}
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs flex items-center justify-between border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <span className="flex items-center gap-1.5">
                <BookOpen size={14} className="text-falla-blue" />
                Criar Novo Curso de Idiomas
              </span>
            </h3>
            
            <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único do Curso</label>
                  <input
                    type="text"
                    placeholder="Ex: fr_basic"
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Nome do Curso</label>
                  <input
                    type="text"
                    placeholder="Ex: Francês Descomplicado"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Idioma de Destino</label>
                  <select
                    value={newCourseLang}
                    onChange={(e: any) => {
                      setNewCourseLang(e.target.value);
                      setNewCourseFlag(e.target.value === 'en' ? '🇺🇸' : e.target.value === 'es' ? '🇪🇸' : '🇧🇷');
                    }}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="en">Inglês (en)</option>
                    <option value="es">Espanhol (es)</option>
                    <option value="pt">Português (pt)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Bandeira Emoji</label>
                  <input
                    type="text"
                    value={newCourseFlag}
                    onChange={(e) => setNewCourseFlag(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-center text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Descrição</label>
                <textarea
                  placeholder="Descrição amigável sobre o curso..."
                  value={newCourseDesc}
                  onChange={(e) => setNewCourseDesc(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700 h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl shadow-sm border-b-4 border-b-sky-600 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer"
              >
                <Plus size={14} /> Salvar Curso no Banco
              </button>
            </form>

            {/* Courses list with Delete */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Cursos no Banco</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {adminCourses.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold">
                    <span>{c.flag} <strong>{c.name}</strong> ({c.id})</span>
                    <button 
                      onClick={() => handleDeleteCourse(c.id)}
                      className="text-falla-red hover:text-red-700 cursor-pointer"
                      title="Excluir curso"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* New Module Form */}
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <Layers size={14} className="text-falla-blue" />
              Criar Novo Módulo
            </h3>

            <form onSubmit={handleCreateModule} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Selecione o Curso</label>
                <select
                  value={activeCourseId}
                  onChange={(e) => setActiveCourseId(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                >
                  <option value="">Selecione...</option>
                  {adminCourses.map(c => (
                    <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">
                    ID Único do Módulo
                  </label>
                  <div className="w-full min-h-[38px] bg-emerald-50 border-2 border-emerald-200 rounded-xl px-3 py-2 flex items-center text-[10px] font-black text-emerald-700">
                    Gerado automaticamente ao salvar
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold mt-1">
                    Exemplo: “Módulo 3” será salvo como “en_mod_3”.
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Título do Módulo</label>
                  <input
                    type="text"
                    placeholder="Ex: Módulo 3 - Viagens"
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Descrição do Módulo</label>
                <textarea
                  placeholder="Descrição amigável sobre o módulo..."
                  value={newModuleDesc}
                  onChange={(e) => setNewModuleDesc(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700 h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl shadow-sm border-b-4 border-b-sky-600 active:translate-y-0.5 active:border-b-0 transition-all flex items-center justify-center gap-1.5 uppercase tracking-wide cursor-pointer"
              >
                <Plus size={14} /> Salvar Módulo no Banco
              </button>
            </form>
          </div>

          {/* New Lesson Form */}
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <Layers size={14} className="text-falla-green" />
              Adicionar Nova Lição Interativa
            </h3>

            <form onSubmit={handleCreateLesson} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Selecione o Curso</label>
                  <select
                    value={activeCourseId}
                    onChange={(e) => {
                      setActiveCourseId(e.target.value);
                      const sel = adminCourses.find(c => c.id === e.target.value);
                      if (sel && sel.modules[0]) {
                        setActiveModId(sel.modules[0].id);
                      }
                    }}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="">Selecione...</option>
                    {adminCourses.map(c => (
                      <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Módulo Interno</label>
                  <select
                    value={activeModId}
                    onChange={(e) => {
                        setActiveModId(e.target.value);
                        setImportSelectedLessonId("");
                      }}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="">Selecione...</option>
                    {modules.map(m => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-t-2 border-slate-200 pt-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único da Lição</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Ex: en_les_viagem"
                      value={newLessonId}
                      onChange={(e) => setNewLessonId(e.target.value)}
                      className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setNewLessonId(generateLessonId(newLessonTitle, activeModId))}
                      title="Gerar ID automaticamente"
                      className="shrink-0 bg-falla-blue/10 hover:bg-falla-blue/20 text-falla-blue rounded-xl px-2.5 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Wand2 size={14} />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Título da Lição</label>
                  <input
                    type="text"
                    placeholder="Ex: No Aeroporto"
                    value={newLessonTitle}
                    onChange={(e) => setNewLessonTitle(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-slate-700"
                  />
                </div>
              </div>

              {/* Questions creator widget */}
              <div className="border-2 border-slate-200 bg-white p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-[10px] text-slate-700 uppercase tracking-wide">Add Questão ({questions.length} salvas)</span>
                  <span className="text-[9px] bg-falla-blue/10 text-falla-blue font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Questão Atual</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Estilo Exercício</label>
                    <select
                      value={qType}
                      onChange={(e: any) => setQType(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1 font-black text-slate-700"
                    >
                      <option value={QuestionType.MULTIPLE_CHOICE}>Múltipla Escolha</option>
                      <option value={QuestionType.SENTENCE_BUILDER}>Quebra-Cabeça</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mascote Dica</label>
                    <select
                      value={qMascot}
                      onChange={(e) => setQMascot(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1 font-black text-slate-700"
                    >
                      <option value="Lico">Lico (Livro)</option>
                      <option value="Teddy">Teddy (Urso)</option>
                      <option value="Bia">Bia (Menina)</option>
                      <option value="Luna">Luna (Coruja)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Pergunta</label>
                  <input
                    type="text"
                    placeholder="Como se diz 'Cachorro'?"
                    value={qPrompt}
                    onChange={(e) => setQPrompt(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 font-bold text-slate-700"
                  />
                </div>

                {qType === QuestionType.MULTIPLE_CHOICE ? (
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold text-slate-500">Opções do Aluno</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {qOptions.map((opt, idx) => (
                        <input
                          key={idx}
                          type="text"
                          placeholder={`Opção ${idx + 1}`}
                          value={opt}
                          onChange={(e) => updateOption(idx, e.target.value)}
                          className="bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 text-center font-bold text-slate-700"
                        />
                      ))}
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Resposta Correta Exata</label>
                      <input
                        type="text"
                        placeholder="Ex: Dog"
                        value={qCorrect}
                        onChange={(e) => setQCorrect(e.target.value)}
                        className="w-full bg-falla-blue/10 border border-falla-blue/30 rounded-xl p-1.5 font-black text-falla-blue"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Palavras Avulsas (vírgula)</label>
                      <input
                        type="text"
                        placeholder="Ex: I, am, a, dog, cat"
                        value={qOptions.join(', ')}
                        onChange={(e) => setQOptions(e.target.value.split(',').map(s => s.trim()))}
                        className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 font-bold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Resposta Correta Ordenada</label>
                      <input
                        type="text"
                        placeholder="Ex: I, am, a, dog"
                        value={qCorrect}
                        onChange={(e) => setQCorrect(e.target.value)}
                        className="w-full bg-falla-blue/10 border border-falla-blue/30 rounded-xl p-1.5 font-black text-falla-blue"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-0.5">Mensagem do Mascote</label>
                  <input
                    type="text"
                    placeholder="Dica para a criança..."
                    value={qHint}
                    onChange={(e) => setQHint(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-1.5 font-bold text-slate-700"
                  />
                </div>

                <button
                  type="button"
                  onClick={addQuestionToTempList}
                  className="w-full bg-falla-pink hover:bg-falla-pink/90 text-white font-black py-1.5 rounded-xl text-[9px] cursor-pointer uppercase tracking-wider"
                >
                  + Validar e Adicionar Questão
                </button>
              </div>

              {questions.length > 0 && (
                <div className="space-y-1 bg-white border-2 border-slate-200 rounded-xl p-2.5 max-h-24 overflow-y-auto">
                  {questions.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[9px] font-bold text-slate-600 bg-slate-50 p-1 rounded border border-slate-150">
                      <span>{idx + 1}. {q.prompt} ({q.type})</span>
                      <button type="button" onClick={() => setQuestions(questions.filter((_, i) => i !== idx))} className="text-falla-red hover:text-red-700">
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="submit"
                disabled={questions.length === 0}
                className={`w-full font-black py-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 uppercase text-xs ${
                  questions.length === 0 
                    ? 'bg-slate-250 text-slate-400 cursor-not-allowed' 
                    : 'bg-falla-green hover:bg-falla-green/90 text-white border-b-4 border-b-green-700 active:translate-y-0.5'
                }`}
              >
                <Save size={14} /> Salvar Lição Completa
              </button>
            </form>
          </div>

        </div>
      )}

      {/* ----------------- SUB-TAB: MASCOTS ----------------- */}
      {adminTab === 'mascots' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <span>🦁</span> Criar ou Atualizar Mascote
            </h3>
            <form onSubmit={handleCreateMascot} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único</label>
                  <input
                    type="text"
                    placeholder="Ex: lico"
                    value={mascotId}
                    onChange={(e) => setMascotId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: Lico (O Livro Tagarela)"
                    value={mascotName}
                    onChange={(e) => setMascotName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Papel / Função</label>
                  <input
                    type="text"
                    placeholder="Ex: Guia Principal"
                    value={mascotRole}
                    onChange={(e) => setMascotRole(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Emoji</label>
                  <input
                    type="text"
                    placeholder="Ex: 📖"
                    value={mascotEmoji}
                    onChange={(e) => setMascotEmoji(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Cores do Estilo (Tailwind)</label>
                  <input
                    type="text"
                    placeholder="Ex: from-blue-400 to-indigo-500"
                    value={mascotStyleColor}
                    onChange={(e) => setMascotStyleColor(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Imagem do Mascote (URL ou Carregar Arquivo)</label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      placeholder="Ex: lico_mascot_123.jpg ou Base64"
                      value={mascotImageUrl}
                      onChange={(e) => setMascotImageUrl(e.target.value)}
                      className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-[11px]"
                    />
                    <div className="flex items-center gap-2">
                      <label className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold py-1.5 px-3 rounded-xl text-[10px] text-center cursor-pointer transition-all border border-slate-300 inline-block">
                        <span>📁 Carregar do Dispositivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                if (typeof reader.result === 'string') {
                                  setMascotImageUrl(reader.result);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      {mascotImageUrl && (
                        <div className="flex items-center gap-1">
                          <div className="w-6 h-6 rounded-md overflow-hidden border border-slate-300 bg-slate-100 shrink-0">
                            <img src={mascotImageUrl} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setMascotImageUrl("")}
                            className="bg-red-50 hover:bg-red-100 text-red-600 font-extrabold py-1.5 px-2.5 rounded-xl text-[10px] border border-red-200 transition-all"
                          >
                            Limpar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Traço Marcante</label>
                  <input
                    type="text"
                    placeholder="Ex: Sábio, curioso..."
                    value={mascotTrait}
                    onChange={(e) => setMascotTrait(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Descrição</label>
                  <input
                    type="text"
                    placeholder="Ex: Detalhes do mascote..."
                    value={mascotDescription}
                    onChange={(e) => setMascotDescription(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Frase Marcante</label>
                <textarea
                  placeholder="Cada página lida é um novo mundo descoberto!..."
                  value={mascotQuote}
                  onChange={(e) => setMascotQuote(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-12"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl shadow-sm border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer flex items-center justify-center gap-1 uppercase"
              >
                <Plus size={14} /> Salvar Mascote no Banco
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Mascotes Cadastrados (Clique para carregar/editar)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {mascots.map(m => (
                <div 
                  key={m.id} 
                  className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 text-[10px] font-black hover:bg-sky-50/50 cursor-pointer transition-all"
                  onClick={() => {
                    setMascotId(m.id);
                    setMascotName(m.name);
                    setMascotEmoji(m.emoji || "🐾");
                    setMascotStyleColor(m.styleColor || "from-blue-400 to-indigo-500");
                    setMascotImageUrl(m.avatarUrl || "");
                    setMascotRole(m.role || "");
                    setMascotDescription(m.trait || "");
                    setMascotTrait(m.trait || "");
                    setMascotQuote(m.quote || "");
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="text-lg">{m.emoji || "🐾"}</span>
                    <span>{m.name} ({m.id})</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMascot(m.id);
                    }}
                    className="text-falla-red hover:text-red-700 p-1 hover:bg-red-50 rounded cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: LEADERBOARD ----------------- */}
      {adminTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <Trophy size={14} className="text-falla-yellow inline-block mr-1" /> Criar/Atualizar Competidor no Ranking
            </h3>
            <form onSubmit={handleCreateLeaderboard} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único do Estudante</label>
                  <input
                    type="text"
                    placeholder="Ex: student_99"
                    value={leadId}
                    onChange={(e) => setTipId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Nome</label>
                  <input
                    type="text"
                    placeholder="Ex: Davi"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">XP Total</label>
                  <input
                    type="number"
                    value={leadXp}
                    onChange={(e) => setLeadXp(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Streak (Dias)</label>
                  <input
                    type="number"
                    value={leadStreak}
                    onChange={(e) => setLeadStreak(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Estado</label>
                  <input
                    type="text"
                    placeholder="Ex: SP"
                    value={leadState}
                    onChange={(e) => setLeadState(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">País</label>
                  <input
                    type="text"
                    placeholder="Ex: 🇧🇷 Brasil"
                    value={leadCountry}
                    onChange={(e) => setLeadCountry(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Avatar Emoji</label>
                  <input
                    type="text"
                    placeholder="Ex: 🦊"
                    value={leadAvatar}
                    onChange={(e) => setLeadAvatar(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-falla-green hover:bg-falla-green/90 text-white font-black py-2 rounded-xl shadow-sm border-b-4 border-b-green-700 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Trophy size={14} /> Salvar Competidor
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Competidores Cadastrados no Banco
            </h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">A classificação é carregada dinamicamente pelo app no widget da liga!</p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {[
                { id: "lead_1", name: "Davi", xp: 1240, avatar: "🦊" },
                { id: "lead_2", name: "Alice", xp: 1100, avatar: "🐼" },
                { id: "lead_3", name: "Gabriel", xp: 950, avatar: "🐸" },
                { id: "lead_4", name: "Lucas", xp: 870, avatar: "🐯" }
              ].map(entry => (
                <div key={entry.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-[10px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <span>{entry.avatar}</span>
                    <span><strong>{entry.name}</strong> - {entry.xp} XP</span>
                  </span>
                  <button 
                    onClick={() => handleDeleteLeaderboard(entry.id)}
                    className="text-falla-red hover:text-red-700 cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: TIPS ----------------- */}
      {adminTab === 'tips' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <HelpCircle size={14} className="text-falla-blue inline-block mr-1" /> Criar ou Atualizar Dica de Aprendizado
            </h3>
            
            <form onSubmit={handleSaveTip} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único da Dica</label>
                  <input
                    type="text"
                    placeholder="Ex: tip_neuro"
                    value={tipId}
                    onChange={(e) => setTipId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Mascote Conselheiro</label>
                  <select
                    value={tipMascotId}
                    onChange={(e) => setTipMascotId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-black text-slate-700"
                  >
                    <option value="lico">Lico (O Livro)</option>
                    <option value="teddy">Teddy (O Urso)</option>
                    <option value="luna">Luna (A Coruja)</option>
                    <option value="pingo">Pingo (O Pinguim)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Texto da Dica didática</label>
                <textarea
                  placeholder="Sabia que o cérebro das crianças absorve fonemas mais rápido?..."
                  value={tipText}
                  onChange={(e) => setTipText(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Salvar Dica no Banco
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Dicas Cadastradas ({learningTips.length})
            </h4>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {learningTips.map(t => (
                <div key={t.id} className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-semibold space-y-1">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="font-black text-falla-blue uppercase tracking-wide">Dica: {t.id} (Mascote: {t.mascot_id})</span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          setTipId(t.id);
                          setTipText(t.tip);
                          setTipMascotId(t.mascot_id || 'lico');
                        }}
                        className="text-falla-blue hover:text-sky-800 font-bold"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteTip(t.id)}
                        className="text-falla-red hover:text-red-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-medium">{t.tip}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: ACHIEVEMENTS ----------------- */}
      {adminTab === 'achievements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <Sparkles size={14} className="text-falla-yellow inline-block mr-1" /> Criar/Atualizar Conquista (Achievement)
            </h3>
            
            <form onSubmit={handleSaveAchievement} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">ID Único da Conquista</label>
                  <input
                    type="text"
                    placeholder="Ex: ach_pioneiro"
                    value={achId}
                    onChange={(e) => setAchId(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Emoji</label>
                  <input
                    type="text"
                    placeholder="Ex: 🌱"
                    value={achEmoji}
                    onChange={(e) => setAchEmoji(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Título</label>
                  <input
                    type="text"
                    placeholder="Ex: Primeiro Passo"
                    value={achTitle}
                    onChange={(e) => setAchTitle(e.target.value)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">XP Necessário para Liberar</label>
                  <input
                    type="number"
                    value={achXp}
                    onChange={(e) => setAchXp(Number(e.target.value))}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Descrição</label>
                <textarea
                  placeholder="Ex: Alcance 150 XP para provar seu empenho inicial..."
                  value={achDesc}
                  onChange={(e) => setAchDesc(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-16"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Salvar Conquista no Banco
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Conquistas Cadastradas ({achievements.length})
            </h4>
            <div className="space-y-1.5 max-h-[350px] overflow-y-auto">
              {achievements.map(ach => (
                <div key={ach.id} className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-semibold flex items-start gap-2.5">
                  <span className="text-xl p-1.5 bg-slate-50 rounded-lg">{ach.emoji}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-800">{ach.title} ({ach.id})</span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => {
                            setAchId(ach.id);
                            setAchTitle(ach.title);
                            setAchDesc(ach.description);
                            setAchEmoji(ach.emoji);
                            setAchXp(ach.xp_required);
                          }}
                          className="text-falla-blue hover:text-sky-800"
                        >
                          Editar
                        </button>
                        <button onClick={() => handleDeleteAchievement(ach.id)} className="text-falla-red hover:text-red-700">
                          Excluir
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-500 mt-0.5 font-medium">{ach.description}</p>
                    <span className="text-[8px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black uppercase mt-1 inline-block">Requisito: {ach.xp_required} XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: AI TUTOR CONFIG ----------------- */}
      {adminTab === 'ai-tutor' && (
        <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4 animate-fade-in max-w-3xl mx-auto">
          <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
            <Terminal size={14} className="text-falla-blue inline-block mr-1" /> Ajustar Mecanismo e Prompt do Tutor de IA
          </h3>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            Configure as diretrizes gerais que guiam a criação de lições pela inteligência artificial. O prompt será encaminhado dinamicamente para o modelo do Gemini, assegurando comportamento estrito sem alterar um único arquivo de código.
          </p>

          <form onSubmit={handleSaveAiConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">Tema Padrão Inicial</label>
              <input
                type="text"
                placeholder="Ex: Pedindo uma pizza"
                value={aiDefaultTopic}
                onChange={(e) => setAiDefaultTopic(e.target.value)}
                className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-600 mb-1">Prompt de Instrução Estrito (System Instruction)</label>
              <textarea
                placeholder="Insira as diretrizes para a IA..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full bg-white border-2 border-slate-250 rounded-xl p-2.5 font-bold h-36 font-mono text-[9px] leading-relaxed text-slate-700"
              />
              <span className="text-[8px] text-slate-400 font-bold block mt-1 uppercase tracking-wide">
                Dica: Use as tags {"{topic}"} e {"{language}"} para que a IA saiba onde injetar as escolhas dinâmicas do aluno!
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2.5 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1.5"
            >
              <Save size={14} /> Salvar Instruções da IA no Banco
            </button>
          </form>
        </div>
      )}

      {/* ----------------- SUB-TAB: INTERFACE TEXTS ----------------- */}
      {adminTab === 'interface' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              <MessageSquare size={14} className="text-falla-blue inline-block mr-1" /> Cadastrar / Editar Textos de Interface
            </h3>
            
            <form onSubmit={handleSaveInterfaceText} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Chave da Interface (Chave Única)</label>
                <input
                  type="text"
                  placeholder="Ex: app_badge ou app_footer"
                  value={intKey}
                  onChange={(e) => setIntKey(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Valor / Conteúdo textual</label>
                <textarea
                  placeholder="Digite o texto que deve substituir a versão estática do app..."
                  value={intValue}
                  onChange={(e) => setIntValue(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-24"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1"
              >
                <Plus size={14} /> Atualizar Texto da Interface
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Chaves Personalizadas no Banco
            </h4>
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {Object.entries(interfaceTexts).map(([key, value]) => (
                <div key={key} className="p-2.5 bg-white rounded-xl border border-slate-200 text-[10px] font-semibold">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1">
                    <span className="font-black text-falla-green">Chave: <strong>{key}</strong></span>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          setIntKey(key);
                          setIntValue(value);
                        }}
                        className="text-falla-blue hover:text-sky-800 font-bold"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteInterfaceText(key)}
                        className="text-falla-red hover:text-red-700"
                      >
                        Apagar
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-500 font-bold italic">"{value}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: USER MANAGEMENT ----------------- */}
      {adminTab === 'users' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Users size={14} className="text-falla-blue" />
              Gerenciamento Geral de Usuários ({dbUsers.length})
            </h3>
            <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
              Visualize os perfis cadastrados no Supabase Auth/Profiles, mude o cargo para Administrador ou Usuário Comum, e gerencie planos de assinatura PRO ativos com data de expiração.
            </p>

            {loadingUsers ? (
              <div className="text-center py-6">
                <div className="w-6 h-6 border-2 border-falla-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span className="text-[10px] font-black text-slate-400">CARREGANDO BASE DE USUÁRIOS...</span>
              </div>
            ) : dbUsers.length === 0 ? (
              <div className="text-center py-6 bg-white border border-slate-200 rounded-xl">
                <p className="text-[10px] text-slate-400 font-bold">Nenhum perfil de usuário encontrado no banco de dados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Users List */}
                <div className="md:col-span-1 space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {dbUsers.map(user => {
                    const isUserAdmin = user.role === 'admin';
                    const isUserPro = user.plan === 'pro' || user.plan === 'premium';
                    return (
                      <div 
                        key={user.id}
                        onClick={() => setSelectedUserForDetail(user)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all text-[11px] flex items-center justify-between gap-2 ${
                          selectedUserForDetail?.id === user.id 
                            ? 'bg-slate-100 border-falla-blue' 
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-black text-slate-800 truncate">{user.username || 'Sem Nome'}</p>
                          <p className="text-[9px] text-slate-400 truncate">{user.email || user.id}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isUserAdmin ? 'bg-falla-red/10 text-falla-red border border-falla-red/20' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {user.role}
                          </span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            isUserPro ? 'bg-falla-green/10 text-falla-green border border-falla-green/20' : 'bg-slate-100 text-slate-400'
                          }`}>
                            {isUserPro ? 'PRO' : 'FREE'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* User Detail View */}
                <div className="md:col-span-2 bg-white rounded-2xl border-2 border-slate-200 p-5 space-y-4">
                  {selectedUserForDetail ? (
                    <div className="space-y-4">
                      <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
                        <span className="text-3xl p-2 bg-slate-50 rounded-xl border border-slate-200">👤</span>
                        <div>
                          <h4 className="font-black text-slate-800 text-sm">{selectedUserForDetail.username || 'Usuário Sem Nome'}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">ID: {selectedUserForDetail.id}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <p className="text-slate-400 uppercase text-[8px] font-black">Cargo Atual</p>
                          <p className="text-slate-800 font-black text-xs uppercase mt-0.5">{selectedUserForDetail.role || 'user'}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <p className="text-slate-400 uppercase text-[8px] font-black">Plano Ativo</p>
                          <p className="text-slate-800 font-black text-xs uppercase mt-0.5">
                            {selectedUserForDetail.plan === 'pro' || selectedUserForDetail.plan === 'premium' ? '👑 PRO' : 'FREE'}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <p className="text-slate-400 uppercase text-[8px] font-black">Dias de Assinatura Restantes</p>
                          <p className="text-slate-800 font-black text-xs mt-0.5">
                            {(() => {
                              if (selectedUserForDetail.plan !== 'pro' && selectedUserForDetail.plan !== 'premium') return 'N/A (Free)';
                              const expiry = selectedUserForDetail.plan_expires_at;
                              if (!expiry) return 'Ilimitado 👑';
                              const diffTime = new Date(expiry).getTime() - Date.now();
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return diffDays > 0 ? `${diffDays} Dias` : 'Expirado';
                            })()}
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <p className="text-slate-400 uppercase text-[8px] font-black">Data de Expiração</p>
                          <p className="text-slate-800 font-black text-xs mt-0.5">
                            {selectedUserForDetail.plan_expires_at 
                              ? new Date(selectedUserForDetail.plan_expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'N/A'
                            }
                          </p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <p className="text-slate-400 uppercase text-[8px] font-black">Progresso & XP</p>
                          <p className="text-slate-800 font-black text-xs mt-0.5">{selectedUserForDetail.xp || 0} XP • Nível {selectedUserForDetail.level || 1}</p>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                          <p className="text-slate-400 uppercase text-[8px] font-black">Ofensiva & Vidas</p>
                          <p className="text-slate-800 font-black text-xs mt-0.5">{selectedUserForDetail.streak || 0} Dias • {selectedUserForDetail.lives || 5}/5 ❤️</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide">Ações Administrativas</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {selectedUserForDetail.role === 'admin' ? (
                            <button
                              onClick={() => handleUpdateUserRole(selectedUserForDetail.id, 'user')}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer uppercase border-b-2 border-slate-400 active:translate-y-0.5"
                            >
                              Tornar Usuário Comum
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateUserRole(selectedUserForDetail.id, 'admin')}
                              className="bg-falla-red hover:bg-red-600 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer uppercase border-b-2 border-red-800 active:translate-y-0.5"
                            >
                              Promover a Administrador
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateUserPlan(selectedUserForDetail.id, 'pro', 30)}
                            className="bg-falla-green hover:bg-green-600 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer uppercase border-b-2 border-green-800 active:translate-y-0.5"
                          >
                            Ativar PRO (30 Dias)
                          </button>

                          <button
                            onClick={() => handleUpdateUserPlan(selectedUserForDetail.id, 'pro', 365)}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer uppercase border-b-2 border-amber-800 active:translate-y-0.5"
                          >
                            Ativar PRO (1 Ano)
                          </button>

                          {(selectedUserForDetail.plan === 'pro' || selectedUserForDetail.plan === 'premium') && (
                            <button
                              onClick={() => handleUpdateUserPlan(selectedUserForDetail.id, 'free')}
                              className="bg-slate-500 hover:bg-slate-600 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer uppercase border-b-2 border-slate-700 active:translate-y-0.5"
                            >
                              Cancelar PRO (Voltar para Free)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <span className="text-4xl">👈</span>
                      <p className="text-xs font-black">Selecione um usuário na lista para visualizar o perfil e gerenciar cargo / assinatura.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: PUSH NOTIFICATIONS ----------------- */}
      {adminTab === 'push' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <h3 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide flex items-center gap-1.5">
              <Bell size={14} className="text-falla-blue animate-bounce" />
              Criar Configuração de Notificação Push
            </h3>
            
            <form onSubmit={handleCreatePushNotification} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Título do Push / Assunto</label>
                <input
                  type="text"
                  placeholder="Ex: Hora de treinar inglês!"
                  value={pushTitle}
                  onChange={(e) => setPushTitle(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1">Corpo da Mensagem (Conteúdo)</label>
                <textarea
                  placeholder="Ex: Seu mascote Chico está te esperando para a lição de hoje! Ganhe moedas em dobro."
                  value={pushBody}
                  onChange={(e) => setPushBody(e.target.value)}
                  className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Frequência de Envio</label>
                  <select
                    value={pushFrequency}
                    onChange={(e) => setPushFrequency(e.target.value as any)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  >
                    <option value="once">Enviar Apenas Uma Vez</option>
                    <option value="daily">Diariamente (Lembrete)</option>
                    <option value="weekly">Semanalmente (Novidades)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-600 mb-1">Objetivo / Tipo</label>
                  <select
                    value={pushType}
                    onChange={(e) => setPushType(e.target.value as any)}
                    className="w-full bg-white border-2 border-slate-250 rounded-xl p-2 font-bold"
                  >
                    <option value="reminder">Lembrete de Ofensiva / Engajamento</option>
                    <option value="ad">Propaganda / Novas Vantagens</option>
                  </select>
                </div>
              </div>

              {/* Advanced Scheduling & Repeat Configuration */}
              <div className="bg-slate-100 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                <span className="font-black text-[10px] text-falla-blue uppercase tracking-wider block">📅 Configuração de Agendamento Dinâmico</span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[9px] font-black text-slate-600 mb-1">Quantas vezes por dia</label>
                    <select
                      value={pushTimesPerDay}
                      onChange={(e) => setPushTimesPerDay(Number(e.target.value))}
                      className="w-full bg-white border-2 border-slate-250 rounded-xl p-1.5 font-bold text-[11px]"
                    >
                      <option value={0}>Desativado</option>
                      <option value={1}>1 vez por dia</option>
                      <option value={2}>2 vezes por dia</option>
                      <option value={3}>3 vezes por dia</option>
                      <option value={4}>4 vezes por dia</option>
                      <option value={5}>5 vezes por dia</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-black text-slate-600 mb-1">Quantas vezes por hora</label>
                    <select
                      value={pushTimesPerHour}
                      onChange={(e) => setPushTimesPerHour(Number(e.target.value))}
                      className="w-full bg-white border-2 border-slate-250 rounded-xl p-1.5 font-bold text-[11px]"
                    >
                      <option value={0}>Desativado</option>
                      <option value={1}>1 vez por hora</option>
                      <option value={2}>2 vezes por hora</option>
                      <option value={3}>3 vezes por hora</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-600 mb-1">Horário de Envio</label>
                    <input
                      type="time"
                      value={pushScheduledTime}
                      onChange={(e) => setPushScheduledTime(e.target.value)}
                      className="w-full bg-white border-2 border-slate-250 rounded-xl p-1.5 font-bold text-[11px]"
                    />
                  </div>
                </div>
                <p className="text-[8px] text-slate-500 font-bold leading-relaxed">
                  * Agende notificações de forma flexível. O sistema utilizará os parâmetros de hora ou dia para calibrar a frequência dos lembretes automáticos na área de trabalho dos alunos.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-falla-blue hover:bg-falla-blue/90 text-white font-black py-2.5 rounded-xl border-b-4 border-b-sky-600 active:translate-y-0.5 cursor-pointer uppercase flex items-center justify-center gap-1.5 animate-pulse"
              >
                <Plus size={14} /> Salvar e Enviar Push Notification
              </button>
            </form>
          </div>

          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h4 className="font-black text-slate-800 text-xs border-b-2 border-slate-200 pb-2 uppercase tracking-wide">
              Campanhas Configuradas ({pushNotifications.length})
            </h4>
            
            {loadingPush ? (
              <div className="text-center py-6">
                <div className="w-5 h-5 border-2 border-falla-blue border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : pushNotifications.length === 0 ? (
              <p className="text-[10px] text-slate-400 font-bold italic py-4 text-center">Nenhuma campanha de push cadastrada ainda.</p>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto">
                {pushNotifications.map(item => (
                  <div key={item.id} className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-semibold">
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-1.5 mb-1.5">
                      <div>
                        <span className="font-black text-slate-800 block text-xs">{item.title}</span>
                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase mt-1 inline-block">
                          {item.type === 'ad' ? 'Propaganda 📢' : 'Lembrete ⏰'} • {item.frequency}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleDeletePushNotification(item.id)}
                        className="text-falla-red hover:text-red-700 p-1 rounded hover:bg-slate-50 shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="text-slate-500 mt-0.5 font-medium leading-relaxed italic mb-1.5">"{item.body}"</p>
                    
                    {/* Advanced Scheduling Parameters Info */}
                    <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100/70">
                      {item.times_per_day > 0 && (
                        <span className="bg-sky-50 text-sky-700 px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase border border-sky-100">
                          📅 {item.times_per_day}x por Dia
                        </span>
                      )}
                      {item.times_per_hour > 0 && (
                        <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase border border-amber-100">
                          ⏱️ {item.times_per_hour}x por Hora
                        </span>
                      )}
                      {item.scheduled_time && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md text-[8px] font-extrabold uppercase border border-purple-100">
                          🔔 Horário: {item.scheduled_time}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}


      {/* ----------------- SUB-TAB: EDIT EXISTING LESSONS ----------------- */}
      {adminTab === 'edit-lesson' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4">
            <div className="border-b-2 border-slate-200 pb-3">
              <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-wide">
                <Eye size={16} className="text-falla-blue" />
                Editar fases por módulo
              </h3>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                Escolha primeiro o curso e o módulo. A lista mostrará somente as fases pertencentes ao módulo selecionado.
              </p>
            </div>

            {/* Segmentação: curso e módulo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase">
                  Curso
                </label>
                <select
                  value={editCourseId}
                  onChange={(e) => {
                    const courseId = e.target.value;
                    const selectedCourse = adminCourses.find(c => c.id === courseId);
                    const firstModuleId = selectedCourse?.modules?.[0]?.id || "";

                    setEditCourseId(courseId);
                    setEditModId(firstModuleId);
                    setEditLessonId("");
                    setEditLessonTitle("");
                    setEditLessonDesc("");
                    setEditQuestions([]);
                  }}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-700"
                >
                  <option value="">Selecione um curso...</option>
                  {adminCourses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.flag} {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase">
                  Módulo
                </label>
                <select
                  value={editModId}
                  disabled={!editCourseId}
                  onChange={(e) => {
                    setEditModId(e.target.value);
                    setEditLessonId("");
                    setEditLessonTitle("");
                    setEditLessonDesc("");
                    setEditQuestions([]);
                  }}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-700 disabled:opacity-50"
                >
                  <option value="">Selecione um módulo...</option>
                  {(adminCourses.find(c => c.id === editCourseId)?.modules || []).map(mod => (
                    <option key={mod.id} value={mod.id}>
                      {mod.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista filtrada: somente as fases do módulo escolhido */}
            {editCourseId && editModId && (() => {
              const selectedCourse = adminCourses.find(c => c.id === editCourseId);
              const selectedModule = selectedCourse?.modules?.find(m => m.id === editModId);
              const moduleLessons = selectedModule?.lessons || [];

              return (
                <div className="space-y-3">
                  <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                      Módulo selecionado
                    </p>
                    <h4 className="text-sm font-black text-indigo-900 mt-0.5">
                      {selectedModule?.title}
                    </h4>
                    <p className="text-[10px] text-indigo-700 font-bold mt-1">
                      {moduleLessons.length} fase(s) encontrada(s)
                    </p>
                  </div>

                  {moduleLessons.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center">
                      <p className="text-xs font-black text-slate-500">
                        Este módulo ainda não possui fases.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {moduleLessons.map((lesson, lessonIndex) => (
                        <div
                          key={lesson.id}
                          className={`bg-white border-2 rounded-2xl p-4 transition-all ${
                            editLessonId === lesson.id
                              ? 'border-falla-blue shadow-md'
                              : 'border-slate-200 hover:border-falla-blue/50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="inline-flex bg-slate-100 text-slate-500 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                                Fase {(lesson as any).order || lessonIndex + 1}
                              </span>
                              <h5 className="text-xs font-black text-slate-800 mt-2 break-words">
                                {lesson.title}
                              </h5>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">
                                {(lesson.questions || []).length} questão(ões)
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenLessonEditor(editCourseId, editModId, lesson.id)
                              }
                              className="shrink-0 bg-falla-blue hover:bg-sky-500 text-white text-[9px] font-black px-3 py-2 rounded-xl border-b-4 border-b-sky-700 active:translate-y-0.5 active:border-b-0 cursor-pointer uppercase transition-all"
                            >
                              Editar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Formulário da fase escolhida */}
          {editLessonId && (
            <div
              id="falla-edit-lesson-form"
              className="bg-white rounded-3xl border-2 border-falla-blue/40 p-5 md:p-6 space-y-5 shadow-sm scroll-mt-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-100 pb-3">
                <div>
                  <p className="text-[9px] text-falla-blue font-black uppercase tracking-widest">
                    Fase selecionada para edição
                  </p>
                  <h3 className="text-sm font-black text-slate-800 mt-1">
                    {editLoading ? 'Carregando fase...' : editLessonTitle || 'Editar fase'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditLessonId("");
                    setEditLessonTitle("");
                    setEditLessonDesc("");
                    setEditQuestions([]);
                  }}
                  className="text-[9px] font-black uppercase bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-2 rounded-xl cursor-pointer"
                >
                  Fechar edição
                </button>
              </div>

              {editLoading ? (
                <div className="py-10 text-center text-xs font-black text-slate-400">
                  Carregando os dados da fase...
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase">
                        Título da fase
                      </label>
                      <input
                        type="text"
                        value={editLessonTitle}
                        onChange={(e) => setEditLessonTitle(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue rounded-xl p-3 text-xs font-bold text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-600 mb-1 uppercase">
                        Descrição da fase
                      </label>
                      <textarea
                        value={editLessonDesc}
                        onChange={(e) => setEditLessonDesc(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-falla-blue rounded-xl p-3 text-xs font-bold text-slate-700 outline-none resize-y"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase">
                        Questões da fase
                      </h4>
                      <span className="bg-slate-100 text-slate-600 text-[9px] font-black px-2 py-1 rounded-full">
                        {editQuestions.length} questão(ões)
                      </span>
                    </div>

                    <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                      {editQuestions.map((question, questionIndex) => (
                        <div
                          key={question.id || questionIndex}
                          className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="bg-falla-blue text-white text-[9px] font-black w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                              {questionIndex + 1}
                            </span>

                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[8px] bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-black uppercase">
                                  {question.type}
                                </span>
                              </div>

                              <textarea
                                value={question.prompt}
                                onChange={(e) => {
                                  const prompt = e.target.value;
                                  setEditQuestions(prev =>
                                    prev.map((item, idx) =>
                                      idx === questionIndex
                                        ? { ...item, prompt }
                                        : item
                                    )
                                  );
                                }}
                                rows={2}
                                className="w-full bg-white border-2 border-slate-200 focus:border-falla-blue rounded-xl p-2.5 text-[11px] font-bold text-slate-700 outline-none resize-y"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Remover a questão ${questionIndex + 1} desta fase?`)) {
                                  setEditQuestions(prev =>
                                    prev.filter((_, idx) => idx !== questionIndex)
                                  );
                                }
                              }}
                              className="shrink-0 bg-red-50 hover:bg-red-100 text-red-500 border border-red-200 p-2 rounded-xl cursor-pointer"
                              title="Remover questão"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={editSaving || editLoading}
                    onClick={handleSaveEditedLesson}
                    className="w-full bg-falla-green hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs py-3.5 rounded-2xl border-b-4 border-b-emerald-700 active:translate-y-0.5 active:border-b-0 transition-all cursor-pointer uppercase flex items-center justify-center gap-2"
                  >
                    <Save size={15} />
                    {editSaving ? 'Salvando alterações...' : 'Salvar alterações da fase'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUB-TAB: IMPORT QUESTIONS VIA EXCEL ----------------- */}
      {adminTab === 'import-questions' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-200 pb-3 gap-3">
              <div>
                <h3 className="font-black text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
                  <FileSpreadsheet size={16} className="text-falla-green" />
                  Importação de Questões em Massa (.xlsx)
                </h3>
                <p className="text-[10px] text-slate-500 font-bold leading-relaxed mt-0.5">
                  Preencha a planilha modelo, escolha o módulo e envie para atualizar as lições do Falla instantaneamente.
                </p>
              </div>
              <button
                onClick={downloadExcelTemplate}
                className="bg-falla-blue hover:bg-falla-blue/90 text-white text-[10px] font-black px-4 py-2.5 rounded-xl border-b-4 border-b-sky-700 active:translate-y-0.5 active:border-b-0 cursor-pointer uppercase flex items-center gap-1.5 shrink-0 self-start transition-all"
              >
                <Download size={12} />
                Baixar Modelo Padrão (.xlsx)
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-xs font-bold">
              
              {/* Left Panel: Configuration and Upload */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border-2 border-slate-200 space-y-4">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide border-b pb-1.5">
                  1. Configuração de Destino
                </p>

                <div className={`rounded-2xl border-2 p-3 ${
                  adminCoursesError
                    ? 'bg-red-50 border-red-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className={`text-[9px] font-black uppercase tracking-wider ${
                        adminCoursesError ? 'text-red-700' : 'text-emerald-700'
                      }`}>
                        Dados carregados diretamente do Supabase
                      </p>
                      <p className={`text-[9px] font-bold mt-1 ${
                        adminCoursesError ? 'text-red-600' : 'text-emerald-700'
                      }`}>
                        {loadingAdminCourses
                          ? 'Atualizando cursos e módulos...'
                          : adminCoursesError
                          ? adminCoursesError
                          : `${adminCourses.length} curso(s) real(is) carregado(s). Módulos provisórios “Em breve” não são usados pelo Admin.`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadAdminCourses({ keepCurrentSelection: true })}
                      disabled={loadingAdminCourses}
                      className="shrink-0 bg-white border-2 border-emerald-300 text-emerald-700 text-[9px] font-black uppercase px-3 py-2 rounded-xl hover:bg-emerald-100 disabled:opacity-50 cursor-pointer"
                    >
                      {loadingAdminCourses ? 'Atualizando...' : 'Atualizar banco'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1">Curso de Destino</label>
                    <select
                      value={activeCourseId}
                      disabled={loadingAdminCourses || adminCourses.length === 0}
                      onChange={(e) => {
                        setActiveCourseId(e.target.value);
                        const sel = adminCourses.find(c => c.id === e.target.value);
                        if (sel && sel.modules[0]) {
                          setActiveModId(sel.modules[0].id);
                        } else {
                          setActiveModId("");
                        }
                        // A fase selecionada pertence ao módulo anterior; limpa para evitar destino incorreto.
                        setImportSelectedLessonId("");
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2 font-black text-slate-700 focus:bg-white"
                    >
                      <option value="">Selecione...</option>
                      {adminCourses.map(c => (
                        <option key={c.id} value={c.id}>{c.flag} {c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-600 mb-1">Módulo de Destino</label>
                    <select
                      value={activeModId}
                      disabled={loadingAdminCourses || !activeCourseId}
                      onChange={(e) => {
                        setActiveModId(e.target.value);
                        setImportSelectedLessonId("");
                      }}
                      className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-2 font-black text-slate-700 focus:bg-white"
                    >
                      <option value="">Selecione...</option>
                      {adminCourses.find(c => c.id === activeCourseId)?.modules?.map(m => (
                        <option key={m.id} value={m.id}>{m.title}</option>
                      )) || []}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-[10px] font-black text-slate-600">Tipo de Importação</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setImportMode('new-lesson')}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                        importMode === 'new-lesson'
                          ? 'bg-falla-green/10 text-falla-green border-falla-green'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/50'
                      }`}
                    >
                      Criar Fases Automaticamente
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('existing-lesson')}
                      className={`py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                        importMode === 'existing-lesson'
                          ? 'bg-falla-blue/10 text-falla-blue border-falla-blue'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100/50'
                      }`}
                    >
                      Adicionar à Fase Existente
                    </button>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-[9px] font-bold text-amber-800 leading-relaxed">
                    A importação aceita somente <b>10</b> ou <b>100 questões</b>. Com 10 questões, o sistema cria 1 fase. Com 100 questões, cria 10 fases de 10. As fases são inseridas automaticamente ao final do módulo e as questões mantêm a ordem da planilha.
                  </div>
                </div>

                {importMode === 'new-lesson' ? (
                  <div className="space-y-3 p-3 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Dados da(s) Nova(s) Fase(s)</p>
                    <div>
                      <label className="block text-[9px] font-black text-slate-600 mb-0.5">ID Único da Fase</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          placeholder="Ex: en_les_viagem"
                          value={importLessonId}
                          onChange={(e) => setImportLessonId(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => setImportLessonId(generateLessonId(importLessonTitle, activeModId))}
                          title="Gerar ID automaticamente"
                          className="shrink-0 bg-falla-blue/10 hover:bg-falla-blue/20 text-falla-blue rounded-lg px-2.5 flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <Wand2 size={13} />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-600 mb-0.5">Título da Fase</label>
                      <input
                        type="text"
                        placeholder="Ex: No aeroporto"
                        value={importLessonTitle}
                        onChange={(e) => setImportLessonTitle(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-600 mb-0.5">Descrição da Fase</label>
                      <input
                        type="text"
                        placeholder="Ex: Aprenda frases e vocabulário para viajar."
                        value={importLessonDesc}
                        onChange={(e) => setImportLessonDesc(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                      />
                    </div>
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-[8px] font-bold text-blue-700 leading-relaxed">
                      A ordem das fases será definida automaticamente. Cada nova fase receberá 10 questões, respeitando a sequência original da planilha.
                    </div>
                  </div>
                ) : importMode === 'existing-lesson' ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-fade-in">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Escolha a Fase Existente</p>
                    <select
                      value={importSelectedLessonId}
                      onChange={(e) => setImportSelectedLessonId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold"
                    >
                      <option value="">Selecione a fase...</option>
                      {(adminCourses.find(c => c.id === activeCourseId)?.modules?.find(m => m.id === activeModId)?.lessons || []).map((l, index) => (
                        <option key={l.id} value={l.id}>
                          Fase {index + 1} — {l.title} ({l.questions?.length || 0} questões)
                        </option>
                      ))}
                    </select>
                    <p className="text-[8px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2">
                      Exatamente 10 questões serão adicionadas ao final da fase selecionada. As questões que já existem não serão substituídas.
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-black text-slate-700 uppercase tracking-wide">
                    2. Enviar Arquivo Planilha
                  </p>
                  <div className="border-2 border-dashed border-slate-300 hover:border-falla-green rounded-2xl p-5 text-center cursor-pointer relative bg-slate-50 transition-all group">
                    <input
                      type="file"
                      accept=".xlsx"
                      onChange={handleExcelUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center gap-2">
                      <Upload size={24} className="text-slate-400 group-hover:text-falla-green transition-colors" />
                      <span className="text-[10px] font-black text-slate-600 uppercase group-hover:text-slate-800 transition-colors">
                        {importFileName ? importFileName : "Clique ou arraste o arquivo .xlsx"}
                      </span>
                      <span className="text-[9px] text-slate-400 font-bold">
                        Apenas arquivos Excel de planilha padrão.
                      </span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Panel: Import Summary, Validation Report and Preview */}
              <div className="lg:col-span-7 space-y-4">
                
                {isUploading ? (
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center space-y-3">
                    <div className="w-8 h-8 border-3 border-falla-green border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="font-black text-slate-500 uppercase tracking-wider text-[10px]">Analisando planilha e validando questões...</p>
                  </div>
                ) : parsedQuestions.length === 0 && validationErrors.length === 0 ? (
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center text-slate-400 space-y-2">
                    <span className="text-4xl">📊</span>
                    <h4 className="font-black text-slate-700 text-xs uppercase tracking-wide">Relatório de Validação e Pré-visualização</h4>
                    <p className="text-[10px] text-slate-400 max-w-sm mx-auto font-bold leading-relaxed">
                      Faça o upload do seu arquivo preenchido para visualizar as questões validadas em tempo real antes de persistir no banco de dados.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    
                    {/* Validation Errors Report */}
                    {validationErrors.length > 0 && (
                      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-2">
                        <h4 className="font-black text-red-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                          <AlertCircle size={14} className="text-red-600 animate-pulse" />
                          Linhas Inválidas Encontradas ({validationErrors.length})
                        </h4>
                        <p className="text-[10px] text-red-600 font-bold leading-normal">
                          Estas linhas foram ignoradas e NÃO serão importadas devido a erros de preenchimento. Por favor, corrija a planilha se necessário.
                        </p>
                        <div className="max-h-[120px] overflow-y-auto pr-1 space-y-1 border border-red-150 rounded-lg bg-white p-2 text-[9px] font-mono leading-relaxed">
                          {validationErrors.map((err, i) => (
                            <div key={i} className="text-red-600 flex gap-1 border-b border-slate-50 pb-0.5 last:border-b-0">
                              <span className="font-extrabold text-red-800">Linha {err.line}:</span>
                              <span className="font-bold">{err.error}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Valid Questions Report */}
                    {parsedQuestions.length > 0 && (
                      <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-emerald-150 pb-2">
                          <h4 className="font-black text-emerald-800 text-xs uppercase tracking-wide flex items-center gap-1.5">
                            <Check size={14} className="text-emerald-600" />
                            Questões Prontas Para Importar ({parsedQuestions.length})
                          </h4>
                          <button
                            onClick={handleConfirmExcelImport}
                            disabled={isConfirming}
                            className="bg-falla-green hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-[10px] font-black px-4 py-2 rounded-xl border-b-4 border-b-emerald-800 active:translate-y-0.5 active:border-b-0 cursor-pointer uppercase flex items-center gap-1.5 shrink-0 transition-all"
                          >
                            {isConfirming ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Confirmar Importação"
                            )}
                          </button>
                        </div>

                        {/* Questions Preview */}
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                          {parsedQuestions.map((q, i) => (
                            <div key={i} className="bg-white border border-emerald-150 rounded-xl p-3 text-[10px] font-bold space-y-1.5">
                              <div className="flex items-center justify-between gap-2 text-[8px] border-b border-slate-100 pb-1">
                                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-black uppercase">
                                  Questão #{i+1} • {q.type}
                                </span>
                                <span className="text-slate-400 font-bold">
                                  Explicação: {q.hintText ? "Sim" : "Não"}
                                </span>
                              </div>
                              <p className="text-slate-800 font-extrabold text-xs">"{q.prompt}"</p>
                              {q.options && (
                                <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-1">
                                  {q.options.map((opt, oIdx) => {
                                    const isCorrect = opt === q.correctAnswer;
                                    return (
                                      <div key={oIdx} className={`p-1.5 rounded-lg border ${
                                        isCorrect 
                                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-black' 
                                          : 'bg-slate-50 border-slate-200 text-slate-500 font-semibold'
                                      }`}>
                                        {String.fromCharCode(65 + oIdx)}) {opt} {isCorrect && "✓"}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: BLUEPRINT SQL ----------------- */}
      {adminTab === 'sql-blueprint' && (
        <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-4 animate-fade-in max-w-3xl mx-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Terminal size={14} className="text-indigo-600" />
              Script DDL e RLS para o Supabase SQL Editor
            </h3>
            <span className="text-[8px] bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full font-black uppercase">PostgreSQL</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
            Execute os comandos abaixo diretamente no menu <strong>SQL Editor</strong> do seu painel do Supabase para inicializar as tabelas adicionais e configurar as políticas de segurança de leitura pública e escrita controlada:
          </p>

          <div className="bg-slate-900 text-indigo-300 p-4 rounded-xl border border-slate-800 max-h-[450px] overflow-y-auto font-mono text-[9px] leading-relaxed select-all">
            {`-- 1. Table: profiles (Add Subscription column if not exists)
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- 2. Table: push_notifications (Verify / Create)
CREATE TABLE IF NOT EXISTS public.push_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  frequency TEXT NOT NULL,
  type TEXT NOT NULL,
  times_per_day INTEGER DEFAULT 1,
  times_per_hour INTEGER DEFAULT 0,
  scheduled_time TEXT DEFAULT '09:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar novas colunas se a tabela já existir anteriormente
ALTER TABLE IF EXISTS public.push_notifications ADD COLUMN IF NOT EXISTS times_per_day INTEGER DEFAULT 1;
ALTER TABLE IF EXISTS public.push_notifications ADD COLUMN IF NOT EXISTS times_per_hour INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.push_notifications ADD COLUMN IF NOT EXISTS scheduled_time TEXT DEFAULT '09:00';

-- 3. Table: courses (Verify / Create)
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL
);

-- 4. Table: mascots (Verify / Create)
CREATE TABLE IF NOT EXISTS mascots (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  role TEXT,
  description TEXT,
  trait TEXT,
  quote TEXT,
  style_color TEXT,
  emoji TEXT
);

-- 5. Table: leaderboard (Verify / Create)
CREATE TABLE IF NOT EXISTS leaderboard (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  state TEXT,
  country TEXT,
  avatar TEXT
);

-- 6. Table: learning_tips (New!)
CREATE TABLE IF NOT EXISTS learning_tips (
  id TEXT PRIMARY KEY,
  tip TEXT NOT NULL,
  mascot_id TEXT
);

-- 7. Table: achievements (New!)
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  emoji TEXT,
  xp_required INTEGER NOT NULL DEFAULT 0
);

-- 8. Table: ai_tutor_config (New!)
CREATE TABLE IF NOT EXISTS ai_tutor_config (
  id TEXT PRIMARY KEY DEFAULT 'main_config',
  prompt_template TEXT NOT NULL,
  default_topic TEXT NOT NULL
);

-- 9. Table: interface_texts (New!)
CREATE TABLE IF NOT EXISTS interface_texts (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- 10. Table: profile_banners (New!)
CREATE TABLE IF NOT EXISTS profile_banners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  unlocked_by_default BOOLEAN NOT NULL DEFAULT false,
  is_animated BOOLEAN NOT NULL DEFAULT false,
  animation_type TEXT DEFAULT 'none'
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mascots ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE interface_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_banners ENABLE ROW LEVEL SECURITY;

-- Enable Anonymous Public Read policies
CREATE POLICY "Public Read on courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Public Read on mascots" ON mascots FOR SELECT USING (true);
CREATE POLICY "Public Read on leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Public Read on learning_tips" ON learning_tips FOR SELECT USING (true);
CREATE POLICY "Public Read on achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Public Read on ai_tutor_config" ON ai_tutor_config FOR SELECT USING (true);
CREATE POLICY "Public Read on interface_texts" ON interface_texts FOR SELECT USING (true);
CREATE POLICY "Public Read on push_notifications" ON push_notifications FOR SELECT USING (true);
CREATE POLICY "Public Read on profile_banners" ON profile_banners FOR SELECT USING (true);

-- Enable Write Policies for all (Allows Admin panel to write securely)
CREATE POLICY "Write access on courses" ON courses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on mascots" ON mascots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on leaderboard" ON leaderboard FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on learning_tips" ON learning_tips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on ai_tutor_config" ON ai_tutor_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on interface_texts" ON interface_texts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on push_notifications" ON push_notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Write access on profile_banners" ON profile_banners FOR ALL USING (true) WITH CHECK (true);`}
          </div>
          <p className="text-[9px] text-slate-400 font-bold italic leading-relaxed">
            Dica: No ambiente de produção, substitua "USING (true) WITH CHECK (true)" por "USING (auth.uid() IS NOT NULL)" ou restrinja o acesso de escrita por IP / Role de Administrador para maior segurança cibernética corporativa.
          </p>
        </div>
      )}

      {/* ----------------- SUB-TAB: BANNERS DE PERFIL ----------------- */}
      {adminTab === 'banners' && (
        <div className="space-y-6 animate-fade-in">
          {/* Banner Instructions & Spec */}
          <div className="bg-slate-50 rounded-3xl border-2 border-slate-200 p-5 space-y-3">
            <h3 className="font-black text-slate-800 text-xs flex items-center gap-1.5 uppercase tracking-wide">
              <Palette size={14} className="text-falla-blue" />
              Especificações & Formatos dos Banners
            </h3>
            <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
              O recurso de capas de perfil (banners) utiliza diretamente expressões de estilo CSS para renderizar visuais modernos sem carregar arquivos de imagem externos pesados. Isso garante alta performance e carregamento instantâneo.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px]">
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-black text-slate-700 block">🎨 Gradientes Lineares (Linear Gradients)</span>
                <span className="text-slate-500 font-medium block">
                  Cria uma transição de cores suave ao longo de uma linha de ângulo.
                </span>
                <code className="block bg-slate-50 p-1.5 rounded text-[9px] text-pink-600 font-mono select-all">
                  linear-gradient(135deg, #ff007f 0%, #7f00ff 100%)
                </code>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-black text-slate-700 block">🔮 Gradientes Radiais (Radial Gradients)</span>
                <span className="text-slate-500 font-medium block">
                  Cria uma transição de cores circular que se expande a partir do centro.
                </span>
                <code className="block bg-slate-50 p-1.5 rounded text-[9px] text-indigo-600 font-mono select-all">
                  radial-gradient(circle, #3b82f6 0%, #030712 100%)
                </code>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1 md:col-span-2">
                <span className="font-black text-amber-600 flex items-center gap-1">✨ Banners com Movimento (Animações de Perfil Estilo Discord Nitro)</span>
                <span className="text-slate-500 font-medium block">
                  Ao ativar a opção de banner animado, a aplicação sobrepõe animações CSS aceleradas por hardware sobre o seu fundo de cor/gradiente:
                </span>
                <ul className="list-disc pl-4 space-y-1 text-slate-500 font-bold mt-1">
                  <li><strong>Gradiente Deslizante (gradient):</strong> Faz o gradiente de fundo mover sua posição lateralmente de forma contínua e suave.</li>
                  <li><strong>Mudança de Matiz (hue):</strong> Rotaciona os tons cromáticos do fundo em 360 graus para um visual arco-íris dinâmico.</li>
                  <li><strong>Brilho Cromado Metálico (shimmer):</strong> Dispara uma faixa reflexiva de brilho branco de um lado a outro do banner periodicamente.</li>
                  <li><strong>Grelha Neon Deslizante (stripes):</strong> Sobrepõe uma elegante padronagem de linhas diagonais semitransparentes deslizando.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form to Add New Banner */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1">
              ➕ Cadastrar Novo Banner de Perfil
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Nome do Banner</label>
                <input 
                  type="text" 
                  value={formBannerName}
                  onChange={(e) => {
                    setFormBannerName(e.target.value);
                    const generatedId = 'banner_custom_' + Date.now();
                    setFormBannerId(generatedId);
                  }}
                  placeholder="Ex: Noite de Tóquio 🗼"
                  className="w-full text-xs font-bold border-2 border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-falla-blue"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">ID do Banner (Automático)</label>
                <input 
                  type="text" 
                  value={formBannerId}
                  disabled
                  placeholder="Preenchido ao digitar o nome"
                  className="w-full text-xs font-bold border-2 border-slate-150 bg-slate-50 text-slate-400 rounded-xl px-3 py-2 outline-none"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase flex justify-between">
                  <span>Valor CSS para Background / Gradiente</span>
                </label>
                <input 
                  type="text" 
                  value={formBannerImageUrl}
                  onChange={(e) => setFormBannerImageUrl(e.target.value)}
                  placeholder="Ex: linear-gradient(135deg, #ff007f 0%, #7f00ff 100%)"
                  className="w-full text-xs font-bold border-2 border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-falla-blue font-mono text-slate-700"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  <span className="text-[9px] font-black text-slate-400 py-0.5">Presets Estilosos:</span>
                  <button 
                    onClick={() => setFormBannerImageUrl('linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)')}
                    className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200"
                  >
                    Cosmos 🌌
                  </button>
                  <button 
                    onClick={() => setFormBannerImageUrl('linear-gradient(135deg, #10b981 0%, #3b82f6 100%)')}
                    className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200"
                  >
                    Menta & Oceano 🐬
                  </button>
                  <button 
                    onClick={() => setFormBannerImageUrl('linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)')}
                    className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200"
                  >
                    Fogo Quente 🔥
                  </button>
                  <button 
                    onClick={() => setFormBannerImageUrl('radial-gradient(circle, #ec4899 0%, #1e1b4b 100%)')}
                    className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200"
                  >
                    Radial Neon 🔮
                  </button>
                  <button 
                    onClick={() => setFormBannerImageUrl('linear-gradient(45deg, #1e293b 0%, #0f172a 100%)')}
                    className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md font-bold text-slate-600 border border-slate-200"
                  >
                    Sombra Dark 🖤
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase">Preço (Falla Moedas)</label>
                <input 
                  type="number" 
                  value={formBannerPrice}
                  onChange={(e) => setFormBannerPrice(Number(e.target.value))}
                  placeholder="Ex: 25"
                  className="w-full text-xs font-bold border-2 border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-falla-blue"
                />
              </div>

              <div className="flex flex-col justify-end space-y-2 pb-1.5">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="unlockedByDefault"
                    checked={formBannerUnlockedByDefault}
                    onChange={(e) => setFormBannerUnlockedByDefault(e.target.checked)}
                    className="w-4 h-4 text-falla-blue border-2 border-slate-200 rounded focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="unlockedByDefault" className="text-[11px] font-black text-slate-700 cursor-pointer">
                    Desbloqueado por Padrão para Todos?
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="isAnimated"
                    checked={formBannerIsAnimated}
                    onChange={(e) => setFormBannerIsAnimated(e.target.checked)}
                    className="w-4 h-4 text-falla-blue border-2 border-slate-200 rounded focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isAnimated" className="text-[11px] font-black text-slate-700 cursor-pointer flex items-center gap-1.5">
                    <span>Ativar Movimento / Animação?</span>
                    <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-black uppercase">Discord</span>
                  </label>
                </div>
              </div>

              {formBannerIsAnimated && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] font-black text-slate-500 uppercase">Selecione o Estilo de Movimento</label>
                  <select 
                    value={formBannerAnimationType}
                    onChange={(e) => setFormBannerAnimationType(e.target.value as any)}
                    className="w-full text-xs font-bold border-2 border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-falla-blue bg-white"
                  >
                    <option value="gradient">Gradiente Deslizante (Smooth Shifting)</option>
                    <option value="hue">Arco-Íris Pulsante (Hue-Rotation)</option>
                    <option value="shimmer">Brilho Cromado Reflexivo (Shiny Shimmer)</option>
                    <option value="stripes">Grelha Neon Deslizante (Moving Stripes)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Live Preview Block */}
            {formBannerImageUrl && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide block">Pré-Visualização do Novo Banner em Tempo Real:</span>
                <div className="bg-slate-100 p-2.5 rounded-2xl border border-slate-200">
                  <div 
                    style={{ background: formBannerImageUrl }}
                    className={`h-20 w-full rounded-xl flex items-center justify-between px-4 relative overflow-hidden transition-all duration-300 ${
                      formBannerIsAnimated 
                        ? formBannerAnimationType === 'gradient' ? 'banner-animated-gradient' :
                          formBannerAnimationType === 'hue' ? 'banner-animated-hue' :
                          formBannerAnimationType === 'shimmer' ? 'banner-animated-shimmer' :
                          formBannerAnimationType === 'stripes' ? 'banner-animated-stripes' :
                          ''
                        : ''
                    }`}
                  >
                    <div className="bg-black/40 text-white text-[10px] font-black px-2.5 py-1 rounded-full backdrop-blur-xs">
                      {formBannerName || 'Novo Banner Customizado'}
                    </div>
                    {formBannerIsAnimated && (
                      <span className="bg-pink-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm z-10">
                        Animação: {formBannerAnimationType}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => {
                if (!formBannerName.trim() || !formBannerImageUrl.trim()) {
                  alert("Por favor, forneça o Nome do Banner e a Expressão de Fundo CSS!");
                  return;
                }
                const newB: ProfileBanner = {
                  id: formBannerId,
                  name: formBannerName.trim(),
                  imageUrl: formBannerImageUrl.trim(),
                  price: formBannerPrice,
                  unlockedByDefault: formBannerUnlockedByDefault,
                  isAnimated: formBannerIsAnimated,
                  animationType: formBannerIsAnimated ? formBannerAnimationType : undefined
                };
                onAddCustomBanner(newB);
                
                // Clear state
                setFormBannerName('');
                setFormBannerId('');
                setFormBannerImageUrl('');
                setFormBannerPrice(25);
                setFormBannerUnlockedByDefault(false);
                setFormBannerIsAnimated(false);
                setFormBannerAnimationType('gradient');
                
                alert(`Sucesso! O banner "${newB.name}" foi criado e já está publicado na loja.`);
              }}
              className="w-full bg-falla-blue hover:bg-blue-600 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus size={14} /> Salvar e Ativar Novo Banner
            </button>
          </div>

          {/* Current Banners Grid */}
          <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Banners Ativos na Plataforma ({banners.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banners.map((b) => {
                const isCustom = b.id.startsWith('banner_custom_');
                const animClass = b.isAnimated 
                  ? b.animationType === 'gradient' ? 'banner-animated-gradient' :
                    b.animationType === 'hue' ? 'banner-animated-hue' :
                    b.animationType === 'shimmer' ? 'banner-animated-shimmer' :
                    b.animationType === 'stripes' ? 'banner-animated-stripes' :
                    ''
                  : '';
                return (
                  <div key={b.id} className="border-2 border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col justify-between shadow-xs">
                    <div 
                      style={{ background: b.imageUrl }}
                      className={`h-16 w-full relative flex items-end justify-between p-3 ${animClass}`}
                    >
                      <span className="bg-black/50 text-white text-[9px] font-black px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {b.name}
                      </span>
                      {b.isAnimated && (
                        <span className="bg-pink-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-wide">
                          {b.animationType}
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex justify-between items-center bg-white border-t border-slate-100">
                      <div className="text-[9px] font-bold text-slate-500 space-y-0.5">
                        <div>ID: <span className="font-mono text-slate-600 font-medium">{b.id}</span></div>
                        <div>Preço: <span className="text-amber-600 font-extrabold">{b.price} moedas</span></div>
                        <div>Desbloqueado: <span className="text-slate-700">{b.unlockedByDefault ? 'Sim (padrão)' : 'Não'}</span></div>
                      </div>
                      {isCustom ? (
                        <button 
                          onClick={() => {
                            if (confirm(`Tem certeza de que deseja remover permanentemente o banner customizado "${b.name}"?`)) {
                              onDeleteCustomBanner(b.id);
                            }
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-500 p-1.5 rounded-lg border border-red-200 transition-colors cursor-pointer"
                          title="Remover Banner Customizado"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <span className="text-[8px] bg-slate-100 text-slate-400 font-black px-2 py-0.5 rounded uppercase">
                          Sistema
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
