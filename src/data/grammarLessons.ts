import { Question, QuestionType } from '../types';

/**
 * ============================================================================
 * FALLA APP - AULAS DE GRAMÁTICA (10 TÓPICOS PLANEJADOS)
 * ============================================================================
 * LOTE 1 (COMPLETO E PRONTO PARA REVISÃO):
 *   1. Verbo "To Be" (am/is/are)
 *   2. Pronomes Pessoais e Possessivos
 *   3. Substantivos: Singular e Plural
 *
 * PRÓXIMOS LOTES (estrutura planejada, ver comentários no final do arquivo):
 *   4. Artigos (a, an, the)
 *   5. Presente Simples
 *   6. Verbos de Ação Básicos
 *   7. Adjetivos e Ordem na Frase
 *   8. Preposições de Lugar (in, on, at)
 *   9. Perguntas com WH
 *   10. Presente Contínuo (-ing)
 * ============================================================================
 */

export interface GrammarLesson {
  id: string;
  topic: string;
  explanation: string;
  examples: string[]; // Frase em inglês seguida de " — " e a tradução
  exercises: Question[];
  xpReward: number;
}

export const GRAMMAR_LESSONS: GrammarLesson[] = [
  // ==========================================================================
  // 1. VERBO "TO BE" (am / is / are)
  // ==========================================================================
  {
    id: "grammar_to_be",
    topic: "Verbo To Be",
    explanation:
      "O verbo 'to be' (ser/estar) é um dos mais importantes do inglês, porque ele muda de acordo com o pronome. Usamos 'am' com 'I', 'is' com 'he/she/it' (ou nomes no singular) e 'are' com 'you/we/they' (ou nomes no plural). Ele serve para descrever quem somos, como estamos e onde estamos. No dia a dia, é muito comum usar a forma contraída: I'm, you're, he's, she's, it's, we're, they're.",
    examples: [
      "I am happy. — Eu estou feliz.",
      "She is a teacher. — Ela é uma professora.",
      "They are my friends. — Eles são meus amigos.",
      "We are at home. — Nós estamos em casa.",
      "It is cold today. — Está frio hoje.",
    ],
    xpReward: 25,
    exercises: [
      {
        id: "gtb_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: 'I ___ ten years old.'",
        options: ["am", "is", "are", "be"],
        correctAnswer: "am",
        characterHint: "Chico",
        hintText: "Au au! Sempre usamos 'am' junto com o pronome 'I'!",
      },
      {
        id: "gtb_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: 'She ___ my sister.'",
        options: ["am", "is", "are", "be"],
        correctAnswer: "is",
        characterHint: "Bia",
        hintText: "'She' é a terceira pessoa do singular, então usamos 'is'.",
      },
      {
        id: "gtb_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: 'We ___ students.'",
        options: ["am", "is", "are", "be"],
        correctAnswer: "are",
        characterHint: "Lico",
        hintText: "'We' é plural, então a forma correta é 'are'.",
      },
      {
        id: "gtb_q4",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Ele é muito legal.'",
        options: ["He", "is", "very", "nice", "am", "are"],
        correctAnswer: ["He", "is", "very", "nice"],
        characterHint: "Max",
        hintText: "'He' pede 'is'! Depois vem o advérbio 'very' e o adjetivo 'nice'.",
      },
      {
        id: "gtb_q5",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é a forma contraída correta de 'They are'?",
        options: ["They's", "They're", "The'are", "Their"],
        correctAnswer: "They're",
        characterHint: "Chico",
        hintText: "Juntamos 'They' + 'are' cortando o 'a' e colocando um apóstrofo!",
      },
      {
        id: "gtb_q6",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: 'The books ___ on the table.'",
        options: ["is", "am", "are", "be"],
        correctAnswer: "are",
        characterHint: "Bia",
        hintText: "'Books' está no plural, então o verbo também fica no plural: 'are'.",
      },
    ],
  },

  // ==========================================================================
  // 2. PRONOMES PESSOAIS E POSSESSIVOS
  // ==========================================================================
  {
    id: "grammar_pronomes",
    topic: "Pronomes Pessoais e Possessivos",
    explanation:
      "Pronomes pessoais (I, you, he, she, it, we, they) substituem o nome de uma pessoa ou coisa que já foi mencionada, evitando repetição. Já os pronomes possessivos (my, your, his, her, its, our, their) indicam posse — eles vêm antes de um substantivo para dizer de quem é aquele objeto. Repare que 'his' se refere a algo de um homem, 'her' de uma mulher, e 'its' é usado para objetos, animais ou coisas sem gênero definido.",
    examples: [
      "I love my dog. — Eu amo meu cachorro.",
      "He lost his phone. — Ele perdeu o celular dele.",
      "She is wearing her jacket. — Ela está usando o casaco dela.",
      "We visited our grandmother. — Nós visitamos nossa avó.",
      "The cat is chasing its tail. — O gato está perseguindo o próprio rabo.",
    ],
    xpReward: 25,
    exercises: [
      {
        id: "gpr_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual pronome possessivo se refere a algo pertencente a um homem?",
        options: ["her", "his", "its", "their"],
        correctAnswer: "his",
        characterHint: "Lico",
        hintText: "'His' é usado quando o dono do objeto é do gênero masculino.",
      },
      {
        id: "gpr_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: 'This is ___ car.' (o carro pertence a mim)",
        options: ["I", "me", "my", "mine is"],
        correctAnswer: "my",
        characterHint: "Chico",
        hintText: "Antes de um substantivo, usamos 'my' para indicar posse: 'my car'.",
      },
      {
        id: "gpr_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Nós amamos nossos pais.'",
        options: ["We", "love", "our", "parents", "their", "us"],
        correctAnswer: ["We", "love", "our", "parents"],
        characterHint: "Max",
        hintText: "'We' (nós) pede o possessivo 'our' (nosso/nossa) antes de 'parents'.",
      },
      {
        id: "gpr_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual pronome pessoal substitui corretamente 'Maria and John' (eles)?",
        options: ["It", "She", "They", "We"],
        correctAnswer: "They",
        characterHint: "Bia",
        hintText: "Quando falamos de duas ou mais pessoas, usamos 'they'.",
      },
      {
        id: "gpr_q5",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: 'The dog is wagging ___ tail.' (o próprio rabo)",
        options: ["his", "her", "its", "your"],
        correctAnswer: "its",
        characterHint: "Chico",
        hintText: "Au au! Para animais e objetos, o certo é 'its', sem apóstrofo!",
      },
      {
        id: "gpr_q6",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Complete: '___ is my best friend.' (Ela)",
        options: ["Her", "She", "Hers", "She's"],
        correctAnswer: "She",
        characterHint: "Lico",
        hintText: "No início da frase, como sujeito, usamos 'She' e não 'Her'.",
      },
    ],
  },

  // ==========================================================================
  // 3. SUBSTANTIVOS: SINGULAR E PLURAL
  // ==========================================================================
  {
    id: "grammar_substantivos",
    topic: "Substantivos: Singular e Plural",
    explanation:
      "Na maioria das vezes, para formar o plural em inglês, basta adicionar '-s' ao final da palavra (book → books). Quando a palavra termina em -s, -ss, -sh, -ch, -x ou -z, adicionamos '-es' (box → boxes, watch → watches). Palavras terminadas em consoante + 'y' trocam o 'y' por '-ies' (baby → babies). E existem também os plurais irregulares, que não seguem nenhuma regra e precisam ser decorados (child → children, man → men, foot → feet).",
    examples: [
      "One book, two books. — Um livro, dois livros.",
      "One box, two boxes. — Uma caixa, duas caixas.",
      "One baby, two babies. — Um bebê, dois bebês.",
      "One child, two children. — Uma criança, duas crianças.",
      "One mouse, two mice. — Um rato, dois ratos.",
    ],
    xpReward: 25,
    exercises: [
      {
        id: "gsu_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é o plural correto de 'dog'?",
        options: ["dogs", "doges", "dogies", "dogs's"],
        correctAnswer: "dogs",
        characterHint: "Chico",
        hintText: "Au au! A maioria das palavras só precisa de um '-s' no final!",
      },
      {
        id: "gsu_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é o plural correto de 'watch' (relógio)?",
        options: ["watchs", "watches", "watchies", "watchs's"],
        correctAnswer: "watches",
        characterHint: "Bia",
        hintText: "Palavras terminadas em 'ch' recebem '-es' no plural!",
      },
      {
        id: "gsu_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é o plural correto de 'city' (cidade)?",
        options: ["citys", "cityes", "cities", "citties"],
        correctAnswer: "cities",
        characterHint: "Lico",
        hintText: "Consoante + 'y' vira '-ies': troque o 'y' e adicione 'ies'!",
      },
      {
        id: "gsu_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é o plural IRREGULAR de 'child' (criança)?",
        options: ["childs", "childes", "children", "childies"],
        correctAnswer: "children",
        characterHint: "Max",
        hintText: "Este é um plural irregular famoso — precisa ser decorado!",
      },
      {
        id: "gsu_q5",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Eu tenho dois pés.' (feet)",
        options: ["I", "have", "two", "feet", "foot", "foots"],
        correctAnswer: ["I", "have", "two", "feet"],
        characterHint: "Bia",
        hintText: "'Foot' (pé) no plural vira 'feet' — outro plural irregular!",
      },
      {
        id: "gsu_q6",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é o plural correto de 'box' (caixa)?",
        options: ["boxs", "boxes", "boxies", "box's"],
        correctAnswer: "boxes",
        characterHint: "Chico",
        hintText: "Palavras terminadas em 'x' também recebem '-es' no plural!",
      },
    ],
  },

  // ==========================================================================
  // PRÓXIMOS TÓPICOS (Lote 2 em diante — placeholders)
  // ==========================================================================
  // 4. Artigos (a, an, the)
  // 5. Presente Simples (afirmativa, negativa, interrogativa)
  // 6. Verbos de Ação Básicos
  // 7. Adjetivos e Ordem na Frase
  // 8. Preposições de Lugar (in, on, at)
  // 9. Perguntas com WH (what, where, who, when, why, how)
  // 10. Presente Contínuo (-ing)
];
