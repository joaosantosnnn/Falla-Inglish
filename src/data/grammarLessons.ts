import { Lesson, Question, QuestionType } from '../types';

export interface GrammarLesson extends Lesson {
  topic: string;
  explanation: string;
  examples: string[];
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  {
    id: "grammar_to_be",
    title: "Verbo To Be",
    topic: "Verbo \"to be\" (am/is/are)",
    description: "A base fundamental do inglês: ser e estar no presente simples.",
    xpReward: 30,
    explanation: "O verbo 'to be' significa ser ou estar em português. No presente simples, ele possui três formas principais: 'am' (usado apenas com 'I'), 'is' (usado com ele/ela: 'he, she, it') e 'are' (usado com plural e você: 'you, we, they'). É a estrutura mais importante para começar a criar frases!",
    examples: [
      "I am a teacher. (Eu sou professor.)",
      "She is happy today. (Ela está feliz hoje.)",
      "They are at home. (Eles estão em casa.)"
    ],
    questions: [
      {
        id: "g_tb_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Escolha a forma correta: 'I ____ learning English.'",
        options: ["is", "am", "are", "be"],
        correctAnswer: "am",
        characterHint: "Lico",
        hintText: "Lembre-se: 'I' sempre combina com 'am' no presente do verbo to be!"
      },
      {
        id: "g_tb_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Ela está feliz hoje.'",
        options: ["happy", "is", "today", "She", "are", "am"],
        correctAnswer: ["She", "is", "happy", "today"],
        characterHint: "Bia",
        hintText: "Para ela (She), a forma correspondente do verbo to be é 'is'!"
      },
      {
        id: "g_tb_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete a frase: 'We ____ friends.'",
        options: ["am", "is", "are", "be"],
        correctAnswer: "are",
        characterHint: "Teddy",
        hintText: "Usamos 'are' para o pronome plural 'We' (nós)."
      },
      {
        id: "g_tb_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Eles estão em casa.'",
        options: ["home", "They", "are", "at", "is", "am"],
        correctAnswer: ["They", "are", "at", "home"],
        characterHint: "Luna",
        hintText: "Eles (They) combina com 'are', seguido de 'at home' (em casa)."
      }
    ]
  },
  {
    id: "grammar_pronouns",
    title: "Pronomes Pessoais e Possessivos",
    topic: "Pronomes pessoais e possessivos",
    description: "Identifique quem faz a ação e a quem pertencem as coisas.",
    xpReward: 30,
    explanation: "Os pronomes pessoais (I, you, he, she, it, we, they) substituem os nomes e realizam a ação principal. Já os pronomes/adjetivos possessivos (my, your, his, her, its, our, their) mostram de quem é o objeto e vêm sempre antes de um substantivo.",
    examples: [
      "He is reading his book. (Ele está lendo o livro dele.)",
      "This is my new house. (Esta é a minha casa nova.)",
      "They like their new teacher. (Eles gostam da nova professora deles.)"
    ],
    questions: [
      {
        id: "g_pr_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete com o possessivo correspondente a 'She': 'This is ___ cat.'",
        options: ["his", "my", "her", "their"],
        correctAnswer: "her",
        characterHint: "Luna",
        hintText: "O possessivo de 'She' (ela) é 'her' (dela)."
      },
      {
        id: "g_pr_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Ele é meu amigo.'",
        options: ["He", "my", "friend", "is", "she", "her"],
        correctAnswer: ["He", "is", "my", "friend"],
        characterHint: "Chico",
        hintText: "Comece com 'He' (ele), o verbo correspondente, e depois o possessivo 'my'!"
      },
      {
        id: "g_pr_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Escolha o pronome pessoal correto: '_____ are studying English together.' (Nós estamos...)",
        options: ["I", "We", "He", "She"],
        correctAnswer: "We",
        characterHint: "Lico",
        hintText: "'We' significa 'nós' em inglês, combinando com 'are'!"
      },
      {
        id: "g_pr_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Eles amam seu cachorro.' (o cachorro deles)",
        options: ["They", "love", "their", "dog", "our", "we"],
        correctAnswer: ["They", "love", "their", "dog"],
        characterHint: "Bia",
        hintText: "O possessivo correspondente a 'They' (eles) é 'their' (deles)."
      }
    ]
  },
  {
    id: "grammar_nouns",
    title: "Substantivos: Singular e Plural",
    topic: "Substantivos: singular e plural",
    description: "Como transformar palavras de um para vários objetos.",
    xpReward: 30,
    explanation: "Na maioria das palavras, basta adicionar '-s' para criar o plural (book -> books). Se a palavra termina em -s, -x, -ch, -sh, ou -o, adicionamos '-es' (box -> boxes). Há plurais irregulares que mudam completamente: child (criança) vira children (crianças), man (homem) vira men (homens), woman vira women.",
    examples: [
      "one dog, three dogs (um cachorro, três cachorros)",
      "one box, two boxes (uma caixa, duas caixas)",
      "one child, five children (uma criança, cinco crianças)"
    ],
    questions: [
      {
        id: "g_ns_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é o plural correto de 'box' (caixa)?",
        options: ["boxs", "boxes", "boxies", "boxen"],
        correctAnswer: "boxes",
        characterHint: "Teddy",
        hintText: "Palavras terminadas em -x recebem '-es' no final para formar o plural."
      },
      {
        id: "g_ns_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'As crianças estão brincando.'",
        options: ["The", "children", "are", "playing", "childs", "is"],
        correctAnswer: ["The", "children", "are", "playing"],
        characterHint: "Luna",
        hintText: "O plural de 'child' é 'children' (irregular), e por ser plural combina com 'are'!"
      },
      {
        id: "g_ns_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é o plural irregular de 'man' (homem)?",
        options: ["mans", "manes", "men", "mens"],
        correctAnswer: "men",
        characterHint: "Lico",
        hintText: "Muitas palavras mudam a vogal interna no plural. 'man' vira 'men'!"
      },
      {
        id: "g_ns_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Eu tenho dois gatos.'",
        options: ["I", "have", "two", "cats", "has", "cat"],
        correctAnswer: ["I", "have", "two", "cats"],
        characterHint: "Chico",
        hintText: "Basta adicionar '-s' à palavra 'cat' para ter o plural comum!"
      }
    ]
  },
  {
    id: "grammar_articles",
    title: "Artigos: A, An, The",
    topic: "Artigos (a, an, the)",
    description: "Aprenda quando usar 'um/uma' e quando se referir a coisas específicas.",
    xpReward: 30,
    explanation: "Usamos os artigos indefinidos 'a' e 'an' para dizer 'um' ou 'uma' no singular. Regra de ouro: use 'a' antes de palavras com som de consoante (a university, a house) e 'an' antes de palavras com som de vogal (an apple, an orange). O artigo definido 'the' refere-se a coisas específicas no singular ou plural (o, a, os, as).",
    examples: [
      "I want a new car. (Eu quero um carro novo.)",
      "She eats an apple. (Ela come uma maçã.)",
      "The sun is yellow. (O sol é amarelo.)"
    ],
    questions: [
      {
        id: "g_art_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Escolha o artigo correto: 'She is eating ____ orange.'",
        options: ["a", "an", "the", "no article"],
        correctAnswer: "an",
        characterHint: "Bia",
        hintText: "'Orange' começa com som de vogal, então usamos 'an'!"
      },
      {
        id: "g_art_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'O sol está quente hoje.'",
        options: ["The", "sun", "is", "hot", "today", "A", "an"],
        correctAnswer: ["The", "sun", "is", "hot", "today"],
        characterHint: "Luna",
        hintText: "Usamos o artigo definido 'The' para falar do sol, que é algo específico e único!"
      },
      {
        id: "g_art_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual artigo é correto: 'I bought ____ book.' (Comprei um livro genérico)",
        options: ["a", "an", "the", "some"],
        correctAnswer: "a",
        characterHint: "Teddy",
        hintText: "'Book' começa com som de consoante (/b/), portanto usamos o artigo indefinido 'a'."
      },
      {
        id: "g_art_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'O livro é azul.'",
        options: ["The", "book", "is", "blue", "An", "are"],
        correctAnswer: ["The", "book", "is", "blue"],
        characterHint: "Chico",
        hintText: "'The' refere-se ao livro específico que estamos comentando."
      }
    ]
  },
  {
    id: "grammar_simple_present",
    title: "Presente Simples",
    topic: "Presente simples (afirmativa, negativa, interrogativa)",
    description: "Fale sobre sua rotina diária e hábitos.",
    xpReward: 30,
    explanation: "O 'Simple Present' é usado para falar de verdades universais e rotinas. Na afirmativa com 'he, she, it', adicionamos '-s/es' ao verbo principal (he works). Na negativa, usamos 'don't' ou 'doesn't' + verbo sem o '-s'. Na interrogativa, usamos os auxiliares 'Do' ou 'Does' no começo da pergunta.",
    examples: [
      "I live in São Paulo. (Eu moro em São Paulo.)",
      "She does not (doesn't) like coffee. (Ela não gosta de café.)",
      "Do you study English? (Você estuda inglês?)"
    ],
    questions: [
      {
        id: "g_sp_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Escolha a forma correta do verbo para 'He': 'He ____ soccer every Sunday.'",
        options: ["play", "plays", "playing", "does play"],
        correctAnswer: "plays",
        characterHint: "Lico",
        hintText: "Na afirmativa do Simple Present, adicionamos '-s' ao verbo quando o sujeito é he/she/it!"
      },
      {
        id: "g_sp_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Você gosta de café?'",
        options: ["Do", "you", "like", "coffee", "Does", "likes"],
        correctAnswer: ["Do", "you", "like", "coffee"],
        characterHint: "Bia",
        hintText: "Para perguntas com 'you', iniciamos com o verbo auxiliar 'Do'!"
      },
      {
        id: "g_sp_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual auxiliar negativo usamos para 'She'?: 'She ____ work here.'",
        options: ["don't", "doesn't", "no", "not"],
        correctAnswer: "doesn't",
        characterHint: "Teddy",
        hintText: "Para a terceira pessoa do singular (he/she/it), o auxiliar negativo é 'doesn't'!"
      },
      {
        id: "g_sp_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Eu não bebo chá.'",
        options: ["I", "don't", "drink", "tea", "doesn't", "drinks"],
        correctAnswer: ["I", "don't", "drink", "tea"],
        characterHint: "Chico",
        hintText: "Para o sujeito 'I', o auxiliar de negação correto é 'don't'."
      }
    ]
  },
  {
    id: "grammar_action_verbs",
    title: "Verbos de Ação Básicos",
    topic: "Verbos de ação básicos",
    description: "Aprenda ações cotidianas para descrever seu dia a dia.",
    xpReward: 30,
    explanation: "Os verbos de ação expressam atividades físicas ou mentais do nosso cotidiano. Dominar verbos como 'run' (correr), 'eat' (comer), 'sleep' (dormir), 'read' (ler), 'write' (escrever) e 'study' (estudar) ajudará você a contar histórias e expressar desejos.",
    examples: [
      "I study English everyday. (Eu estudo inglês todo dia.)",
      "We eat pizza on Fridays. (Nós comemos pizza às sextas-feiras.)",
      "They run in the park. (Eles correm no parque.)"
    ],
    questions: [
      {
        id: "g_av_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete com o verbo correspondente a 'ler': 'I like to ____ books.'",
        options: ["write", "eat", "read", "sleep"],
        correctAnswer: "read",
        characterHint: "Luna",
        hintText: "'Read' significa ler, perfeito para desvendar livros e mistérios!"
      },
      {
        id: "g_av_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Nós bebemos leite de manhã.'",
        options: ["We", "drink", "milk", "in", "the", "morning", "drinks", "at"],
        correctAnswer: ["We", "drink", "milk", "in", "the", "morning"],
        characterHint: "Chico",
        hintText: "'We' (nós) é seguido por 'drink' (beber, sem 's' pois é plural) e os complementos."
      },
      {
        id: "g_av_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual palavra significa 'correr'?",
        options: ["sleep", "run", "eat", "write"],
        correctAnswer: "run",
        characterHint: "Lico",
        hintText: "'Run' significa correr! É o que eu amo fazer pulando de alegria!"
      },
      {
        id: "g_av_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Ela escreve uma carta.'",
        options: ["She", "writes", "a", "letter", "write", "an"],
        correctAnswer: ["She", "writes", "a", "letter"],
        characterHint: "Bia",
        hintText: "Como o sujeito é 'She', o verbo ganha um '-s' final: 'writes'."
      }
    ]
  },
  {
    id: "grammar_adjectives",
    title: "Adjetivos e Ordem das Palavras",
    topic: "Adjetivos e ordem na frase",
    description: "Dê características e entenda por que o adjetivo vem antes.",
    xpReward: 30,
    explanation: "Em inglês, os adjetivos (palavras de qualidade, como 'red', 'cold', 'big') vêm SEMPRE antes do substantivo que descrevem. Além disso, adjetivos em inglês NUNCA mudam para o plural ou feminino/masculino. Eles são neutros e fixos!",
    examples: [
      "a blue car (um carro azul)",
      "beautiful flowers (flores bonitas)",
      "cold water (água fria)"
    ],
    questions: [
      {
        id: "g_adj_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é a tradução correta para 'um carro vermelho'?",
        options: ["a car red", "a red car", "one car red", "red a car"],
        correctAnswer: "a red car",
        characterHint: "Bia",
        hintText: "O adjetivo de cor 'red' deve vir sempre antes do substantivo 'car'!"
      },
      {
        id: "g_adj_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Nós moramos em uma casa grande.'",
        options: ["We", "live", "in", "a", "big", "house", "large", "lives"],
        correctAnswer: ["We", "live", "in", "a", "big", "house"],
        characterHint: "Teddy",
        hintText: "Coloque o adjetivo de tamanho 'big' antes de 'house'!"
      },
      {
        id: "g_adj_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como dizemos 'olhos azuis' em inglês?",
        options: ["eyes blue", "blues eyes", "blue eyes", "eyes blues"],
        correctAnswer: "blue eyes",
        characterHint: "Luna",
        hintText: "Os adjetivos em inglês nunca ganham '-s' no plural. Portanto, é apenas 'blue eyes'!"
      },
      {
        id: "g_adj_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Ela tem um gato preto.'",
        options: ["She", "has", "a", "black", "cat", "have", "cats"],
        correctAnswer: ["She", "has", "a", "black", "cat"],
        characterHint: "Chico",
        hintText: "'She' usa o verbo 'has' (ter), seguido de 'a black cat' (adjetivo antes do substantivo)."
      }
    ]
  },
  {
    id: "grammar_prepositions",
    title: "Preposições de Lugar: In, On, At",
    topic: "Preposições de lugar (in, on, at)",
    description: "Saiba exatamente onde estão as coisas.",
    xpReward: 30,
    explanation: "Preposições de lugar indicam posicionamento físico. Regras básicas:\n- 'In' indica dentro de espaços físicos fechados, cidades ou países.\n- 'On' indica contato direto sobre superfícies, telas ou ruas.\n- 'At' indica locais específicos ou endereços completos, pontos de encontro públicos.",
    examples: [
      "The milk is in the fridge. (O leite está dentro da geladeira.)",
      "My phone is on the bed. (Meu telefone está em cima da cama.)",
      "I am waiting at the bus stop. (Estou esperando no ponto de ônibus.)"
    ],
    questions: [
      {
        id: "g_prep_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete com a preposição de superfície: 'The cup is _____ the table.'",
        options: ["in", "on", "at", "to"],
        correctAnswer: "on",
        characterHint: "Chico",
        hintText: "Como o copo está em cima da superfície da mesa, usamos 'on'!"
      },
      {
        id: "g_prep_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Nós moramos no Brasil.'",
        options: ["We", "live", "in", "Brazil", "on", "at", "lives"],
        correctAnswer: ["We", "live", "in", "Brazil"],
        characterHint: "Lico",
        hintText: "Para países, usamos sempre a preposição 'in'!"
      },
      {
        id: "g_prep_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: 'I am _____ home right now.'",
        options: ["in", "on", "at", "into"],
        correctAnswer: "at",
        characterHint: "Teddy",
        hintText: "A expressão comum e correta para dizer 'em casa' é 'at home'."
      },
      {
        id: "g_prep_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'As chaves estão na bolsa.' (dentro da bolsa)",
        options: ["The", "keys", "are", "in", "the", "bag", "on", "at"],
        correctAnswer: ["The", "keys", "are", "in", "the", "bag"],
        characterHint: "Luna",
        hintText: "Dentro de um espaço contido como uma bolsa, usamos a preposição 'in'!"
      }
    ]
  },
  {
    id: "grammar_wh_questions",
    title: "Perguntas com WH",
    topic: "Perguntas com WH (what, where, who, when, why, how)",
    description: "Aprenda a fazer perguntas essenciais para obter informações.",
    xpReward: 30,
    explanation: "As chamadas 'Question Words' servem para colher informações específicas. Elas iniciam as perguntas e são fáceis de memorizar:\n- What = o que/qual\n- Where = onde\n- Who = quem\n- When = quando\n- Why = por que (resposta usa 'because')\n- How = como.",
    examples: [
      "Where are you from? (De onde você é?)",
      "Who is that boy? (Quem é aquele garoto?)",
      "Why are you late? (Por que você está atrasado?)"
    ],
    questions: [
      {
        id: "g_wh_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual palavra significa 'ONDE' em inglês?",
        options: ["What", "Where", "When", "Why"],
        correctAnswer: "Where",
        characterHint: "Luna",
        hintText: "'Where' pergunta por direções ou locais!"
      },
      {
        id: "g_wh_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a pergunta: 'Quem é seu professor?'",
        options: ["Who", "is", "your", "teacher", "What", "are"],
        correctAnswer: ["Who", "is", "your", "teacher"],
        characterHint: "Bia",
        hintText: "Para perguntar sobre uma pessoa (quem), iniciamos com 'Who'!"
      },
      {
        id: "g_wh_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Escolha a palavra correta: '_____ do you drink milk?' 'Because I like it.'",
        options: ["When", "Where", "Why", "Who"],
        correctAnswer: "Why",
        characterHint: "Teddy",
        hintText: "Para perguntas sobre motivos, cuja resposta usa 'Because' (porque), iniciamos com 'Why'!"
      },
      {
        id: "g_wh_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a pergunta: 'Como está você hoje?'",
        options: ["How", "are", "you", "today", "What", "is"],
        correctAnswer: ["How", "are", "you", "today"],
        characterHint: "Chico",
        hintText: "Para perguntar 'Como' alguém está, iniciamos com 'How'!"
      }
    ]
  },
  {
    id: "grammar_present_continuous",
    title: "Presente Contínuo",
    topic: "Presente contínuo (-ing)",
    description: "Fale sobre o que você está fazendo neste exato momento.",
    xpReward: 30,
    explanation: "O 'Present Continuous' indica ações que estão ocorrendo no momento da fala. Ele é composto pelo verbo 'to be' conjugado no presente (am, is, are) + o verbo de ação principal com o sufixo '-ing' (correspondente ao nosso gerúndio: ando, endo, indo).",
    examples: [
      "I am talking to you now. (Eu estou falando com você agora.)",
      "He is playing soccer. (Ele está jogando futebol.)",
      "They are studying grammar. (Eles estão estudando gramática.)"
    ],
    questions: [
      {
        id: "g_pc_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete com a conjugação correta: 'We are _____ English now.'",
        options: ["study", "studies", "studying", "studied"],
        correctAnswer: "studying",
        characterHint: "Lico",
        hintText: "No presente contínuo, a ação em andamento sempre leva a terminação '-ing'!"
      },
      {
        id: "g_pc_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Ela está correndo no parque.'",
        options: ["She", "is", "running", "in", "the", "park", "are", "run"],
        correctAnswer: ["She", "is", "running", "in", "the", "park"],
        characterHint: "Bia",
        hintText: "O sujeito é 'She', o verbo to be é 'is', seguido do verbo de ação 'running' (-ing)!"
      },
      {
        id: "g_pc_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual frase está no Present Continuous?",
        options: [
          "I drink milk.",
          "I am drinking milk.",
          "I will drink milk.",
          "I drank milk."
        ],
        correctAnswer: "I am drinking milk.",
        characterHint: "Teddy",
        hintText: "Deve conter sujeito + verbo to be (am) + verbo principal com -ing (drinking)!"
      },
      {
        id: "g_pc_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Eles estão comendo pizza.'",
        options: ["They", "are", "eating", "pizza", "is", "eat"],
        correctAnswer: ["They", "are", "eating", "pizza"],
        characterHint: "Luna",
        hintText: "Eles (They) combina com 'are', seguido de 'eating'!"
      }
    ]
  }
];
