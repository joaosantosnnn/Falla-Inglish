import { Course } from '../types';

export const fallbackCourses: Course[] = [
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
                type: "multiple-choice" as any,
                prompt: "Como se diz 'Olá' em inglês?",
                options: ["Goodbye", "Thank you", "Hello", "Please"],
                correctAnswer: "Hello",
                characterHint: "Lico",
                hintText: "Eu sou o Livro Lico! Essa palavra é usada no mundo todo para cumprimentar as pessoas!"
              },
              {
                id: "q_en_2",
                type: "sentence-builder" as any,
                prompt: "Monte a frase: 'Eu sou um menino'",
                options: ["boy", "am", "I", "a", "girl"],
                correctAnswer: ["I", "am", "a", "boy"],
                characterHint: "Guga",
                hintText: "Oi, eu sou o Guga! Monte a frase começando pelo sujeito 'I' (Eu)!"
              },
              {
                id: "q_en_3",
                type: "match-pairs" as any,
                prompt: "Combine as traduções corretas:",
                options: ["Please", "Por favor", "Thank you", "Obrigado", "Goodbye", "Adeus"],
                correctAnswer: ["Please:Por favor", "Thank you:Obrigado", "Goodbye:Adeus"],
                characterHint: "Teddy",
                hintText: "Sempre seja educado, amiguinho! Teddy aprova a cortesia!"
              },
              {
                id: "q_en_4",
                type: "speak-sim" as any,
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
                type: "multiple-choice" as any,
                prompt: "Qual é a pergunta correta para saber o nome de alguém?",
                options: ["How old are you?", "What is your name?", "Where are you from?", "Who are you?"],
                correctAnswer: "What is your name?",
                characterHint: "Bia",
                hintText: "Bia aqui! 'Name' significa nome em inglês. Bem óbvio, né?"
              },
              {
                id: "q_en_6",
                type: "sentence-builder" as any,
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
                type: "multiple-choice" as any,
                prompt: "Qual cor representa 'Rojo' em espanhol?",
                options: ["Azul", "Amarelo", "Vermelho", "Verde"],
                correctAnswer: "Vermelho",
                characterHint: "Pip",
                hintText: "Eu sou o Lápis Pip! Rojo é a cor do morango e do tomate!"
              },
              {
                id: "q_es_2",
                type: "sentence-builder" as any,
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
                type: "multiple-choice" as any,
                prompt: "O que significa 'Tudo bem' em português?",
                options: ["What is your name?", "How are you?", "Excuse me", "Welcome"],
                correctAnswer: "How are you?",
                characterHint: "Pingo",
                hintText: "Pingo aqui! No Brasil, 'Tudo bem?' é usado para absolutamente qualquer encontro!"
              },
              {
                id: "q_pt_2",
                type: "sentence-builder" as any,
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
