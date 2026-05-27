const sentencesData = [
  {
    id: 1,
    english: "It is the widespread use of smartphones that has changed the way college students communicate with each other.",
    chinese: "正是智能手机的广泛使用改变了大学生互相交流的方式。",
    keywords: [
      "widespread use",
      "communicate with each other"
    ],
    topic: "科技"
  },
  {
    id: 2,
    english: "Only by learning to code can students keep up with the rapid development of artificial intelligence.",
    chinese: "只有通过学习编程，学生才能跟上人工智能的快速发展。",
    keywords: [
      "learn to code",
      "keep up with",
      "artificial intelligence"
    ],
    topic: "科技"
  },
  {
    id: 3,
    english: "The online courses, which are provided by many universities, allow students to study at their own pace.",
    chinese: "许多大学提供的在线课程让学生能够按照自己的节奏学习。",
    keywords: [
      "online courses",
      "at their own pace"
    ],
    topic: "科技"
  },
  {
    id: 4,
    english: "If there were no Internet, college students would find it much harder to access academic resources.",
    chinese: "如果没有互联网，大学生获取学术资源会困难得多。",
    keywords: [
      "academic resources",
      "access"
    ],
    topic: "科技"
  },
  {
    id: 5,
    english: "What matters most is whether we can use modern technology to solve environmental problems.",
    chinese: "最重要的是我们能否利用现代技术解决环境问题。",
    keywords: [
      "modern technology",
      "solve environmental problems"
    ],
    topic: "科技"
  },
  {
    id: 6,
    english: "Not only does the new app save time, but it also helps students organize their schedules efficiently.",
    chinese: "这款新应用不仅节省时间，还帮助学生高效安排日程。",
    keywords: [
      "save time",
      "organize schedules"
    ],
    topic: "科技"
  },
  {
    id: 7,
    english: "The fact that many students rely on digital tools for learning suggests a shift in education methods.",
    chinese: "许多学生依赖数字工具学习这一事实表明教育方式发生了转变。",
    keywords: [
      "rely on",
      "digital tools",
      "education methods"
    ],
    topic: "科技"
  },
  {
    id: 8,
    english: "It is necessary that college students should learn to distinguish reliable information from fake news online.",
    chinese: "大学生有必要学会区分网上的可靠信息和虚假新闻。",
    keywords: [
      "distinguish...from...",
      "reliable information",
      "fake news"
    ],
    topic: "科技"
  },
  {
    id: 9,
    english: "Only when every student takes action to sort waste can our campus become cleaner.",
    chinese: "只有当每位学生都采取行动对垃圾分类时，我们的校园才能变得更干净。",
    keywords: [
      "take action",
      "sort waste"
    ],
    topic: "环保"
  },
  {
    id: 10,
    english: "It is essential that college students should reduce the use of disposable plastic bags.",
    chinese: "大学生减少使用一次性塑料袋是至关重要的。",
    keywords: [
      "reduce the use",
      "disposable plastic bags"
    ],
    topic: "环保"
  },
  {
    id: 11,
    english: "The fact that more and more students ride bicycles to class shows their awareness of environmental protection.",
    chinese: "越来越多学生骑自行车上课的事实显示了他们的环保意识。",
    keywords: [
      "ride bicycles",
      "awareness of environmental protection"
    ],
    topic: "环保"
  },
  {
    id: 12,
    english: "Had we started recycling paper earlier, we could have saved many trees.",
    chinese: "如果我们早点开始回收纸张，本可以拯救许多树木。",
    keywords: [
      "recycling paper",
      "save trees"
    ],
    topic: "环保"
  },
  {
    id: 13,
    english: "The campaign which encourages students to turn off lights when leaving classrooms has been very effective.",
    chinese: "这项鼓励学生离开教室时关灯的活动非常有效。",
    keywords: [
      "turn off lights",
      "effective campaign"
    ],
    topic: "环保"
  },
  {
    id: 14,
    english: "What impresses me most is that our university holds a green market every semester for exchanging used books.",
    chinese: "最令我印象深刻的是我们大学每学期举办一次绿色市场来交换旧书。",
    keywords: [
      "green market",
      "exchanging used books"
    ],
    topic: "环保"
  },
  {
    id: 15,
    english: "Only by combining theory with practice can students truly understand what they have learned in class.",
    chinese: "只有将理论与实践相结合，学生才能真正理解课堂上所学的内容。",
    keywords: [
      "combining theory with practice",
      "truly understand",
      "in class"
    ],
    topic: "教育"
  },
  {
    id: 16,
    english: "The teacher suggested that every student should take part in the English speech contest to improve their confidence.",
    chinese: "老师建议每个学生都参加英语演讲比赛以提高自信。",
    keywords: [
      "suggested that",
      "take part in",
      "improve confidence"
    ],
    topic: "教育"
  },
  {
    id: 17,
    english: "It is the group discussion that helps us develop critical thinking and communication skills in college.",
    chinese: "正是小组讨论帮助我们在大学里培养了批判性思维和沟通能力。",
    keywords: [
      "group discussion",
      "critical thinking",
      "communication skills"
    ],
    topic: "教育"
  },
  {
    id: 18,
    english: "Students who actively participate in volunteer activities often gain valuable experience for their future careers.",
    chinese: "积极参与志愿者活动的学生常常为未来职业获得宝贵经验。",
    keywords: [
      "actively participate",
      "volunteer activities",
      "valuable experience"
    ],
    topic: "教育"
  },
  {
    id: 19,
    english: "What matters most in education is not the score but the ability to solve practical problems independently.",
    chinese: "教育中最重要的不是分数，而是独立解决实际问题的能力。",
    keywords: [
      "what matters most",
      "solve practical problems",
      "independently"
    ],
    topic: "教育"
  },
  {
    id: 20,
    english: "If I had known the importance of time management earlier, I would have spent more time on library research.",
    chinese: "如果我早点知道时间管理的重要性，我就会在图书馆研究上花更多时间。",
    keywords: [
      "time management",
      "spent more time",
      "library research"
    ],
    topic: "教育"
  },
  {
    id: 21,
    english: "The reason why many college students choose to study abroad is that they want to broaden their horizons.",
    chinese: "很多大学生选择出国留学的原因是他们想开阔眼界。",
    keywords: [
      "study abroad",
      "broaden horizons",
      "the reason why"
    ],
    topic: "教育"
  },
  {
    id: 22,
    english: "So important is the final exam that every student has to prepare for it carefully and review all notes.",
    chinese: "期末考试如此重要，以至于每个学生都必须认真准备并复习所有笔记。",
    keywords: [
      "final exam",
      "prepare for",
      "review notes"
    ],
    topic: "教育"
  },
  {
    id: 23,
    english: "It is widely believed that the Internet has greatly changed the way we communicate with each other in modern society.",
    chinese: "人们普遍认为，互联网极大地改变了现代社会中我们相互交流的方式。",
    keywords: [
      "widely believed",
      "communicate with each other"
    ],
    topic: "社会"
  },
  {
    id: 24,
    english: "Only when everyone makes joint efforts can the problem of air pollution be solved effectively.",
    chinese: "只有每个人都共同努力，空气污染问题才能得到有效解决。",
    keywords: [
      "make joint efforts",
      "air pollution",
      "solved effectively"
    ],
    topic: "社会"
  },
  {
    id: 25,
    english: "The reason why more young people choose to volunteer in communities is that they want to make a difference.",
    chinese: "更多年轻人选择在社区做志愿者的原因是他们想有所作为。",
    keywords: [
      "volunteer in communities",
      "make a difference"
    ],
    topic: "社会"
  },
  {
    id: 26,
    english: "Had the government taken action earlier, the traffic congestion in big cities would have been less serious.",
    chinese: "如果政府更早采取行动，大城市的交通拥堵就不会那么严重了。",
    keywords: [
      "taken action",
      "traffic congestion"
    ],
    topic: "社会"
  },
  {
    id: 27,
    english: "It is the growing awareness of environmental protection that encourages people to sort their garbage at home.",
    chinese: "正是日益增长的环保意识鼓励人们在家中分类垃圾。",
    keywords: [
      "environmental protection",
      "sort garbage"
    ],
    topic: "社会"
  },
  {
    id: 28,
    english: "What concerns many parents most is whether their children can get equal access to quality education.",
    chinese: "许多家长最担心的是他们的孩子能否平等获得优质教育。",
    keywords: [
      "concerns...most",
      "equal access to",
      "quality education"
    ],
    topic: "社会"
  },
  {
    id: 29,
    english: "No matter how busy they are, college students should spare some time to care about social issues.",
    chinese: "无论多忙，大学生都应该抽出时间关心社会问题。",
    keywords: [
      "spare some time",
      "care about",
      "social issues"
    ],
    topic: "社会"
  },
  {
    id: 30,
    english: "The fact that more people now use shared bikes suggests a shift toward green transportation in daily life.",
    chinese: "现在更多人使用共享单车的事实表明日常生活中向绿色交通的转变。",
    keywords: [
      "shared bikes",
      "green transportation"
    ],
    topic: "社会"
  },
  {
    id: 31,
    english: "Only by balancing study and social activities can we truly enjoy a colorful college life.",
    chinese: "只有平衡学习和社交活动，我们才能真正享受丰富多彩的大学生活。",
    keywords: [
      "balance A and B",
      "enjoy a colorful life"
    ],
    topic: "生活"
  },
  {
    id: 32,
    english: "What matters most in college is that we learn to manage our time effectively.",
    chinese: "大学中最重要的是我们学会有效管理时间。",
    keywords: [
      "what matters most",
      "manage time effectively"
    ],
    topic: "生活"
  },
  {
    id: 33,
    english: "Had I not joined the student union, I would have missed many valuable experiences.",
    chinese: "如果我没有加入学生会，我会错过许多宝贵的经历。",
    keywords: [
      "join the student union",
      "miss valuable experiences"
    ],
    topic: "生活"
  },
  {
    id: 34,
    english: "The dormitory where we live together has become our second home on campus.",
    chinese: "我们一起住的宿舍已成为我们在校园里的第二个家。",
    keywords: [
      "live together",
      "second home on campus"
    ],
    topic: "生活"
  },
  {
    id: 35,
    english: "It is the daily communication with roommates that helps us develop social skills.",
    chinese: "正是与室友的日常交流帮助我们发展社交技能。",
    keywords: [
      "daily communication",
      "develop social skills"
    ],
    topic: "生活"
  },
  {
    id: 36,
    english: "The suggestion that we should take part in more club activities was widely accepted.",
    chinese: "我们应该参加更多社团活动的建议被广泛接受。",
    keywords: [
      "take part in",
      "club activities"
    ],
    topic: "生活"
  },
  {
    id: 37,
    english: "Only when we set clear goals can we make steady progress in our studies.",
    chinese: "只有当我们设定明确的目标时，我们才能在学业上取得稳步进步。",
    keywords: [
      "set clear goals",
      "make steady progress"
    ],
    topic: "学习"
  },
  {
    id: 38,
    english: "It is through consistent practice that students can truly master a foreign language.",
    chinese: "正是通过持续的练习，学生才能真正掌握一门外语。",
    keywords: [
      "consistent practice",
      "master a foreign language"
    ],
    topic: "学习"
  },
  {
    id: 39,
    english: "The reason why some students fall behind is that they lack effective learning methods.",
    chinese: "一些学生落后的原因在于他们缺乏有效的学习方法。",
    keywords: [
      "fall behind",
      "lack effective learning methods"
    ],
    topic: "学习"
  },
  {
    id: 40,
    english: "If I had studied harder last semester, I would have achieved better grades in the final exam.",
    chinese: "如果上学期我学习更努力，我本会在期末考试中取得更好的成绩。",
    keywords: [
      "study harder",
      "achieve better grades"
    ],
    topic: "学习"
  },
  {
    id: 41,
    english: "What matters most in college education is not just the knowledge we gain but the ability to think critically.",
    chinese: "大学教育中最重要的是不仅在于我们获得的知识，更在于批判性思考的能力。",
    keywords: [
      "college education",
      "think critically"
    ],
    topic: "学习"
  },
  {
    id: 42,
    english: "The library, where students often spend their weekends, provides a quiet environment for deep concentration.",
    chinese: "学生们经常在图书馆度过周末，那里提供了安静的环境以便深度专注。",
    keywords: [
      "spend weekends",
      "deep concentration"
    ],
    topic: "学习"
  },
  {
    id: 43,
    english: "Only by persisting in your efforts every day can you achieve your academic goals in college.",
    chinese: "只有每天坚持努力，你才能实现大学里的学业目标。",
    keywords: [
      "persist in",
      "academic goals"
    ],
    topic: "励志"
  },
  {
    id: 44,
    english: "It is the strong belief in yourself that helps you overcome the difficulties in study and life.",
    chinese: "正是对自己的坚定信念帮助你克服学习和生活中的困难。",
    keywords: [
      "belief in yourself",
      "overcome difficulties"
    ],
    topic: "励志"
  },
  {
    id: 45,
    english: "If you had not joined the English club last year, you would not have made such great progress in speaking.",
    chinese: "如果你去年没有加入英语俱乐部，你的口语就不会取得如此大的进步。",
    keywords: [
      "join the club",
      "make progress"
    ],
    topic: "励志"
  },
  {
    id: 46,
    english: "The reason why many students succeed in CET-4 is that they have a clear plan and stick to it.",
    chinese: "许多学生通过大学英语四级考试的原因是他们有明确的计划并坚持下去。",
    keywords: [
      "succeed in",
      "stick to"
    ],
    topic: "励志"
  },
  {
    id: 47,
    english: "Those who never give up facing challenges will eventually turn their dreams into reality.",
    chinese: "那些面对挑战从不放弃的人最终会将梦想变为现实。",
    keywords: [
      "give up",
      "turn dreams into reality"
    ],
    topic: "励志"
  },
  {
    id: 48,
    english: "What matters most in college life is not how smart you are but how hard you are willing to work.",
    chinese: "大学生活中最重要的不是你有多聪明，而是你愿意付出多少努力。",
    keywords: [
      "matters most",
      "be willing to work"
    ],
    topic: "励志"
  },
  {
    id: 49,
    english: "The student who studies hardest in our dormitory always gets up earliest to review his lessons.",
    chinese: "我们宿舍里学习最努力的那个学生总是起得最早来复习功课。",
    keywords: [
      "studies hardest",
      "gets up earliest",
      "review his lessons"
    ],
    topic: "校园"
  },
  {
    id: 50,
    english: "Had I not participated in the English corner last night, I would have missed the chance to practice oral English.",
    chinese: "如果昨晚我没有参加英语角，我就会错过练习口语的机会。",
    keywords: [
      "participated in",
      "English corner",
      "practice oral English"
    ],
    topic: "校园"
  },
  {
    id: 51,
    english: "Only by taking an active part in campus activities can you broaden your horizons and make more friends.",
    chinese: "只有积极参加校园活动，你才能开阔视野，结交更多朋友。",
    keywords: [
      "taking an active part in",
      "broaden your horizons",
      "make more friends"
    ],
    topic: "校园"
  },
  {
    id: 52,
    english: "It is the strict professor who often encourages us to think independently and question everything.",
    chinese: "正是那位严格的教授经常鼓励我们独立思考并质疑一切。",
    keywords: [
      "encourages us to",
      "think independently",
      "question everything"
    ],
    topic: "校园"
  },
  {
    id: 53,
    english: "That the library has been equipped with modern facilities has made it easier for students to find reference books.",
    chinese: "图书馆配备了现代化设施，这使得学生更容易找到参考书。",
    keywords: [
      "equipped with",
      "modern facilities",
      "reference books"
    ],
    topic: "校园"
  },
  {
    id: 54,
    english: "The more time you spend in the laboratory, the more likely you are to discover something new.",
    chinese: "你在实验室花的时间越多，就越有可能发现新东西。",
    keywords: [
      "spend time in",
      "the laboratory",
      "discover something new"
    ],
    topic: "校园"
  },
  {
    id: 55,
    english: "Only when students gain practical experience can they stand out in the job market after graduation.",
    chinese: "只有当学生获得实践经验，他们才能在毕业后的就业市场中脱颖而出。",
    keywords: [
      "gain practical experience",
      "stand out in the job market"
    ],
    topic: "就业"
  },
  {
    id: 56,
    english: "It is essential that college graduates should prepare a clear career plan before entering the competitive society.",
    chinese: "大学毕业生在进入竞争激烈的社会之前，准备一份清晰的职业规划是必要的。",
    keywords: [
      "career plan",
      "competitive society"
    ],
    topic: "就业"
  },
  {
    id: 57,
    english: "Those who have taken part in internship programs find it easier to get a satisfactory job offer.",
    chinese: "那些参加过实习项目的学生发现更容易获得满意的工作机会。",
    keywords: [
      "taken part in",
      "internship programs",
      "job offer"
    ],
    topic: "就业"
  },
  {
    id: 58,
    english: "If I were a freshman, I would start learning job-hunting skills earlier to avoid being anxious later.",
    chinese: "如果我是大一新生，我会更早开始学习求职技巧，以避免以后焦虑。",
    keywords: [
      "job-hunting skills",
      "avoid being anxious"
    ],
    topic: "就业"
  },
  {
    id: 59,
    english: "The reason why many graduates choose to work in big cities is that there are more development opportunities there.",
    chinese: "许多毕业生选择在大城市工作的原因是那里有更多发展机会。",
    keywords: [
      "work in big cities",
      "development opportunities"
    ],
    topic: "就业"
  },
  {
    id: 60,
    english: "It is the lack of relevant work experience that prevents some students from getting their dream jobs.",
    chinese: "正是缺乏相关工作经验，阻止了一些学生获得他们理想的工作。",
    keywords: [
      "lack of",
      "work experience",
      "dream jobs"
    ],
    topic: "就业"
  },
  {
    id: 61,
    english: "The cultural festival, which was held on campus last week, attracted thousands of students to experience traditional art.",
    chinese: "上周在校园里举办的文化节吸引了数千名学生前来体验传统艺术。",
    keywords: [
      "cultural festival",
      "traditional art"
    ],
    topic: "文化"
  },
  {
    id: 62,
    english: "If I had known more about Chinese calligraphy, I would have joined the workshop offered by the art club.",
    chinese: "如果我对中国书法了解更多，我就会参加艺术俱乐部提供的工作坊了。",
    keywords: [
      "Chinese calligraphy",
      "joined the workshop"
    ],
    topic: "文化"
  },
  {
    id: 63,
    english: "Not only does the Spring Festival bring families together, but it also reminds us of our cultural roots.",
    chinese: "春节不仅让家人团聚，也提醒我们自己的文化根源。",
    keywords: [
      "Spring Festival",
      "brings families together",
      "cultural roots"
    ],
    topic: "文化"
  },
  {
    id: 64,
    english: "It is through watching traditional operas that young people can truly appreciate the beauty of Chinese culture.",
    chinese: "正是通过观看传统戏曲，年轻人才能真正领略中国文化的魅力。",
    keywords: [
      "traditional operas",
      "Chinese culture"
    ],
    topic: "文化"
  },
  {
    id: 65,
    english: "What impressed me most was the fact that so many foreign students were eager to learn Chinese folk dances.",
    chinese: "最让我印象深刻的是，这么多外国学生都渴望学习中国民间舞蹈。",
    keywords: [
      "foreign students",
      "Chinese folk dances"
    ],
    topic: "文化"
  },
  {
    id: 66,
    english: "Only by preserving local customs and dialects can we prevent our cultural diversity from disappearing.",
    chinese: "只有保护当地习俗和方言，我们才能防止文化多样性消失。",
    keywords: [
      "local customs",
      "cultural diversity"
    ],
    topic: "文化"
  },
  {
    id: 67,
    english: "It is widely acknowledged that a person's moral character is more important than his academic achievements in the long run.",
    chinese: "人们普遍认为，从长远来看，一个人的道德品质比他的学业成就更重要。",
    keywords: [
      "moral character",
      "academic achievements",
      "in the long run"
    ],
    topic: "品德"
  },
  {
    id: 68,
    english: "Only by helping others without expecting anything in return can we truly understand the value of integrity.",
    chinese: "只有不求回报地帮助他人，我们才能真正理解诚信的价值。",
    keywords: [
      "without expecting anything in return",
      "integrity"
    ],
    topic: "品德"
  },
  {
    id: 69,
    english: "The students who always keep their promises are the ones that teachers and classmates trust most.",
    chinese: "那些总是信守诺言的学生是老师和同学最信任的人。",
    keywords: [
      "keep their promises",
      "trust most"
    ],
    topic: "品德"
  },
  {
    id: 70,
    english: "If every college student were to show respect to the elderly, our society would become much more harmonious.",
    chinese: "如果每个大学生都尊敬老人，我们的社会会变得更加和谐。",
    keywords: [
      "show respect to the elderly",
      "harmonious"
    ],
    topic: "品德"
  },
  {
    id: 71,
    english: "What matters most in university life is not how many friends you have, but whether you treat them with sincerity.",
    chinese: "大学生活中最重要不是你拥有多少朋友，而是你是否真诚对待他们。",
    keywords: [
      "what matters most",
      "treat them with sincerity"
    ],
    topic: "品德"
  },
  {
    id: 72,
    english: "Never should we judge a person only by his appearance, for kindness often lies deep in the heart.",
    chinese: "我们绝不应该仅凭外表判断一个人，因为善良常深藏于内心。",
    keywords: [
      "judge a person by his appearance",
      "kindness"
    ],
    topic: "品德"
  }
]
export default sentencesData
