/*
 * content.js — all the learning material (except the placement questions).
 *
 * Everything lives in one global object: window.SU_CONTENT.
 * To add more material, just add items to these lists — the app reads them
 * automatically. No build step needed.
 */
window.SU_CONTENT = {

  /* ---------------------------------------------------------------
   * 1. READ-ALOUD & SHADOWING SENTENCES, grouped by CEFR level.
   *    Many contain "th", "h", "v" and word endings on purpose,
   *    because these are hard for French and Arabic speakers.
   * --------------------------------------------------------------- */
  sentences: {
    A1: [
      "Hello, how are you today?",
      "My brother has a very old car.",
      "I think this is the right house.",
      "We have breakfast at seven every morning.",
      "Her sister lives in a big city.",
      "Thank you very much for your help.",
      "The bus leaves at half past three.",
      "He likes to watch videos in the evening."
    ],
    A2: [
      "Last weekend we visited my grandparents in the village.",
      "I usually walk to work, but today I took the bus.",
      "There are three things I need from the shop.",
      "She wanted to buy a new phone, but it was too expensive.",
      "We're going to have a party on Thursday evening.",
      "He hurt his hand while he was playing football.",
      "Could you open the window, please? It's very hot in here.",
      "I've never been to London, but I'd love to go."
    ],
    B1: [
      "I've been learning English for about five years now.",
      "If I have enough time this weekend, I'll finish the book.",
      "The thing I enjoy most about my job is meeting new people.",
      "Honestly, I think we should leave a bit earlier to avoid the traffic.",
      "She told me that she had already seen the film twice.",
      "I'm not very good at cooking, but I'm trying to improve.",
      "We were supposed to meet at eight, but he never turned up.",
      "Whatever happens, I'll be there to help you."
    ],
    B2: [
      "Although the weather was awful, we had a fantastic holiday.",
      "I wish I had studied harder when I was at university.",
      "There's no doubt that technology has changed the way we work.",
      "If I'd known about the problem earlier, I would have fixed it.",
      "It's worth thinking about the long-term effects of this decision.",
      "I'm used to working under pressure, so deadlines don't bother me.",
      "Having said that, there are a few things we could do better.",
      "The village was so quiet that you could hear the river from the hotel."
    ],
    C1: [
      "The thing is, there's no straightforward answer to that question.",
      "Not only did they miss the deadline, but they also went over budget.",
      "What really matters is how we deal with the consequences.",
      "I'd argue that the benefits clearly outweigh the drawbacks.",
      "It's highly unlikely that the government will change its position.",
      "Had we known about the delay, we would have rearranged the meeting.",
      "To some extent, I think both sides have a valid point.",
      "Whether we like it or not, artificial intelligence is here to stay."
    ],
    C2: [
      "Notwithstanding the obvious drawbacks, the theory has proved remarkably resilient.",
      "Little did they realise how thoroughly the evidence would undermine their argument.",
      "It's worth bearing in mind that these assumptions have never been properly tested.",
      "The authorities have been somewhat reluctant to acknowledge the extent of the problem.",
      "Were it not for her persistence, the whole project would have fallen apart.",
      "His reasoning, while superficially convincing, doesn't withstand close scrutiny.",
      "The overwhelming majority of those surveyed were vehemently opposed to the change.",
      "There's a world of difference between hearing something and truly understanding it."
    ]
  },

  /* ---------------------------------------------------------------
   * 2. "ANSWER FAST" QUESTIONS. band: easy / medium / hard / expert
   * --------------------------------------------------------------- */
  fastQuestions: [
    { band: "easy", q: "What did you do last weekend?" },
    { band: "easy", q: "What's your favourite food, and why?" },
    { band: "easy", q: "Can you describe your home?" },
    { band: "easy", q: "What do you usually do in the morning?" },
    { band: "easy", q: "Tell me about your best friend." },
    { band: "easy", q: "What did you eat yesterday?" },
    { band: "easy", q: "Where would you like to travel, and why?" },
    { band: "easy", q: "What do you like doing in your free time?" },
    { band: "medium", q: "What's the best film or series you've seen recently?" },
    { band: "medium", q: "Describe a skill you'd like to learn, and explain why." },
    { band: "medium", q: "What do you like and dislike about your job or studies?" },
    { band: "medium", q: "Tell me about a place that is special to you." },
    { band: "medium", q: "What would you do with a completely free day?" },
    { band: "medium", q: "Describe a person who has influenced you." },
    { band: "medium", q: "How has your town or city changed in the last ten years?" },
    { band: "medium", q: "Tell me about a time you had to solve a difficult problem." },
    { band: "hard", q: "Is it better to live in a big city or in the countryside?" },
    { band: "hard", q: "Should university education be free for everyone?" },
    { band: "hard", q: "How has technology changed the way people make friends?" },
    { band: "hard", q: "What makes a good leader?" },
    { band: "hard", q: "Should people work four days a week instead of five?" },
    { band: "hard", q: "Do you think artificial intelligence will take people's jobs?" },
    { band: "hard", q: "Is it important for young people to learn history? Why?" },
    { band: "hard", q: "What's the biggest challenge facing your country right now?" },
    { band: "expert", q: "To what extent should governments control the internet?" },
    { band: "expert", q: "Is mass tourism good or bad for local communities?" },
    { band: "expert", q: "Can money buy happiness? Defend your view." },
    { band: "expert", q: "Should we judge historical figures by today's values?" },
    { band: "expert", q: "Is it ever acceptable to break the law?" },
    { band: "expert", q: "How do you think cities will change over the next fifty years?" },
    { band: "expert", q: "Is ambition always a good thing?" },
    { band: "expert", q: "What responsibilities do rich countries have towards poorer ones?" }
  ],

  /* ---------------------------------------------------------------
   * 3. MINIMAL PAIRS — word pairs that differ by ONE sound.
   *    weakKey links a category to the weak-point tracker.
   * --------------------------------------------------------------- */
  minimalPairs: [
    {
      id: "th-s", title: "th /θ/ vs s", weakKey: "pron:th",
      tip: "Put the tip of your tongue lightly between your teeth and blow air. Don't say 's' (tongue behind the teeth) or 't'.",
      pairs: [["think","sink"],["thick","sick"],["thing","sing"],["path","pass"],["mouth","mouse"],["faith","face"],["thumb","sum"],["worth","worse"]]
    },
    {
      id: "th-z", title: "th /ð/ vs z / d", weakKey: "pron:th",
      tip: "Same tongue position as 'think', but switch your voice on (you should feel a buzz). Common in: the, this, they, there, then.",
      pairs: [["then","zen"],["breathe","breeze"],["clothing","closing"],["teethe","tease"],["they","day"],["those","doze"],["than","dan"],["though","dough"]]
    },
    {
      id: "i-ee", title: "short i /ɪ/ vs long ee /iː/", weakKey: "pron:i-ee",
      tip: "Short 'i' is relaxed and quick (ship). Long 'ee' is tense: smile and hold it longer (sheep). French and Arabic often only have the 'ee' sound.",
      pairs: [["ship","sheep"],["live","leave"],["fill","feel"],["bit","beat"],["sit","seat"],["hit","heat"],["chip","cheap"],["still","steal"]]
    },
    {
      id: "v-f", title: "v vs f", weakKey: "pron:v",
      tip: "Both use your top teeth on your bottom lip. For 'v' your voice is ON (buzz); for 'f' it's only air.",
      pairs: [["van","fan"],["very","ferry"],["vine","fine"],["leave","leaf"],["save","safe"],["vast","fast"],["vowel","foul"],["veil","fail"]]
    },
    {
      id: "p-b", title: "p vs b", weakKey: "pron:p-b",
      tip: "For 'p', push out a small puff of air (hold a paper in front of your mouth — it should move). For 'b' there's no puff and your voice is on. Very common for Arabic speakers.",
      pairs: [["pin","bin"],["pat","bat"],["pull","bull"],["cap","cab"],["pie","buy"],["pear","bear"],["pack","back"],["rope","robe"]]
    },
    {
      id: "h", title: "h at the start of words", weakKey: "pron:h",
      tip: "Breathe out like you're fogging a mirror: 'hhh'. French speakers often drop it (and sometimes add it where it doesn't belong!).",
      pairs: [["hair","air"],["heat","eat"],["hill","ill"],["hand","and"],["high","eye"],["hold","old"],["hate","eight"],["heart","art"]]
    },
    {
      id: "stress", title: "Word stress", weakKey: "pron:stress", type: "stress",
      tip: "English stresses ONE syllable strongly (louder, longer, higher) and reduces the others. French tends to stress the last syllable — English usually doesn't.",
      words: [
        { word: "photograph", syl: ["pho","to","graph"], stress: 0 },
        { word: "photographer", syl: ["pho","to","gra","pher"], stress: 1 },
        { word: "comfortable", syl: ["com","for","ta","ble"], stress: 0 },
        { word: "vegetable", syl: ["ve","ge","ta","ble"], stress: 0 },
        { word: "interesting", syl: ["in","te","re","sting"], stress: 0 },
        { word: "development", syl: ["de","ve","lop","ment"], stress: 1 },
        { word: "technology", syl: ["tech","no","lo","gy"], stress: 1 },
        { word: "economic", syl: ["e","co","no","mic"], stress: 2 },
        { word: "hotel", syl: ["ho","tel"], stress: 1 },
        { word: "important", syl: ["im","por","tant"], stress: 1 },
        { word: "necessary", syl: ["ne","ces","sa","ry"], stress: 0 },
        { word: "determine", syl: ["de","ter","mine"], stress: 1 },
        { word: "afternoon", syl: ["af","ter","noon"], stress: 2 },
        { word: "category", syl: ["ca","te","go","ry"], stress: 0 }
      ]
    }
  ],

  /* ---------------------------------------------------------------
   * 4. USEFUL PHRASES BANK — so you never freeze.
   * --------------------------------------------------------------- */
  phrases: [
    { id: "time", title: "Buying time (never freeze!)", icon: "⏳", items: [
      "Let me think for a second...", "That's a good question.", "Hmm, how can I put this?",
      "Well, let me see...", "I've never really thought about that, but...", "That's an interesting one.",
      "Off the top of my head, I'd say...", "It's hard to say, but..."
    ]},
    { id: "opinion", title: "Giving your opinion", icon: "💬", items: [
      "In my opinion,...", "Personally, I think...", "As far as I'm concerned,...", "If you ask me,...",
      "The way I see it,...", "I'm convinced that...", "I'd say that..."
    ]},
    { id: "adding", title: "Adding ideas", icon: "➕", items: [
      "On top of that,...", "What's more,...", "Not only that, but...", "Another thing is that...",
      "Besides,...", "And it's not just that..."
    ]},
    { id: "contrast", title: "Contrasting", icon: "⚖️", items: [
      "On the other hand,...", "Having said that,...", "That said,...", "Even so,...",
      "Then again,...", "The downside is that..."
    ]},
    { id: "examples", title: "Giving examples", icon: "🔎", items: [
      "For instance,...", "Take my brother, for example.", "A good example of this is...",
      "Let's say...", "Just to give you an idea,..."
    ]},
    { id: "clarify", title: "Clarifying & rephrasing", icon: "🔁", items: [
      "What I mean is...", "In other words,...", "Let me put it another way.",
      "To put it simply,...", "What I'm trying to say is...", "Sorry, what's the word... I mean..."
    ]},
    { id: "agree", title: "Agreeing & disagreeing", icon: "🤝", items: [
      "I couldn't agree more.", "That's a fair point, but...", "I see what you mean, but...",
      "I'm not so sure about that.", "I take your point.", "I see it a bit differently."
    ]},
    { id: "hedge", title: "Softening (C1 style)", icon: "🪶", items: [
      "It seems to me that...", "To some extent,...", "I might be wrong, but...",
      "Generally speaking,...", "There's a good chance that...", "It's fair to say that..."
    ]},
    { id: "conclude", title: "Concluding", icon: "🏁", items: [
      "All in all,...", "At the end of the day,...", "To sum up,...",
      "So basically,...", "Overall, I'd say...", "So that's why I think..."
    ]}
  ],

  /* ---------------------------------------------------------------
   * 5. LESSON UNITS. Each unit has 4 steps:
   *    vocab → grammar → listening → speaking.
   * --------------------------------------------------------------- */
  units: [
    {
      id: "a1-1", level: "A1", title: "Introducing yourself",
      vocab: [
        { word: "surname", def: "your family name", ex: "My surname is Benali." },
        { word: "nationality", def: "the country you belong to", ex: "What's your nationality? I'm French." },
        { word: "job", def: "the work you do to earn money", ex: "My job is very interesting." },
        { word: "hobby", def: "something you do for fun", ex: "My hobby is photography." },
        { word: "neighbour", def: "a person who lives next to you", ex: "My neighbour has a cat." },
        { word: "married", def: "having a husband or wife", ex: "Are you married?" }
      ],
      grammar: {
        title: "The verb 'to be' (am / is / are)",
        html: "<p>Use <b>am</b> with I, <b>is</b> with he/she/it, <b>are</b> with you/we/they.</p><p>Short forms: I'm, you're, he's, she's, it's, we're, they're.</p><p class='watch'>⚠️ French/Arabic speakers: don't add 'have' for age. Say <b>I am 25</b> (not <s>I have 25 years</s>).</p>",
        examples: ["I'm from Morocco.", "She is a doctor.", "They are my friends."],
        quiz: [
          { q: "I ___ 30 years old.", options: ["am", "have", "is", "are"], answer: 0 },
          { q: "My parents ___ teachers.", options: ["are", "is", "am", "be"], answer: 0 },
          { q: "___ she your sister?", options: ["Is", "Are", "Am", "Do"], answer: 0 }
        ]
      },
      listening: {
        text: "Hi! My name is Leila. I'm twenty-eight years old and I'm from Lyon, in France. I'm a nurse, so I work in a hospital. In my free time, I love cooking and swimming. My neighbour, Paul, is my best friend.",
        questions: [
          { q: "What is Leila's job?", options: ["She's a nurse", "She's a cook", "She's a teacher", "She's a swimmer"], answer: 0 },
          { q: "Who is Paul?", options: ["Her neighbour and best friend", "Her brother", "Her husband", "Her boss"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Introduce yourself: your name, where you're from, what you do, and what you like.",
        tips: ["Use 'I'm...' and 'I'm from...'", "Say your age with 'I am ... years old'", "Add one hobby: 'In my free time, I...'"]
      }
    },
    {
      id: "a1-2", level: "A1", title: "My daily routine",
      vocab: [
        { word: "wake up", def: "stop sleeping", ex: "I wake up at seven." },
        { word: "commute", def: "travel to work or school", ex: "My commute takes thirty minutes." },
        { word: "usually", def: "most of the time", ex: "I usually have tea in the morning." },
        { word: "never", def: "not at any time", ex: "She never drinks coffee." },
        { word: "weekend", def: "Saturday and Sunday", ex: "What do you do at the weekend?" },
        { word: "go to bed", def: "go to sleep at night", ex: "I go to bed at eleven." }
      ],
      grammar: {
        title: "Present simple: don't forget the -s!",
        html: "<p>Use the present simple for habits and routines.</p><p>With <b>he / she / it</b>, add <b>-s</b>: she work<b>s</b>, he watch<b>es</b>, it goe<b>s</b>.</p><p>Negatives and questions use <b>do / does</b>: She <b>doesn't</b> work. <b>Does</b> he drive?</p><p class='watch'>⚠️ The final -s is often dropped by French and Arabic speakers. Make it audible: <i>he likeSSS</i>.</p>",
        examples: ["She works in a bank.", "He doesn't like mornings.", "Does your brother play football?"],
        quiz: [
          { q: "My sister ___ in Paris.", options: ["lives", "live", "living", "is live"], answer: 0 },
          { q: "He ___ eat meat.", options: ["doesn't", "don't", "isn't", "not"], answer: 0 },
          { q: "___ your father work on Saturdays?", options: ["Does", "Do", "Is", "Has"], answer: 0 }
        ]
      },
      listening: {
        text: "Karim usually wakes up at six thirty. He has a quick breakfast and then he takes the train to work. His commute is about forty minutes, so he reads on the train. He finishes work at five, and he never works at the weekend.",
        questions: [
          { q: "How does Karim go to work?", options: ["By train", "By car", "By bus", "On foot"], answer: 0 },
          { q: "What does he do during his commute?", options: ["He reads", "He sleeps", "He eats breakfast", "He works"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Describe a typical day in your life, from morning to night.",
        tips: ["Use sequence words: first, then, after that, finally", "Use 'usually', 'always', 'sometimes'", "Remember the -s if you talk about someone else"]
      }
    },
    {
      id: "a2-1", level: "A2", title: "Last weekend",
      vocab: [
        { word: "relax", def: "rest and feel calm", ex: "On Sunday I just relaxed at home." },
        { word: "trip", def: "a short journey to a place", ex: "We went on a trip to the mountains." },
        { word: "delicious", def: "tasting very good", ex: "The food was delicious." },
        { word: "exhausted", def: "very, very tired", ex: "I was exhausted after the walk." },
        { word: "crowded", def: "full of people", ex: "The market was really crowded." },
        { word: "catch up with", def: "talk to someone you haven't seen for a while", ex: "I caught up with an old friend." }
      ],
      grammar: {
        title: "Past simple (regular & irregular)",
        html: "<p>Regular verbs add <b>-ed</b>: walk → walk<b>ed</b>, visit → visit<b>ed</b>.</p><p>Many common verbs are irregular: go → <b>went</b>, have → <b>had</b>, see → <b>saw</b>, eat → <b>ate</b>, take → <b>took</b>.</p><p>Negatives/questions: <b>didn't</b> + base verb. <i>I didn't go. Did you see it?</i></p><p class='watch'>⚠️ In speech, French speakers often use the present perfect for finished time (<s>I have seen him yesterday</s>). With <i>yesterday, last week, in 2020</i> → past simple.</p>",
        examples: ["We visited my aunt on Saturday.", "I didn't go out last night.", "Did you have a good weekend?"],
        quiz: [
          { q: "I ___ him yesterday.", options: ["saw", "have seen", "see", "seen"], answer: 0 },
          { q: "We ___ go to the party.", options: ["didn't", "don't", "weren't", "haven't"], answer: 0 },
          { q: "What ___ you do last night?", options: ["did", "do", "have", "were"], answer: 0 }
        ]
      },
      listening: {
        text: "Last Saturday, Emma went on a trip to the seaside with her cousins. The beach was crowded, but the weather was beautiful. They had fish and chips for lunch, which was delicious. In the evening they were exhausted, so they went to bed early.",
        questions: [
          { q: "Who did Emma go with?", options: ["Her cousins", "Her parents", "Her friends from work", "Nobody"], answer: 0 },
          { q: "Why did they go to bed early?", options: ["They were exhausted", "It was raining", "They were ill", "They had to work"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "What did you do last weekend? Give as many details as you can.",
        tips: ["Use past simple verbs (went, had, saw, met)", "Say how you felt: it was relaxing / exhausting", "Pronounce the -ed: visit-ID, play-D, walk-T"]
      }
    },
    {
      id: "a2-2", level: "A2", title: "Plans and the future",
      vocab: [
        { word: "plan", def: "something you have decided to do", ex: "Do you have any plans for the summer?" },
        { word: "book", def: "(verb) reserve a ticket, table or room", ex: "I've booked a table for eight." },
        { word: "probably", def: "very likely", ex: "I'll probably stay at home." },
        { word: "abroad", def: "in or to another country", ex: "She wants to study abroad." },
        { word: "look forward to", def: "feel happy about something in the future", ex: "I'm looking forward to the holidays." },
        { word: "save up", def: "keep money for something later", ex: "I'm saving up for a new laptop." }
      ],
      grammar: {
        title: "Going to vs will",
        html: "<p><b>Going to</b> = a plan you've already decided: <i>I'm going to visit Spain this summer.</i></p><p><b>Will</b> = a decision now, a promise, or a prediction: <i>I'll help you! It'll be fine.</i></p><p>Present continuous = arranged plans with a time: <i>I'm meeting Sara at 6.</i></p><p class='watch'>⚠️ Don't say <s>I will to go</s> — after will, use the base verb: <b>I will go</b>.</p>",
        examples: ["I'm going to learn to drive next year.", "The phone's ringing — I'll answer it!", "We're having dinner with my parents on Friday."],
        quiz: [
          { q: "I've decided: I ___ start a new course in September.", options: ["am going to", "will to", "going to", "am go to"], answer: 0 },
          { q: "\"It's cold in here.\" — \"I ___ close the window.\"", options: ["'ll", "'m going to", "go to", "am closing to"], answer: 0 },
          { q: "I think it ___ rain later.", options: ["will", "will to", "is go to", "goes to"], answer: 0 }
        ]
      },
      listening: {
        text: "Next year, Youssef is going to study abroad in Canada. He's already booked his flight for August. He's saving up money because life there is probably going to be expensive. He's a bit nervous, but he's really looking forward to it.",
        questions: [
          { q: "When is Youssef flying to Canada?", options: ["In August", "Next week", "In December", "He hasn't booked yet"], answer: 0 },
          { q: "Why is he saving money?", options: ["Life there will probably be expensive", "To buy a car", "To pay for his flight", "For a holiday"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "What are your plans for the next year? Talk about work, study, travel or personal goals.",
        tips: ["Use 'I'm going to...' for plans", "Use 'I'll probably...' for things you're not sure about", "Say why: '...because I want to...'"]
      }
    },
    {
      id: "b1-1", level: "B1", title: "Life experiences",
      vocab: [
        { word: "achievement", def: "something good you succeeded in doing", ex: "Passing that exam was a big achievement." },
        { word: "challenge", def: "something difficult that tests you", ex: "Moving abroad was a real challenge." },
        { word: "memorable", def: "easy to remember because it was special", ex: "It was a memorable trip." },
        { word: "opportunity", def: "a chance to do something", ex: "I've had the opportunity to work in London." },
        { word: "proud of", def: "happy about something you did", ex: "I'm proud of my progress." },
        { word: "so far", def: "until now", ex: "So far, I've visited six countries." }
      ],
      grammar: {
        title: "Present perfect vs past simple (+ since / for)",
        html: "<p><b>Present perfect</b> (have + past participle) = experience in your life, or something that continues until now: <i>I've been to Italy. I've lived here for 3 years.</i></p><p><b>Past simple</b> = finished time: <i>I went to Italy in 2019.</i></p><p><b>for</b> + a period (for two years) · <b>since</b> + a starting point (since 2020).</p><p class='watch'>⚠️ The 'depuis' trap: French <i>J'habite ici depuis 3 ans</i> = <b>I've lived here for 3 years</b>, NOT <s>I live here since 3 years</s>.</p>",
        examples: ["Have you ever eaten sushi?", "I've worked here since 2021.", "I met her two years ago."],
        quiz: [
          { q: "I ___ English for five years.", options: ["have studied", "study", "am studying", "studied since"], answer: 0 },
          { q: "She has lived in Rabat ___ 2018.", options: ["since", "for", "during", "from"], answer: 0 },
          { q: "\"Have you ever been to Japan?\" — \"Yes, I ___ there last year.\"", options: ["went", "have gone", "have been", "go"], answer: 0 }
        ]
      },
      listening: {
        text: "I've had quite a few challenges in my life so far, but the biggest one was moving to Dublin on my own. I'd never lived abroad before, and at first I found it really hard to understand people. I've been here for three years now, and I'm really proud of how much my English has improved.",
        questions: [
          { q: "What was the speaker's biggest challenge?", options: ["Moving to Dublin alone", "Finding a job", "Learning to drive", "Passing an exam"], answer: 0 },
          { q: "How long has the speaker lived in Dublin?", options: ["Three years", "Three months", "Since they were three", "One year"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Tell me about one of your biggest achievements, and something you've never done but would like to do.",
        tips: ["Use 'I've never... but I'd love to...'", "Use 'for' and 'since' correctly", "Explain how you felt: proud, nervous, relieved"]
      }
    },
    {
      id: "b1-2", level: "B1", title: "Work and study",
      vocab: [
        { word: "deadline", def: "the time by which something must be finished", ex: "The deadline is Friday." },
        { word: "colleague", def: "a person you work with", ex: "My colleagues are very helpful." },
        { word: "be responsible for", def: "have the job of dealing with something", ex: "I'm responsible for the website." },
        { word: "apply for", def: "officially ask for a job or place", ex: "She applied for a job in marketing." },
        { word: "skills", def: "things you are good at doing", ex: "This job requires good communication skills." },
        { word: "workload", def: "the amount of work you have", ex: "My workload is heavy this month." }
      ],
      grammar: {
        title: "First conditional & 'unless'",
        html: "<p><b>If + present, will + verb</b> = a real possibility in the future: <i>If I finish early, I'll call you.</i></p><p><b>Unless</b> = if not: <i>I'll miss the deadline unless I work this weekend.</i></p><p class='watch'>⚠️ Never use 'will' after 'if' in this structure: <s>If I will have time</s> → <b>If I have time</b>.</p>",
        examples: ["If I get the job, I'll move to Lyon.", "We won't finish on time unless we get help.", "If you need anything, just ask."],
        quiz: [
          { q: "If I ___ time tomorrow, I'll help you.", options: ["have", "will have", "had", "would have"], answer: 0 },
          { q: "You won't pass ___ you study more.", options: ["unless", "if", "except", "without"], answer: 0 },
          { q: "If she applies for the job, she ___ get it.", options: ["will probably", "probably", "would have", "is"], answer: 0 }
        ]
      },
      listening: {
        text: "I work in customer support for a software company. I'm responsible for answering emails from clients and solving their problems. My colleagues are great, but the workload can be heavy, especially before a deadline. If things don't improve, I'll probably apply for a job in another team next year.",
        questions: [
          { q: "What is the speaker responsible for?", options: ["Answering client emails", "Writing software", "Managing the team", "Hiring people"], answer: 0 },
          { q: "What might the speaker do next year?", options: ["Apply for a job in another team", "Leave the country", "Start a company", "Retire"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Describe your job or your studies. What do you enjoy, what's difficult, and what would you change?",
        tips: ["Use 'I'm responsible for...'", "Use a first conditional: 'If..., I'll...'", "Use contrast: 'The best part is... but the hardest part is...'"]
      }
    },
    {
      id: "b2-1", level: "B2", title: "Opinions and debate",
      vocab: [
        { word: "drawback", def: "a disadvantage", ex: "The main drawback is the price." },
        { word: "benefit", def: "an advantage", ex: "There are many benefits to exercise." },
        { word: "controversial", def: "causing a lot of disagreement", ex: "It's a very controversial topic." },
        { word: "convince", def: "make someone believe something", ex: "You've convinced me." },
        { word: "point of view", def: "a way of thinking about something", ex: "From my point of view, it's unfair." },
        { word: "take into account", def: "consider something when deciding", ex: "We need to take the cost into account." }
      ],
      grammar: {
        title: "Linkers of contrast",
        html: "<p><b>Although / Even though</b> + clause: <i>Although it's expensive, it's worth it.</i></p><p><b>Despite / In spite of</b> + noun or -ing: <i>Despite the cost, it's worth it. Despite being tired, I went.</i></p><p><b>However</b> starts a new sentence: <i>It's expensive. However, it's worth it.</i></p><p><b>Whereas</b> compares two things: <i>My brother loves cities, whereas I prefer the countryside.</i></p><p class='watch'>⚠️ Don't say <s>despite of</s>. It's <b>despite</b> OR <b>in spite of</b>.</p>",
        examples: ["Although I see your point, I disagree.", "Despite the rain, the match continued.", "Social media connects people. However, it can also isolate them."],
        quiz: [
          { q: "___ being tired, she finished the report.", options: ["Despite", "Although", "However", "Even though"], answer: 0 },
          { q: "___ it was late, we kept talking.", options: ["Although", "Despite", "In spite of", "However"], answer: 0 },
          { q: "I like tea, ___ my wife prefers coffee.", options: ["whereas", "despite", "however", "in spite"], answer: 0 }
        ]
      },
      listening: {
        text: "Should social media be banned for children under sixteen? It's a controversial question. On the one hand, there's strong evidence that heavy use affects teenagers' sleep and self-esteem. On the other hand, a total ban would be very hard to enforce, and it would cut young people off from their friends. Personally, I think better education is more realistic than a ban.",
        questions: [
          { q: "What is the speaker's final opinion?", options: ["Education is more realistic than a ban", "A ban is the best solution", "Social media has no negative effects", "Teenagers should decide alone"], answer: 0 },
          { q: "Which drawback of a ban is mentioned?", options: ["It would be hard to enforce", "It would be too expensive", "Parents don't want it", "It's illegal"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Should social media be banned for children under 16? Give both sides, then your opinion.",
        tips: ["Structure: On the one hand... On the other hand... Personally...", "Use 'although' and 'despite' at least once", "Finish with a clear conclusion: 'All in all, I'd say...'"]
      }
    },
    {
      id: "b2-2", level: "B2", title: "Regrets and 'what if'",
      vocab: [
        { word: "regret", def: "feel sorry about something you did or didn't do", ex: "I regret not learning to play an instrument." },
        { word: "turning point", def: "a moment when things change completely", ex: "That job was a turning point in my life." },
        { word: "in hindsight", def: "looking back now, knowing what you know", ex: "In hindsight, I should have waited." },
        { word: "miss out on", def: "lose the chance to enjoy something", ex: "I don't want to miss out on this opportunity." },
        { word: "look back on", def: "think about the past", ex: "When I look back on my school years, I smile." },
        { word: "make up for", def: "compensate for something", ex: "I'm working hard to make up for lost time." }
      ],
      grammar: {
        title: "Third conditional & 'I wish / If only'",
        html: "<p><b>If + had + past participle, would have + past participle</b> = imaginary past: <i>If I had studied, I would have passed.</i></p><p><b>I wish + past simple</b> = present regret: <i>I wish I spoke Spanish.</i></p><p><b>I wish + past perfect</b> = past regret: <i>I wish I had listened.</i></p><p class='watch'>⚠️ In speech, 'had' and 'would' both contract to <b>'d</b>: <i>If I'd known, I'd have come.</i> Practise saying it smoothly!</p>",
        examples: ["If I'd taken that job, I'd have moved to Canada.", "I wish I had more free time.", "If only I'd started earlier!"],
        quiz: [
          { q: "If we ___ earlier, we wouldn't have missed the train.", options: ["had left", "left", "would leave", "have left"], answer: 0 },
          { q: "I wish I ___ to the concert last night. Everyone says it was amazing.", options: ["had gone", "went", "would go", "go"], answer: 0 },
          { q: "If she had asked me, I ___ her.", options: ["would have helped", "will help", "helped", "would help"], answer: 0 }
        ]
      },
      listening: {
        text: "Looking back on my twenties, my biggest regret is that I didn't travel more. I always thought I'd have time later. In hindsight, if I'd taken a gap year after university, I probably wouldn't have rushed into a job I didn't enjoy. That said, that job turned out to be a turning point, because it's where I met my wife.",
        questions: [
          { q: "What is the speaker's biggest regret?", options: ["Not travelling more", "Getting married", "Going to university", "Taking a gap year"], answer: 0 },
          { q: "Why was the job a turning point?", options: ["He met his wife there", "He became rich", "He travelled a lot", "He got promoted"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Talk about a decision you would make differently if you could go back in time.",
        tips: ["Use 'If I had..., I would have...'", "Use 'I wish I had...'", "Balance it: 'That said, it taught me...'"]
      }
    },
    {
      id: "c1-1", level: "C1", title: "Sounding natural: softening",
      vocab: [
        { word: "arguably", def: "it can be argued that", ex: "It's arguably the best film of the decade." },
        { word: "to some extent", def: "partly, not completely", ex: "To some extent, I agree with you." },
        { word: "tend to", def: "usually do something", ex: "People tend to underestimate costs." },
        { word: "presumably", def: "I suppose; it's likely", ex: "Presumably, they'll announce it soon." },
        { word: "by and large", def: "in general, mostly", ex: "By and large, the feedback was positive." },
        { word: "debatable", def: "not certain; open to discussion", ex: "Whether it works is debatable." }
      ],
      grammar: {
        title: "Hedging: softening what you say",
        html: "<p>C1 speakers rarely sound 100% certain. They <b>hedge</b> to sound polite, balanced and precise.</p><ul><li><b>Seem/appear:</b> <i>It seems that remote work suits some people better.</i></li><li><b>Modals:</b> <i>This could / might / may be a problem.</i></li><li><b>Adverbs:</b> <i>arguably, presumably, probably, largely</i></li><li><b>Phrases:</b> <i>to some extent, in a way, I'd say, as far as I know</i></li></ul><p class='watch'>⚠️ B1–B2 speakers often sound too direct: <s>This is wrong.</s> → <b>I'm not sure that's entirely right.</b></p>",
        examples: ["It would seem that the plan has some flaws.", "This is arguably the most important factor.", "I tend to think that people work better at home."],
        quiz: [
          { q: "Choose the most 'hedged' option:", options: ["It could be argued that the policy has failed.", "The policy has failed.", "The policy is a total failure.", "Everyone knows the policy failed."], answer: 0 },
          { q: "People ___ to work longer hours when they work from home.", options: ["tend", "are tend", "tending", "tends"], answer: 0 },
          { q: "___, the results were positive, with a few exceptions.", options: ["By and large", "By the large", "At large", "Large and by"], answer: 0 }
        ]
      },
      listening: {
        text: "Is remote work better than working in an office? Well, by and large, the research suggests that people tend to be more productive at home, at least for focused tasks. That said, it's arguably harder to build relationships with colleagues remotely, and younger employees presumably miss out on learning from more experienced people. So, to some extent, the answer depends on the type of job.",
        questions: [
          { q: "According to the speaker, research suggests people at home are...", options: ["more productive for focused tasks", "always less productive", "happier but lazier", "better at building relationships"], answer: 0 },
          { q: "What is the speaker's conclusion?", options: ["It depends on the type of job", "Offices are always better", "Remote work should be banned", "Young people prefer remote work"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Is remote work better than office work? Give a balanced answer using at least three softening expressions.",
        tips: ["Try: 'It seems to me that...', 'To some extent...', 'arguably'", "Avoid absolute words like 'always', 'never', 'everyone'", "End with a nuanced conclusion: 'So it really depends on...'"]
      }
    },
    {
      id: "c1-2", level: "C1", title: "Emphasis: cleft sentences & inversion",
      vocab: [
        { word: "fundamentally", def: "in the most basic and important way", ex: "The problem is fundamentally about trust." },
        { word: "crucial", def: "extremely important", ex: "Timing is crucial." },
        { word: "overlook", def: "fail to notice or consider", ex: "We overlooked a small detail." },
        { word: "outweigh", def: "be more important than", ex: "The benefits outweigh the risks." },
        { word: "far-reaching", def: "having a big effect on many things", ex: "The changes will have far-reaching consequences." },
        { word: "tackle", def: "deal with a difficult problem", ex: "We need to tackle housing costs." }
      ],
      grammar: {
        title: "Cleft sentences and inversion for emphasis",
        html: "<p><b>What-clefts:</b> <i>What I need is a holiday. What really annoys me is the noise.</i></p><p><b>It-clefts:</b> <i>It was my teacher who encouraged me. It's the cost that worries me.</i></p><p><b>Inversion</b> (formal, powerful): <i>Never have I seen such chaos. Not only is it expensive, but it's also slow.</i></p><p class='watch'>⚠️ After a negative adverb at the start, invert like a question: <s>Never I have seen</s> → <b>Never have I seen</b>.</p>",
        examples: ["What we really need is better public transport.", "It's the rent that makes the city so hard to live in.", "Rarely do you see politicians admit a mistake."],
        quiz: [
          { q: "___ I love about this city is the food.", options: ["What", "That", "Which", "It"], answer: 0 },
          { q: "Never ___ such a beautiful sunset.", options: ["have I seen", "I have seen", "I saw", "did I saw"], answer: 0 },
          { q: "It was my grandmother ___ taught me to cook.", options: ["who", "what", "which she", "whom she"], answer: 0 }
        ]
      },
      listening: {
        text: "What really worries me about my city is housing. It's not the traffic or the pollution that people complain about most — it's the rent. Not only have prices doubled in ten years, but salaries have barely moved. The benefits of tourism are real, but they don't outweigh the far-reaching damage to local communities, and that's something politicians have consistently overlooked.",
        questions: [
          { q: "What is the speaker's main concern?", options: ["Housing costs", "Traffic", "Pollution", "Crime"], answer: 0 },
          { q: "What does the speaker say about tourism?", options: ["Its damage outweighs its benefits", "It has no benefits", "It solved the housing problem", "Politicians focus on it too much"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "What is the biggest challenge facing your city or region? Use at least one cleft sentence and one inversion.",
        tips: ["Start strong: 'What really worries me is...'", "Try: 'Not only..., but...'", "Propose a solution: 'What we need to do is...'"]
      }
    },
    {
      id: "c2-1", level: "C2", title: "Idioms in conversation",
      vocab: [
        { word: "the elephant in the room", def: "an obvious problem that nobody talks about", ex: "The budget is the elephant in the room." },
        { word: "a blessing in disguise", def: "something bad that turns out to be good", ex: "Losing that job was a blessing in disguise." },
        { word: "cut corners", def: "do something badly to save time or money", ex: "Don't cut corners on safety." },
        { word: "sit on the fence", def: "avoid choosing a side", ex: "You can't sit on the fence forever." },
        { word: "get the ball rolling", def: "start something", ex: "Let's get the ball rolling with a quick intro." },
        { word: "beat around the bush", def: "avoid saying something directly", ex: "Stop beating around the bush and tell me." }
      ],
      grammar: {
        title: "Mixed conditionals",
        html: "<p>Mix past and present when an imaginary past affects the present, or vice versa.</p><p><b>Past → present:</b> <i>If I had taken that job, I would be living in Dubai now.</i></p><p><b>Present → past:</b> <i>If I weren't so shy, I would have spoken up at the meeting.</i></p><p class='watch'>⚠️ Check the time of each half separately: which part is about the past, which about now?</p>",
        examples: ["If I'd learned English as a child, I'd be fluent now.", "If she weren't so stubborn, she'd have accepted the offer.", "If we hadn't cut corners, we wouldn't be in this mess."],
        quiz: [
          { q: "If I had saved more money, I ___ a house now.", options: ["would own", "would have owned", "will own", "owned"], answer: 0 },
          { q: "If he ___ so lazy, he would have finished yesterday.", options: ["weren't", "hadn't been being", "isn't", "wouldn't be"], answer: 0 },
          { q: "'Losing that job was a ___ in disguise.'", options: ["blessing", "gift", "chance", "luck"], answer: 0 }
        ]
      },
      listening: {
        text: "When the company closed, I was devastated. But honestly, it turned out to be a blessing in disguise. The elephant in the room had always been that management cut corners, and everyone knew it. If I hadn't been forced to leave, I'd probably still be sitting on the fence about starting my own business. Instead, I got the ball rolling within a month.",
        questions: [
          { q: "How does the speaker now see the company closing?", options: ["As something that turned out well", "As the worst day of their life", "As management's success", "As unfair to customers"], answer: 0 },
          { q: "What did the speaker do after leaving?", options: ["Started their own business", "Joined a competitor", "Took a long holiday", "Went back to university"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Tell a story about a mistake or bad event that turned out well in the end. Use at least two idioms and one mixed conditional.",
        tips: ["Set the scene: 'At the time, I was...'", "Turn: 'But in hindsight, it was a blessing in disguise'", "Mixed conditional: 'If that hadn't happened, I wouldn't be... now'"]
      }
    },
    {
      id: "c2-2", level: "C2", title: "Persuasion and nuance",
      vocab: [
        { word: "compelling", def: "very convincing", ex: "She made a compelling case." },
        { word: "concede", def: "admit that something is true, often unwillingly", ex: "I concede that it's expensive, but..." },
        { word: "nuance", def: "a very small difference in meaning", ex: "The nuance is often lost in translation." },
        { word: "undermine", def: "make something weaker gradually", ex: "These cuts undermine public trust." },
        { word: "reconcile", def: "make two ideas fit together", ex: "It's hard to reconcile growth with sustainability." },
        { word: "contentious", def: "likely to cause disagreement", ex: "It's a contentious issue." }
      ],
      grammar: {
        title: "Participle clauses for concise, elegant speech",
        html: "<p>Replace a full clause with an <b>-ing</b> or <b>-ed</b> form to sound concise:</p><ul><li><i>Having considered the evidence, I've changed my mind.</i> (= After I considered...)</li><li><i>Faced with rising costs, many families cut back.</i> (= Because they were faced...)</li><li><i>Given the circumstances, it was the right call.</i></li></ul><p class='watch'>⚠️ The subject must be the same in both parts: <s>Walking home, the rain started</s> (the rain wasn't walking!).</p>",
        examples: ["Having lived in three countries, I can see both sides.", "Given the risks, I'd suggest waiting.", "Admittedly, the plan is ambitious."],
        quiz: [
          { q: "___ the report, she decided to resign.", options: ["Having read", "Having reading", "Read", "Had read"], answer: 0 },
          { q: "___ the circumstances, I think he did well.", options: ["Given", "Giving", "Having given", "Gave"], answer: 0 },
          { q: "'I ___ that the plan is risky, but the alternative is worse.'", options: ["concede", "conceive", "conceal", "concern"], answer: 0 }
        ]
      },
      listening: {
        text: "I'll concede that cycling to work isn't for everyone. Given the weather here, it's understandable that people hesitate. But the case for it is compelling: having switched two years ago, I've saved a fortune and I'm noticeably healthier. What undermines the argument against it, in my view, is that most journeys in the city are under five kilometres.",
        questions: [
          { q: "What does the speaker concede?", options: ["Cycling isn't for everyone", "Cycling is dangerous", "Cars are faster", "The weather is perfect"], answer: 0 },
          { q: "Which fact weakens the argument against cycling?", options: ["Most city journeys are under 5 km", "Bikes are expensive", "The speaker is healthier", "People hesitate"], answer: 0 }
        ]
      },
      speaking: {
        prompt: "Persuade me to change one everyday habit (for example: phone use, diet, transport). Concede one point to the other side.",
        tips: ["Concede: 'I'll admit that... but...'", "Use a participle clause: 'Having tried it myself,...'", "Finish with a compelling call to action"]
      }
    }
  ]
};
