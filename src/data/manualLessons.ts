import { Lesson, QuestionType } from '../types';

/**
 * ============================================================================
 * FALLA APP - CONTEÚDO DE LIÇÕES MANUAIS (50 TEMAS PLANEJADOS)
 * ============================================================================
 * MÓDULO 1: Cotidiano / Básico (Lições 1 a 10) - COMPLETAS & PRONTAS PARA REVISÃO
 * MÓDULOS 2 a 8: (Lições 11 a 50) - ESTRUTURA PLANEJADA COM COMENTÁRIOS E PLACEHOLDERS
 * ============================================================================
 */

export const MANUAL_LESSONS: Lesson[] = [
  // ==========================================================================
  // CATEGORIA 1: COTIDIANO / BÁSICO (Lições 1 a 10 - Completas)
  // ==========================================================================

  // 1. Se apresentando (nome, idade, onde mora)
  {
    id: "cotidiano_apresentacao",
    title: "Se Apresentando",
    description: "Aprenda a dizer seu nome, idade e onde mora!",
    xpReward: 20,
    questions: [
      {
        id: "cap_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'Meu nome é John' em inglês?",
        options: ["My name are John", "My name is John", "I call me John", "Mine name is John"],
        correctAnswer: "My name is John",
        characterHint: "Chico",
        hintText: "Au au! O Chico Yorkshire ensina: usamos 'My name is...' para nos apresentarmos! É como eu latir para dizer quem sou!"
      },
      {
        id: "cap_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'Eu moro no Brasil.'",
        options: ["live", "Brazil", "I", "in", "on", "at"],
        correctAnswer: ["I", "live", "in", "Brazil"],
        characterHint: "Bia",
        hintText: "Lembre-se de usar a preposição 'in' antes do nome de países!"
      },
      {
        id: "cap_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Se alguém pergunta 'How old are you?', o que ela quer saber?",
        options: ["De onde você é", "Como você está", "Sua idade", "Qual seu nome"],
        correctAnswer: "Sua idade",
        characterHint: "Chico",
        hintText: "O Chico Yorkshire quer saber: 'How old are you?' pergunta sua idade em anos humanos!"
      },
      {
        id: "cap_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual é a forma correta e mais comum de dizer 'Eu tenho 10 anos' em inglês?",
        options: ["I have 10 years", "I am 10 years old", "I am with 10 years", "I do 10 years"],
        correctAnswer: "I am 10 years old",
        characterHint: "Lico",
        hintText: "Em inglês, nós 'somos' nossa idade! Usamos o verbo 'to be' (I am)."
      }
    ]
  },

  // 2. Cumprimentos e despedidas
  {
    id: "cotidiano_cumprimentos",
    title: "Cumprimentos",
    description: "Saudações essenciais para o dia a dia!",
    xpReward: 20,
    questions: [
      {
        id: "cc_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'Bom dia' em inglês?",
        options: ["Good morning", "Good afternoon", "Good evening", "Good night"],
        correctAnswer: "Good morning",
        characterHint: "Bia",
        hintText: "'Morning' significa manhã! Usamos 'Good morning' logo cedo."
      },
      {
        id: "cc_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual palavra significa 'Tchau' ou 'Adeus' de forma amigável?",
        options: ["Hello", "Please", "Goodbye", "Welcome"],
        correctAnswer: "Goodbye",
        characterHint: "Chico",
        hintText: "Au au! 'Goodbye' ou apenas 'Bye' é perfeito para quando vou correr no jardim atrás da bolinha rosa!"
      },
      {
        id: "cc_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase: 'Olá, como vai você?'",
        options: ["are", "Hello", "how", "you", "good", "doing"],
        correctAnswer: ["Hello", "how", "are", "you"],
        characterHint: "Lico",
        hintText: "Comece com a saudação 'Hello' e monte a pergunta padrão!"
      },
      {
        id: "cc_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "O que significa a expressão 'Nice to meet you'?",
        options: ["Prazer em conhecer você", "Bom te ver novamente", "Como vai sua família", "Tenha um bom dia"],
        correctAnswer: "Prazer em conhecer você",
        characterHint: "Bia",
        hintText: "Dizemos isso quando conhecemos alguém pela primeira vez!"
      }
    ]
  },

  // 3. Números e horas
  {
    id: "cotidiano_numeros_horas",
    title: "Números e Horas",
    description: "Aprenda a contar e a perguntar as horas.",
    xpReward: 20,
    questions: [
      {
        id: "cnh_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual número em inglês vem logo após o número 'nine' (9)?",
        options: ["eight", "seven", "ten", "eleven"],
        correctAnswer: "ten",
        characterHint: "Max",
        hintText: "Conte comigo: one, two, three, four, five, six, seven, eight, nine..."
      },
      {
        id: "cnh_q2",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'São duas horas.'",
        options: ["two", "It", "is", "o'clock", "time", "hours"],
        correctAnswer: ["It", "is", "two", "o'clock"],
        characterHint: "Lico",
        hintText: "Usamos 'It is' ou 'It's' para indicar horas exatas com 'o'clock'."
      },
      {
        id: "cnh_q3",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se pergunta 'Que horas são?' em inglês?",
        options: ["What hour is it?", "What time is it?", "Which time is?", "How much time?"],
        correctAnswer: "What time is it?",
        characterHint: "Bia",
        hintText: "Esta é a pergunta clássica e universal para as horas!"
      },
      {
        id: "cnh_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Se você somar 'three' (3) + 'four' (4), qual o resultado por extenso?",
        options: ["six", "seven", "eight", "five"],
        correctAnswer: "seven",
        characterHint: "Max",
        hintText: "Basta contar 3 + 4 e traduzir o resultado 7 para o inglês."
      }
    ]
  },

  // 4. Dias da semana e meses
  {
    id: "cotidiano_dias_meses",
    title: "Dias e Meses",
    description: "Organize sua agenda e calendário.",
    xpReward: 20,
    questions: [
      {
        id: "cdm_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual o primeiro dia útil da semana (Segunda-feira) em inglês?",
        options: ["Sunday", "Monday", "Tuesday", "Wednesday"],
        correctAnswer: "Monday",
        characterHint: "Lico",
        hintText: "Começa com a letra M! 'Sunday' é o domingo."
      },
      {
        id: "cdm_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se escreve o mês de 'Janeiro' em inglês?",
        options: ["January", "June", "July", "February"],
        correctAnswer: "January",
        characterHint: "Bia",
        hintText: "É o primeiro mês do ano e tem uma escrita parecida com o português!"
      },
      {
        id: "cdm_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'Hoje é sábado.'",
        options: ["is", "Today", "Saturday", "Sunday", "day", "on"],
        correctAnswer: ["Today", "is", "Saturday"],
        characterHint: "Max",
        hintText: "'Today' significa hoje! 'Saturday' é o nosso fim de semana."
      },
      {
        id: "cdm_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual dia da semana vem imediatamente depois de 'Thursday' (quinta-feira)?",
        options: ["Wednesday", "Friday", "Saturday", "Tuesday"],
        correctAnswer: "Friday",
        characterHint: "Lico",
        hintText: "É a famosa sexta-feira! Dia de curtir o início do final de semana."
      }
    ]
  },

  // 5. Cores e formas
  {
    id: "cotidiano_cores_formas",
    title: "Cores e Formas",
    description: "Descreva o mundo ao seu redor colorindo-o.",
    xpReward: 20,
    questions: [
      {
        id: "ccf_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual a cor de uma maçã madura comum?",
        options: ["Blue", "Yellow", "Red", "Green"],
        correctAnswer: "Red",
        characterHint: "Bia",
        hintText: "Pense no vermelho! 'Red' é a cor clássica da maçã."
      },
      {
        id: "ccf_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "O que significa a palavra 'Blue'?",
        options: ["Verde", "Azul", "Amarelo", "Roxo"],
        correctAnswer: "Azul",
        characterHint: "Max",
        hintText: "É a cor do céu em um lindo dia limpo e ensolarado!"
      },
      {
        id: "ccf_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'A bola é amarela.'",
        options: ["ball", "The", "is", "yellow", "blue", "green"],
        correctAnswer: ["The", "ball", "is", "yellow"],
        characterHint: "Lico",
        hintText: "Lembre que 'yellow' significa amarela!"
      },
      {
        id: "ccf_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz a forma geométrica 'quadrado' em inglês?",
        options: ["Circle", "Triangle", "Square", "Rectangle"],
        correctAnswer: "Square",
        characterHint: "Bia",
        hintText: "Tem quatro lados iguais! Chamamos de 'Square'."
      }
    ]
  },

  // 6. A família
  {
    id: "cotidiano_familia",
    title: "A Família",
    description: "Aprenda a falar sobre seus pais, irmãos e parentes.",
    xpReward: 20,
    questions: [
      {
        id: "cf_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'mãe' de forma respeitosa em inglês?",
        options: ["Father", "Sister", "Mother", "Brother"],
        correctAnswer: "Mother",
        characterHint: "Max",
        hintText: "'Mother' é o termo formal para mãe. De forma carinhosa, dizemos 'Mom'."
      },
      {
        id: "cf_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Quem é o pai do seu pai (seu avô)?",
        options: ["Grandmother", "Grandfather", "Uncle", "Cousin"],
        correctAnswer: "Grandfather",
        characterHint: "Lico",
        hintText: "Adicionamos 'Grand' antes de 'father' para significar avô!"
      },
      {
        id: "cf_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'Eu amo minha família.'",
        options: ["love", "my", "I", "family", "like", "father"],
        correctAnswer: ["I", "love", "my", "family"],
        characterHint: "Bia",
        hintText: "O pronome 'I' (Eu) sempre vem antes do verbo 'love'."
      },
      {
        id: "cf_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "O que significa a palavra 'Brother'?",
        options: ["Irmão", "Irmã", "Tio", "Primo"],
        correctAnswer: "Irmão",
        characterHint: "Max",
        hintText: "Refere-se ao filho do seu pai e da sua mãe! Irmã é 'Sister'."
      }
    ]
  },

  // 7. Descrevendo o clima
  {
    id: "cotidiano_clima",
    title: "Descrevendo o Clima",
    description: "Está sol ou está chovendo? Aprenda a responder.",
    xpReward: 20,
    questions: [
      {
        id: "ccl_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'Está ensolarado' em inglês?",
        options: ["It is cloudy", "It is sunny", "It is raining", "It is windy"],
        correctAnswer: "It is sunny",
        characterHint: "Lico",
        hintText: "Vem da palavra 'Sun' (Sol)! Adicionamos 'ny' para virar ensolarado."
      },
      {
        id: "ccl_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "O que significa a palavra climática 'Rainy'?",
        options: ["Ensolarado", "Ventando", "Chuvoso", "Nevando"],
        correctAnswer: "Chuvoso",
        characterHint: "Bia",
        hintText: "Pense na palavra 'Rain' (chuva)!"
      },
      {
        id: "ccl_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'Está muito frio hoje.'",
        options: ["cold", "It", "is", "very", "today", "hot", "warm"],
        correctAnswer: ["It", "is", "very", "cold", "today"],
        characterHint: "Max",
        hintText: "'Cold' é frio, 'very' é muito! Junte tudo."
      },
      {
        id: "ccl_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual palavra em inglês significa 'neve'?",
        options: ["Rain", "Snow", "Wind", "Cloud"],
        correctAnswer: "Snow",
        characterHint: "Lico",
        hintText: "Branco e gelado! Lembra o boneco de neve ('Snowman')."
      }
    ]
  },

  // 8. Roupas do dia a dia
  {
    id: "cotidiano_roupas",
    title: "Roupas e Estilo",
    description: "Aprenda os nomes das vestimentas em inglês.",
    xpReward: 20,
    questions: [
      {
        id: "cr_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'camiseta' em inglês?",
        options: ["Pants", "Dress", "T-shirt", "Shoes"],
        correctAnswer: "T-shirt",
        characterHint: "Bia",
        hintText: "Chama-se assim pelo formato da roupa em 'T'!"
      },
      {
        id: "cr_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "O que costumamos calçar nos pés antes dos sapatos?",
        options: ["Socks", "Gloves", "Hat", "Scarfs"],
        correctAnswer: "Socks",
        characterHint: "Max",
        hintText: "São as meias! Mantêm nossos pés aquecidos."
      },
      {
        id: "cr_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'Eu uso calças azuis.'",
        options: ["blue", "I", "wear", "pants", "shirt", "red"],
        correctAnswer: ["I", "wear", "blue", "pants"],
        characterHint: "Lico",
        hintText: "Em inglês, a cor (adjetivo) vem antes da roupa (substantivo)!"
      },
      {
        id: "cr_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'chapéu' em inglês?",
        options: ["Cap", "Hat", "Belt", "Coat"],
        correctAnswer: "Hat",
        characterHint: "Bia",
        hintText: "Uma palavra bem curta de 3 letras que começa com H!"
      }
    ]
  },

  // 9. Objetos da casa
  {
    id: "cotidiano_casa",
    title: "Objetos da Casa",
    description: "Móveis e utensílios do seu lar.",
    xpReward: 20,
    questions: [
      {
        id: "cca_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'mesa' em inglês?",
        options: ["Chair", "Table", "Door", "Wall"],
        correctAnswer: "Table",
        characterHint: "Max",
        hintText: "Lembre-se do meme: 'The book is on the table'."
      },
      {
        id: "cca_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Onde costumamos dormir confortavelmente à noite?",
        options: ["Sofa", "Bed", "Fridge", "Sink"],
        correctAnswer: "Bed",
        characterHint: "Lico",
        hintText: "Significa cama! Uma palavra curta de 3 letras."
      },
      {
        id: "cca_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'A chave está na mesa.'",
        options: ["is", "The", "key", "on", "the", "table", "under"],
        correctAnswer: ["The", "key", "is", "on", "the", "table"],
        characterHint: "Bia",
        hintText: "'Key' é chave e 'on the table' significa em cima da mesa!"
      },
      {
        id: "cca_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "O que significa a palavra 'Window' em português?",
        options: ["Porta", "Janela", "Parede", "Teto"],
        correctAnswer: "Janela",
        characterHint: "Max",
        hintText: "De onde podemos olhar para fora da casa. Lembra o sistema operacional!"
      }
    ]
  },

  // 10. Rotina diária
  {
    id: "cotidiano_rotina",
    title: "Rotina Diária",
    description: "Ações cotidianas desde o amanhecer.",
    xpReward: 20,
    questions: [
      {
        id: "cro_q1",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "O que significa a expressão 'wake up'?",
        options: ["Dormir", "Acordar", "Comer", "Trabalhar"],
        correctAnswer: "Acordar",
        characterHint: "Lico",
        hintText: "É o primeiro ato do dia ao abrir os olhos de manhã!"
      },
      {
        id: "cro_q2",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Como se diz 'escovar os dentes' em inglês?",
        options: ["Wash your hands", "Brush your teeth", "Take a shower", "Comb your hair"],
        correctAnswer: "Brush your teeth",
        characterHint: "Bia",
        hintText: "'Brush' é escovar e 'teeth' são dentes!"
      },
      {
        id: "cro_q3",
        type: QuestionType.SENTENCE_BUILDER,
        prompt: "Monte a frase correspondente: 'Eu vou para a escola.'",
        options: ["go", "I", "to", "school", "the", "house", "work"],
        correctAnswer: ["I", "go", "to", "school"],
        characterHint: "Max",
        hintText: "'School' significa escola. Junte o pronome 'I' e o verbo 'go'."
      },
      {
        id: "cro_q4",
        type: QuestionType.MULTIPLE_CHOICE,
        prompt: "Qual ação significa 'tomar café da manhã'?",
        options: ["Eat lunch", "Eat dinner", "Eat breakfast", "Eat snacks"],
        correctAnswer: "Eat breakfast",
        characterHint: "Lico",
        hintText: "'Breakfast' é a primeira refeição do dia, rompendo o jejum da noite!"
      }
    ]
  },

  // ==========================================================================
  // CATEGORIA 2: COMIDA E COMPRAS (Lições 11 a 18 - Próximos Lotes / Placeholders)
  // ==========================================================================
  // 11. Pedindo comida em um restaurante
  // 12. Um dia no shopping
  // 13. No supermercado
  // 14. Café da manhã, almoço e jantar
  // 15. Alergias e restrições alimentares
  // 16. Perguntando o preço de algo
  // 17. Pagando a conta
  // 18. Delivery de comida pelo celular

  // ==========================================================================
  // CATEGORIA 3: VIAGENS E LUGARES (Lições 19 a 26 - Próximos Lotes / Placeholders)
  // ==========================================================================
  // 19. No aeroporto
  // 20. Fazendo check-in em um hotel
  // 21. Pedindo informações na rua
  // 22. Alugando um carro
  // 23. Na estação de trem/metrô
  // 24. Perdido em uma cidade nova
  // 25. Tirando fotos de turista
  // 26. Comprando passagem de ônibus

  // ==========================================================================
  // CATEGORIA 4: TRABALHO E ESTUDOS (Lições 27 a 33 - Próximos Lotes / Placeholders)
  // ==========================================================================
  // 27. Apresentações em uma reunião
  // 28. Enviando um e-mail profissional
  // 29. Entrevista de emprego
  // 30. Na sala de aula
  // 31. Trabalho em equipe
  // 32. Fazendo uma ligação de trabalho
  // 33. Currículo e experiência profissional

  // ==========================================================================
  // CATEGORIA 5: SAÚDE E EMERGÊNCIAS (Lições 34 a 38 - Próximos Lotes / Placeholders)
  // ==========================================================================
  // 34. No consultório médico
  // 35. Na farmácia
  // 36. Descrevendo sintomas
  // 37. Chamando uma ambulância
  // 38. Marcando uma consulta

  // ==========================================================================
  // CATEGORIA 6: LAZER E SOCIAL (Lições 39 a 45 - Próximos Lotes / Placeholders)
  // ==========================================================================
  // 39. Jogando futebol no parque
  // 40. Assistindo a um filme
  // 41. Fazendo planos com amigos
  // 42. Em uma festa de aniversário
  // 43. Hobbies e passatempos
  // 44. Esportes e exercícios
  // 45. Música e shows

  // ==========================================================================
  // CATEGORIA 7: TECNOLOGIA E COMUNICAÇÃO (Lições 46 a 49 - Próximos Lotes / Placeholders)
  // ==========================================================================
  // 46. Configurando um novo celular
  // 47. Marcando uma videochamada
  // 48. Redes sociais e mensagens
  // 49. Problemas com internet/wifi

  // ==========================================================================
  // CATEGORIA 8: DIVERSOS (Lição 50 - Próximo Lote / Placeholder)
  // ==========================================================================
  // 50. Uma viagem espacial (tema lúdico/imaginativo)
];
