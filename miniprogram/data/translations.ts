const translationsData = [
  { id: 1, chinese: '中国是一个历史悠久、文化丰富的国家。', reference: 'China is a country with a long history and rich culture.', source: '四级翻译真题', keywords: ['long history', 'rich culture'], acceptableAnswers: ['China is a nation with a long history and a rich culture.'] },
  { id: 2, chinese: '越来越多的人意识到环境保护的重要性。', reference: 'More and more people have realized the importance of environmental protection.', source: '四级翻译模拟', keywords: ['more and more', 'realize', 'importance', 'environmental protection'], acceptableAnswers: ['A growing number of people have come to realize the importance of protecting the environment.'] },
  { id: 3, chinese: '春节是中国最重要的传统节日，家人会聚在一起吃年夜饭。', reference: "The Spring Festival is the most important traditional festival in China, when families gather together to have the New Year's Eve dinner.", source: '四级翻译真题', keywords: ['Spring Festival', 'most important', 'traditional festival', 'gather', "New Year's Eve dinner"], acceptableAnswers: ["The Spring Festival, the most important traditional holiday in China, is when families get together for the New Year's Eve feast."] },
  { id: 4, chinese: '随着互联网的发展，移动支付在中国变得越来越普遍。', reference: 'With the development of the Internet, mobile payment has become increasingly popular in China.', source: '四级翻译真题', keywords: ['development', 'Internet', 'mobile payment', 'increasingly popular'], acceptableAnswers: ['As the Internet develops, mobile payment has become more and more common in China.'] },
  { id: 5, chinese: '据报道，今年参加高考的学生人数创下了历史新高。', reference: "It is reported that the number of students taking the college entrance examination this year has reached a record high.", source: '四级翻译模拟', keywords: ['reported', 'college entrance examination', 'number', 'record high'], acceptableAnswers: ["According to reports, the number of students taking this year's college entrance exam has hit an all-time high."] },
  { id: 6, chinese: '太极拳是一种传统的中国武术，深受老年人的喜爱。', reference: 'Tai Chi is a traditional Chinese martial art that is very popular among the elderly.', source: '四级翻译真题', keywords: ['Tai Chi', 'traditional', 'martial art', 'popular among', 'elderly'], acceptableAnswers: ['Tai Chi is a traditional Chinese martial art that is deeply loved by senior citizens.'] },
  { id: 7, chinese: '这座博物馆收藏了大量珍贵的文物，吸引了来自世界各地的游客。', reference: 'This museum houses a large collection of precious cultural relics, attracting visitors from all over the world.', source: '四级翻译模拟', keywords: ['museum', 'collection', 'precious', 'cultural relics', 'attract', 'all over the world'], acceptableAnswers: ['This museum has a vast collection of precious cultural relics, drawing tourists from around the globe.'] },
  { id: 8, chinese: '手机已经成为我们日常生活中不可或缺的一部分。', reference: 'Mobile phones have become an indispensable part of our daily life.', source: '四级翻译真题', keywords: ['mobile phone', 'indispensable', 'daily life', 'part'], acceptableAnswers: ['Smartphones have become an essential part of our everyday lives.'] },
  { id: 9, chinese: '为了保持健康，我们应该多吃水果和蔬菜，少吃垃圾食品。', reference: 'To stay healthy, we should eat more fruits and vegetables and less junk food.', source: '四级翻译模拟', keywords: ['stay healthy', 'fruits', 'vegetables', 'junk food'], acceptableAnswers: ['To keep fit, we should eat more fruit and vegetables and cut down on junk food.'] },
  { id: 10, chinese: '共享单车为人们提供了一种便捷、环保的出行方式。', reference: 'Shared bikes provide people with a convenient and environmentally friendly way to travel.', source: '四级翻译真题', keywords: ['shared bike', 'convenient', 'environmentally friendly', 'way to travel'], acceptableAnswers: ['Shared bicycles offer people a convenient and eco-friendly mode of transportation.'] },
  { id: 1779437056947, chinese: '舞狮作为中国传统民间表演已有2000多年历史。在狮子舞中，两位表演者同披一件狮子服，一个舞动头部，另一个舞动身体和尾巴。他们熟练配合，模仿狮子的各种动作。狮子是兽中之王，象征幸福和好运，所以人们通常在春节和其他节日期间表演狮子舞。狮子舞也可能出现在其他重要场合，如商店开业和结婚典礼，往往吸引许多人观赏。', reference: "Lion dance, as a traditional Chinese folk performance, has a history of more than 2,000 years. In the lion dance, two performers share one lion costume, one manipulating the head and the other manipulating the body and tail. They skillfully cooperate to imitate various movements of the lion. The lion is the king of beasts, symbolizing happiness and good luck, so people usually perform the lion dance during the Spring Festival and other festivals. The lion dance may also appear on other important occasions, such as store openings and wedding ceremonies, often attracting many spectators.", source: 'CET-4 2019.6', keywords: ['lion dance', 'folk performance', '2000 years', 'performers', 'cooperate', 'imitate', 'king of beasts', 'symbolize', 'Spring Festival', 'wedding ceremony'], acceptableAnswers: [] },
{
  "id": 1779400000001,
  "chinese": "中国是世界上最古老的文明之一。构成现代世界基础的许多元素都起源于中国。中国现在拥有世界上发展最快的经济，并经历着一次新的工业革命。中国还启动了雄心勃勃的太空探索计划，其中包括到2020年建成一个太空站。目前，中国是世界最大的出口国之一，并正在吸引大量外国投资。同时，它也在海外投资数十亿美元。2011年，中国超越日本成为世界第二大经济体。",
  "reference": "",
  "source": "CET-4 2015.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000002,
  "chinese": "据报道，今年中国快递服务(courier services)将递送大约120亿件包裹。这将使中国有可能超越美国成为世界上最大的快递市场。大多数包裹里装着网上订购的物品。中国给数百万在线零售商以极具竞争力的价格销售商品的机会。仅在11月11日，中国消费者就从国内最大的购物平台购买了价值90亿美元的商品。中国有不少这样的特殊购物日。因此，快递业在中国扩展就不足为奇了。",
  "reference": "",
  "source": "CET-4 2015.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000003,
  "chinese": "在西方人心目中，和中国联系最为密切的基本食物是大米。长期以来，大米在中国人的饮食中占据很重要的地位，以至于有谚语说“巧妇难为无米之炊”。中国南方大多种植水稻，人们通常以大米为主食；而华北大部分地区因为过于寒冷或过于干燥，无法种植水稻，那里的主要作物是小麦。在中国，有些人用面粉做面包，但大多数人用面粉做馒头和面条。",
  "reference": "",
  "source": "CET-4 2015.06 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000004,
  "chinese": "中国父母往往过于关注孩子的学习，以至于不要他们帮忙做家务。他们对孩子的首要要求就是努力学习，考得好，能上名牌大学，他们相信这是为孩子好。因为在中国这样竞争激烈的社会里，只有成绩好才能保证前途光明。中国父母还认为，如果孩子能在社会上取得大的成就，父母就会受到尊敬。因此，他们愿意牺牲自己的时间、爱好和兴趣，为孩子提供更好的条件。",
  "reference": "",
  "source": "CET-4 2015.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000005,
  "chinese": "云南省的丽江古镇是中国著名的旅游目的地之一。那里的生活节奏比大多数中国城市都要缓慢。丽江到处都是美丽的自然风光，众多的少数民族同胞提供了各式各样、丰富多彩的文化让游客体验。历史上，丽江还以“爱之城”而闻名。当地人中流传着许多关于因爱而生、为爱而死的故事。如今，在中外游客眼中，这个古镇被视为爱情和浪漫的天堂(paradise)。",
  "reference": "",
  "source": "CET-4 2015.12 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000006,
  "chinese": "今年在长沙举行了一年一度的外国人汉语演讲比赛。这项比赛证明是促进中国和世界其他地区文化交流的好方法。它为世界各地的年轻人提供了更好地了解中国的机会。\n来自87个国家共计126位选手聚集在湖南省省会参加了从7月6日到8月5日进行的半决赛和决赛。\n比赛并不是唯一的活动。选手们还有机会参观了中国其他地区的著名景点和历史名胜。",
  "reference": "",
  "source": "CET-4 2015.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000007,
  "chinese": "功夫(Kung Fu)是中国武术(martial arts)的俗称。中国武术的起源可以追溯到自卫的需要、狩猎活动以及古代中国的军事训练。它是中国传统体育运动的一种，年轻人和老年人都练。它已逐渐演变成了中国文化的独特元素。作为中国的国宝，功夫有上百种不同的风格，是世界上练得最多的武术形式。有些风格模仿了动物的动作，还有一些则受到了中国哲学思想、神话和传说的启发。",
  "reference": "",
  "source": "CET-4 2016.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000008,
  "chinese": "在山东省潍坊市，风筝不仅仅是玩具，而且还是这座城市文化的标志。潍坊以“风筝之都”而闻名，已有将近2,400年放飞风筝的历史。传说中国古代哲学家墨子用了三年时间在潍坊制作了世界上首个风筝，但放飞的第一天风筝就坠落并摔坏了。也有人相信风筝是中国古代木匠鲁班发明的。据说他的风筝用木头和竹子制作，飞了三天后才落地。",
  "reference": "",
  "source": "CET-4 2016.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000009,
  "chinese": "乌镇是浙江的一座古老水镇，坐落在京杭大运河畔。这是一处迷人的地方，有许多古桥、中式旅店和餐馆。在过去一千年里，乌镇的水系和生活方式并未经历多少变化，是一座展现古文明的博物馆。乌镇所有房屋都用石木建造。数百年来，当地人沿着河边建起了住宅和集市。无数宽敞美丽的庭院藏身于屋舍之间，游客们每到一处都会有惊喜的发现。",
  "reference": "",
  "source": "CET-4 2016.06 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000010,
  "chinese": "长江是亚洲最长、世界上第三长的河流。长江流经多种不同的生态系统，是诸多濒危物种的栖息地，灌溉了中国五分之一的土地。长江流域(river basin )居住着三分之一的人口。长江在中国历史、文化和经济上起着很大的作用。长江三角洲(delta)产出多达20%的中国国民生产总值。几千年来，长江一直被用于供水、运输和工业生产。长江上还坐落着世界最大的水电站。",
  "reference": "",
  "source": "CET-4 2017.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000011,
  "chinese": "珠江是华南一大河系，流经广州市，是中国第三长的河流，仅次于长江和黄河。珠江三角洲（delta）是中国最发达的地区之一，面积约 11,000 平方公里。它在面积和人口方面也是世界上最大的城市聚集区。珠江三角洲九个最大城市共有 5,700 多万人口。上世纪 70 年代末中国改革开放以来，珠江三角洲已成为中国和世界主要经济区域和制造中心之一。",
  "reference": "",
  "source": "CET-4 2017.06 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000012,
  "chinese": "泰山位于山东省西部。海拔 1500余米,方圆约 400平方公里。泰山不仅雄伟壮观,而且是一座历史文化名山,过去3000多年一直是人们前往朝拜的地方。据记载,共有 72 位帝王曾来此游览。许多作家到泰山获取灵感,写诗作文,艺术家也来此绘画。山上因此留下了许许多多的文物古迹。泰山如今已成为中国一处主要的旅游景点。",
  "reference": "",
  "source": "CET-4 2017.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000013,
  "chinese": "华山位于华阴市，距西安 120 公里。华山是秦岭的一部分，秦岭不仅分割陕南与陕北，也分隔华南与华北。与从前人们常去朝拜的泰山不同，华山过去很少有人光临，因为上山的道路极其危险。然而，希望长寿的人却经常上山，因为山上生长着许多草药，特别是一些稀有的药草。自上世纪 90 年代安装缆车以来，参观人数大大增加。",
  "reference": "",
  "source": "CET-4 2017.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000014,
  "chinese": "黄山位于安徽省南部。它风景独特，尤以其日出和云海著称。要欣赏大山的宏伟壮丽，通常得向上看。但要欣赏黄山美景，得向下看。黄山的湿润气候有利于茶树生成，是中国主要产茶地之一。这里还有许多温泉，其泉水有助于防治皮肤病。黄山是中国主要旅游目的地之一，也是摄影和传统国画最受欢迎的主题。",
  "reference": "",
  "source": "CET-4 2017.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000015,
  "chinese": "过去，乘飞机出行对大多数中国人来说是难以想象的。如今，随着经济的发展和生活水平的提高，越来越多的中国人包括许多农民和外出务工人员都能乘飞机出行。他们可以乘飞机到达所有大城市，还有很多城市也在筹建机场。航空服务不断改进，而且经常会有廉价机票。近年来，节假日期间选择乘飞机外出旅游的人数在不断增加。",
  "reference": "",
  "source": "CET-4 2018.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000016,
  "chinese": "公交车曾是中国人出行的主要交通工具。近年来，由于私家车数量不断增多，城市的交通问题越来越严重。许多城市为了鼓励更多人乘坐公交车出行，一直在努力改善公交车的服务质量。车辆的设施不断更新，车速也有了显著提高。然而，公交车的票价却依然相当低廉。现在，在大多数城市，许多当地老年市民都可以免费乘坐公交车。",
  "reference": "",
  "source": "CET-4 2018.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000017,
  "chinese": "近年来，中国有越来越多的城市开始建设地铁。发展地铁有助于减少城市的交通拥堵和空气污染。 地铁具有安全、快捷和舒适的优点。越来越多的人选择地铁作为每天上班或上学的主要交通工具。如今，在中国乘坐地铁正变得越来越方便。在有些城市里，乘客只需用卡或手机就可以乘坐地铁。许多当地老年市民还可以免费乘坐地铁。",
  "reference": "",
  "source": "CET-4 2018.06 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000018,
  "chinese": "由于通信网络的快速发展，中国智能手机用户数量近年来以惊人度增长。这极大地改变了许多人的阅读方式。由于通信网络的快速发展，中国智能手机用户数量近年来以惊人度增长。这极大地改变了许多人的阅读方式。他们现在经常智能手机上看新闻和文章，而不买传统报刊。大量移动应用程序的开发使人们能用手机读小说和其他他们现在经常智能手机上看新闻和文章，而不买传统报刊。大量移动应用程序的开发使人们能用手机读小说和其他形式的文学作品。因此，纸质书籍的销售受到了影响。但调查显示，尽管能手机阅读市场稳步增长，超半数成年人形式的文学作品。因此，纸质书籍的销售受到了影响。但调查显示，尽管能手机阅读市场稳步增长，超半数成年人仍喜欢读纸质书。仍喜欢读纸质书。",
  "reference": "",
  "source": "CET-4 2018.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000019,
  "chinese": "越来越多的中国人现在的确离不开手机了。他们中的许多人，包括老年人，都使用手机应用程序(apps)保持联越来越多的中国人现在的确离不开手机了。他们中的许多人，包括老年人，都使用手机应用程序（apps）保持联系并拓宽朋友圈。他们也用手机购物、查找信息，因为手机便于携带。此外，使用手机应用程序通信比传统电话便系并拓宽朋友圈。他们也用手机购物、查找信息，因为手机便于携带。此外，使用手机应用程序通信比传统电话便宜。然而，这种新趋势导致人们在社交时过度依赖手机。事实上，一些年轻人已经变得十分上瘾，以至于忽视了与宜。然而，这种新趋势导致人们在社交时过度依赖手机。事实上，一些年轻人已经变得十分上瘾，以至于忽视了与家人和朋友面对面的交流。家人和朋友面对面的交流。",
  "reference": "",
  "source": "CET-4 2018.12 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000020,
  "chinese": "过去几年里，移动支付市场在中国蓬勃发展。随着移动互联网的出现，手机购物逐18 30渐成为一种趋势。18 到 30 岁的年轻人构成了移动支付市场的最大群体。由于现在用手机付款很容易，许多消费者在购物时宁愿用手机付款，而不愿用现金或信用卡。为了鼓励人们多消费，许多商店给使用移动支付的顾客打折。专家预测，中国移动支付市场未来仍有很大发展潜力。",
  "reference": "",
  "source": "CET-4 2018.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000021,
  "chinese": "i:r ilf\\$jt-BJ:iA'1M��JJ r1:, ?ifittH�r�JJJ 1�Jfltff fmf11�-0u�中国家庭十分重视孩子的教育。许多父母认为应该努力工作，确保孩子受到良好教育。他们不仅非常情愿为孩子的教育投资，而且花很多时间督促他们学习。多数家长希望孩子能上名牌大学。由于改革3f:!t,�\\*•\\$�2\\*fm�a-=fJJJm1���������3tffi:JJi 13, V.H.f.ii:;ltt'R,lf ii:M:i!@�JJ ,ft!!fl1M开放，越来越多的家长能送孩子到国外学习或参与国际交流项目，以拓宽其视野。通过这些努力，他们期\\*, ,i m1 � � 1tRi ;ffi �5i'H1: mm:� 望孩子健康成长，为国家的发展和繁荣作出贡献。",
  "reference": "",
  "source": "CET-4 2019.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000022,
  "chinese": "lflffilff9��XVl��ltx1t��1i�o ffilffiff97C��'M1�F1it� A8t•o n¼lm-ftliiJ:!t#�Y 9lo 111 -r中国的家庭观念与其文化传统有关。和睦的大家庭曾非常令人羡慕。过去四代同堂并不少见。由于5X-1'�� 'iil):\\$.&A�Jls���jt-BJ:laJ-f±o �;Jc' ,X1'��.iE:r±��o ffl!HIHl\\$这个传统，许多年轻人婚后继续与父母同住。今天，这个传统正在改变。随着住房条件的改善，越来越多年轻夫妇选择与父母分开住。但他们之间的联系仍然很密切。许多老年人仍然帮着照看孙辈。年轻夫妇at fiil -BJ: , �iU�1±•;, ffi i:J:a tJcW 也抽时间探望父母，特别是在春节和中秋节等重要节日。",
  "reference": "",
  "source": "CET-4 2019.12 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000023,
  "chinese": "i:p �&�)dl9½« mtt\"1«ffl.•o i:rxtt« ff9�.��' !t't-��t£1fir' « Bit£1tlff O -=fa�\\*' Jttt-中国汉族人的全名由姓和名组成。中文姓名的特点是，姓总是在前，名跟在其后。千百年来，父姓一1ittt1tffl � �mi, Im-BJ:\\*tt\\* �� Jh!, -1&,IHJi, 1=f -1'-Y.Jc;w.i 1'-& \\*�Jt-BJ: 直世代相传。然而，如今，孩子跟母亲姓并不罕见。一般来说，名有一个或两个汉字，通常承载父母对孩子的愿望。从孩子的名字可以推断出父母希望孩子成为什么样的人，或者期望他们过什么样的生活。父母��«•tttt�f\\*IDfH�-=f-�o 非常重视给孩子取名，因为名字往往会伴随孩子一生。",
  "reference": "",
  "source": "CET-4 2019.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000024,
  "chinese": "茶拥有5,000年的历史。 传说，神农氏(Shen Nong)喝开水时，几片野树叶子落进壶里，开水顿时散发出宜人的香味。 他喝了几口，觉得很提神。 茶就这样发现了。\n自此，茶在中国开始流行。 茶园遍布全国，茶商变得富有。 昂贵、雅致的茶具成了地位的象征。今天，茶不仅是一种健康的饮品，而且是中国文化的一个组成部分。 越来越多的国际游客一边品茶，一边了解中国文化。",
  "reference": "",
  "source": "CET-4 2020.09 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000025,
  "chinese": "你如果到北京旅游，必须做两件事：一件是登长城，另一件是吃北京烤鸭。闻名遐迩的北京烤鸭曾仅限于宫廷，而现在北京数百家餐厅均有供应。\n北京烤鸭源于600 年前的明代。来自全国各地的厨师被挑选出来到京城为皇帝做饭。人们认为在皇宫做饭是一种莫大的荣誉，只有厨艺出众者才能获得这份工作。事实上,正是这些宫廷厨师使北京烤鸭的烹饪艺术日臻完善。",
  "reference": "",
  "source": "CET-4 2020.09 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000026,
  "chinese": "生活在中国不同地区的人们饮食多种多样。北方人主要吃面食，南方人大多吃米饭。在沿海地区，海鲜和淡水水产品在人们饮食中占有相当大的比例，而在其他地区人们的饮食中，肉类和奶制品更为常见。四川、湖南等省份的居民普遍爱吃辛辣食物，而江苏和浙江人更喜欢甜食。然而，因为烹饪方式各异，同类食物的味道可能会有所不同。",
  "reference": "",
  "source": "CET-4 2020.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000027,
  "chinese": "春节前夕吃团圆饭是中国人的传统。团圆饭是一年中最重要的晚餐，也是家庭团聚的最佳时机，家人生活在不同地方的家庭尤其如此。团圆饭上的菜肴丰富多样，其中有些菜肴有特殊含义。例如，鱼是不可缺少的一道菜，因为汉语中的“鱼”字和“余”字听上去一样。在中国的许多地方，饺子也是一道重要的佳肴，因为饺子象征着财富和好运。",
  "reference": "",
  "source": "CET-4 2020.12 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000028,
  "chinese": "鱼是春节前夕餐桌上不可或缺的一道菜，因为汉语中“鱼”字的发音与“余”字的发音相同。正由于这个象征性的意义，春节期间鱼也作为礼物送给亲戚朋友。鱼的象征意义据说源于中国传统文化。中国人有节省的传统，他们认为节省得愈多，就感到愈为安全。今天，尽管人们愈来愈富裕了，但他们仍然认为节省是一种值得弘扬的美德。",
  "reference": "",
  "source": "CET-4 2020.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000029,
  "chinese": "铁观音(Tieguanyin)是中国最受欢迎的茶之一,原产于福建省安溪县西坪镇,如今安溪全县普遍种植,但该县不同地区生产的铁观音又各具风味。铁观音一年四季均可采摘,尤以春秋两季采摘的茶叶品质最佳。铁观音的加工非常复杂,需要专门的技术和丰富的经验。铁观音含有多种维生素,喝起来口感独特。常饮铁观音有助于预防心脏病、降低血压、增强记忆力。",
  "reference": "",
  "source": "CET-4 2021.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000030,
  "chinese": "大运河(Grand Canal)是世界上最长的人工河，北起北京，南至杭州。它是中国历史上最宏伟的工程之一。大运河始建于公元前4世纪，公元13世纪末建成。修建之初是为了运输粮食，后来也用于运输其他商品。大运河沿线区域逐渐发展成为中国的工商业中心。长久以来，大运河对中国的经济发展发挥了重要作用，有力地促进了南北地区之间的人员往来和文化交流。",
  "reference": "",
  "source": "CET-4 2021.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000031,
  "chinese": "坎儿井(Karez)是新疆干旱地区的一种水利系统，由地下渠道将水井连接而成。该系统将春夏季节渗入(seep into)地下的大量雨水及积雪融水收集起来，通过山体的自然坡度引到地面，用于灌溉农田和满足人们的日常用水需求。坎儿井减少了水在地面的蒸发(evaporation)，对地表破坏很小，因而有效地保护了自然资源与生态环境。坎儿井体现了我国人民与自然和谐共存的智慧，是对人类文明的一大贡献。",
  "reference": "",
  "source": "CET-4 2021.12 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000032,
  "chinese": "都江堰 (Dujiangyan) 坐落在成都平原西部的岷江上, 距成都市约 50 公里, 始建于公元前三世纪。它的独特之处在于无需用堤坝调控水流。两千多年来, 都江堰一直有效地发挥着防洪与灌溉作用, 使成都平原成为旱涝保收的沃土和中国最重要的粮食产地之一。都江堰工程体现了我国人民与自然和谐共存的智慧, 是全世界年代最久、仍在使用、无坝控水的水利工程。",
  "reference": "",
  "source": "CET-4 2021.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000033,
  "chinese": "从前有个农夫嫌他种的禾苗长得慢，就到地里把禾苗一株株地拔高了一点。回家后他对家人说：“今天可真把我累坏了！但我总算让禾苗一下子长高了。”他儿子到地里去一看，禾苗都已死光了。\n现在有些家长急于让孩子成功，往往步那个农夫的后尘，搞得孩子苦不堪言，却不见孩子学业长进。这样的家长是否该对这个问题有所醒悟，让孩子自然成长呢？。",
  "reference": "",
  "source": "CET-4 2022.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000034,
  "chinese": "从前有个人养了一群羊。一天早上他准备出去放羊，发现少了一只。他仔细一看，看到羊栏（sheepfold）上有个窟窿。显然，夜间有狼钻进羊圈叼走了羊。\n邻居劝他修羊栏，可是他不听。\n第二天，他发现狼又通过窟窿叼走一只羊。他想起邻居的话，就赶快堵上窟窿，把羊栏补好。此后，他的羊再也没有被狼叼走。\n故事告诉我们:出了问题及时补救，可以防止蒙受更大损失。",
  "reference": "",
  "source": "CET-4 2022.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000035,
  "chinese": "太极拳(Taijiquan)起源于中国古代,是中国武术(martial art)的一个重要分支。练太极拳最初是为了自卫,现在是促进身心健康的有效锻炼方式。大量研究表明,这种锻炼方式有助于保持力量、灵活性和平衡力,并减少压力和焦虑。太极拳练习起来既容易又愉快,通过轻柔、流畅的动作,促使心情平静、头脑清晰。今天,太极拳已经传播到世界各地,深受广大健身者的喜爱。",
  "reference": "",
  "source": "CET-4 2022.09 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000036,
  "chinese": "按照中国民间的传统习俗,春节期间长辈通常会给孩子发红包，俗称发压岁钱(lucky money),以表达 对孩子的祝福，祝他们好运。如今，红包不仅是给孩子的礼物，而且经常也是给长辈或亲朋好友的礼物。近年来，随着微信用户数量的增加，微信红包变得愈加流行。欢度春节时，人们经常互发微信红包表达问候。这无疑是一种与远方亲友联系的便捷方式。",
  "reference": "",
  "source": "CET-4 2022.09 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000037,
  "chinese": "戏曲是一种中国传统的艺术形式，可以追溯到唐朝。中国戏曲吸引观众的一大特色是其独具风格的脸谱(facialPainting) 。脸谱代表不同角色的性格和命运。观众通过观察脸谱能够更好地理解这些角色的 故事。欣赏戏曲是中国人特别是老年人的一大乐趣。为了吸引更多的年轻观众，传统戏曲正在不断地发 展和创新。如今,越来越多的外国观众也喜欢中国戏曲。",
  "reference": "",
  "source": "CET-4 2022.09 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000038,
  "chinese": "在中国农历中，立秋(StartofAutumn)意味着夏天的结束和秋天的开始。立秋带来的首先是天气的变化,气温逐渐下降。人们看到树叶开始变黄飘落时,知道秋天已经来临,这就是所谓的“一叶知秋”。但此时酷热的天气并未完全结束,高温通常还会持续一段时间,被称为“秋老虎”。立秋对农民意义重大,这时各种秋季作物迅速生长、开始成熟,收获的季节即将到来。",
  "reference": "",
  "source": "CET-4 2022.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000039,
  "chinese": "立春(Start of Spring)在中国农历中表示春天的开始。立春之后,白天变得更长,天气也愈发温暖,万物开始复苏,大地充满生机。人们常说“一年之计在于春”,农民在这个时节开始播种,为全年的丰收打下基础。中国人早在三千年前就已开始在立春这一天举行庆祝活动。数百年来,迎春一直是民间的重要习俗。在春暖花开的日子里，人们常常外出游玩，欣赏春天的美景。",
  "reference": "",
  "source": "CET-4 2022.12 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000040,
  "chinese": "冬至(Winter Solstice)是全年白昼最短、黑夜最长的一天,标志着一年中最寒冷时节的开始。冬至过后,气温越来越低,人们的户外活动逐渐减少。农民地里活儿不多,主要忙于灌溉系统的维护和农作物的防冻,同时为来年春天播种做准备。\n中国人历来很重视冬至,许多地方都把冬至当作一个节日,庆祝方式各地不尽相同。北方人有冬至吃饺子(jiaozi)的习俗，南方人有冬至吃汤圆(tangyuan)的传统。",
  "reference": "",
  "source": "CET-4 2022.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000041,
  "chinese": "近年来,越来越多的年轻人喜爱各种形式的自助旅游。许多自助旅游者选择徒步或骑自行车出游。他们自己设计路线,自带帐篷、厨具以及其他必备的生活用品。在旅途中,自助旅游者经常能够发现一些新的美丽景点,但有时也会遇见意想不到的困难或突发事件。游客在旅行中拥抱自然、欣赏美景,同时也增强了自己克服困难的勇气和野外生存的能力。",
  "reference": "",
  "source": "CET-4 2023.03 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000042,
  "chinese": "随着生活水平的提高，更多人开始加入到自驾游的行列之中。自驾游者既可驾驶自家车也可借车或租车出游。司机可能是车主或结伴出游者。自驾游与传统的组团旅游不同,它能够更好地满足旅游者的个性化需求，使他们更好地享受旅游的过程。自驾游尤其受到年轻出游者的欢迎。年轻人追求独立自由的生活,而自驾游恰好满足了他们的这一需求。",
  "reference": "",
  "source": "CET-4 2023.03 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000043,
  "chinese": "近年来，越来越多的城市居民为农村的田园风光所吸引,利用节假日到乡村旅游。他们住在农民家中,品尝具有当地风味的农家饭菜。有些游客还参与采摘瓜果等活动,亲身感受收获的喜悦。乡村旅游能够有效地帮助游客舒缓压力,放松心情,增进身心健康。实际上,这种旅游形式不仅能使城市游客受益,同时也能增加农民的收入,促进农村经济发展。",
  "reference": "",
  "source": "CET-4 2023.03 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000044,
  "chinese": "中国越来越重视终身教育,发展继续教育是构建终身教育体系的有效途径。高校作为人才培养的基地,拥有先进的教学理念和优越的教学资源,理应成为继续教育的办学主体。因此,近年来许多高校适应社会需求,加强与用人单位沟通，努力探索一条符合中国国情的继续教育发展新路,以使继续教育在国家发展战略中发挥更大的作用。",
  "reference": "",
  "source": "CET-4 2023.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000045,
  "chinese": "改革开放 40 多年以来,中国政府对高等教育越来越重视,高等教育已经进入稳步发展阶段。高校学生总数已接近4,700万人,位居世界第一。随着我国经济的快速发展,人民生活水平不断提高,越来越多的人渴望接受高等教育。我国高校的数量和学科专业持续增加,招生人数逐年上升,教学质量也在不断改进,为更多年轻人创造了接受高等教育的机会。",
  "reference": "",
  "source": "CET-4 2023.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000046,
  "chinese": "中国政府一直大力推行义务教育(compulsory education)，以使每个儿童都享有受教育的机会。自1986年《义务教育法》生效以来,经过不懈努力,实现了在全国推行义务教育的目标。如今,在中国,儿童年满六周岁开始上小学,从小学到初中一共接受九年义务教育。从 2008 年秋季学期开始,义务教育阶段学生无须缴纳学费。随着一系列教育改革举措的实施,中国义务教育的质量也有显著提高。",
  "reference": "",
  "source": "CET-4 2023.06 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000047,
  "chinese": "中国政府十分重视人民的健康饮食(diet)。通过大力提倡健康饮食,人们对合理营养增进健康的重要性有了更加深刻的认识。“吃得安全、吃得营养、吃得健康”是人民对美好生活的基本需要,是提升人民幸福感的必然要求,也为食品产业的发展提供了新机遇。目前,各级政府都在采取多种举措确保人民饮食健康,推进健康中国的建设。",
  "reference": "",
  "source": "CET-4 2023.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000048,
  "chinese": "改革开放以来，中国人民生活水平不断提高，这在人们的饮食(diet)变化上得到充分体现。如今，人们不再满足于吃得饱，而是追求吃得更加安全、更加营养、更加健康，食物也愈来愈丰富多样，不再限于本地的农产品。物流业(logistics industry)的发展使人们很容易品尝到全国各地的特产。毫无疑问，食品质量与饮食结构的改善为增进人们健康提供了有力的保障。",
  "reference": "",
  "source": "CET-4 2023.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000049,
  "chinese": "四合院(siheyuan)是中国一种传统的住宅建筑,其特点是房屋建造在一个院子的四周,将院子合围在中间.四合院通常冬暖夏凉,环境舒适,尤其适合大家庭居住.四合院在中国各地有多种类型,其中以北京的四合院最为典型.如今,随着现代城市的发展,传统的四合院已逐渐减少,但因其独特的建筑风格,四合院对中国文化的传承和中国历史的研究具有重要意义.",
  "reference": "",
  "source": "CET-4 2024.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000050,
  "chinese": "农历（thelunarcalendar）起源于数千年前的中国，根据太阳和月亮的运行规律制定。长期以来，农历在农业生产和人们日常生活中发挥着重要作用。古人依据农历记录日期、安排农活，以便最有效地利用自然资源和气候条件，提高农作物的产量和质量。中国的春节、中秋节等传统节日的日期都基于农历。农历是中国传统文化的重要组成部分，当今依然广为使用。",
  "reference": "",
  "source": "CET-4 2024.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000051,
  "chinese": "汉语中的“福”字（the character fu）表示幸福和好运，是中国传统文化中最常用的吉祥（auspicious）符号之一。人们通常将一个大大的福字写在红纸上，寓意期盼家庭幸福、社会安定、国家昌盛。春节贴福字是民间由来已久的习俗。为了欢庆春节，家家户户都会将福字贴在门上或墙上，表达对幸福生活的向往、对美好未来的期待。人们有时还将福字倒过来贴，表示幸福已到、好运已到。",
  "reference": "",
  "source": "CET-4 2024.06 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000052,
  "chinese": "中国政府十分重视环境保护。近年来，中国在减少空气、水和土壤污染上取得了显著成效。为了不断改善人们的生活环境，中国采取了一系列有效措施，包括大力发展清洁能源，改善公共交通，推广共享单车，实施垃圾分类。通过这些措施，中国的城市和农村正在绿起来、美起来。中国还积极参与国际合作，为全球环境保护做出了重要贡献。",
  "reference": "",
  "source": "CET-4 2024.12 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000053,
  "chinese": "近年来，中国新能源汽车产业发展迅速。目前，中国新能源汽车年产量已高达近千万辆，占全球市场份额超过 60%，出口量不断创出新高。中国政府通过加大资金投入和政策引导，鼓励新能源汽车企业进行技术创新，不断提高产品在市场上的竞争力。中国新能源汽车产业的发展不仅有力推动了国内经济发展，也为全球新能源利用和环境保护做出了积极贡献。",
  "reference": "",
  "source": "CET-4 2024.12 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000054,
  "chinese": "敦煌莫高窟（Mogao Grottoes）数字展示中心于2014年开放启用，是莫高窟保护利用工程的重要组成部分。展示中心采用数字技术和多媒体展示手段，使游客进入洞窟参观之前就能了解莫高窟的历史文化，鉴赏莫高窟的艺术经典。这将减少开放洞窟的数量，缩短游客在洞窟内的逗留时间，减轻参观对莫高窟造成的影响，以使这一世界文化遗产得到妥善保护、长久利用。",
  "reference": "",
  "source": "CET-4 2024.12 第3套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000055,
  "chinese": "被誉为 “杂交水稻（hybrid rice）之父” 的袁隆平和他的科研团队克服重重困难，研发出了一种超级杂交水稻。这项技术获得了举世公认的巨大成功。通过这项技术的应用，水稻抗旱抗病能力更强，能适应不同的气候和土壤条件，产量可提高 20-30%. 超级杂交水稻营养丰富，口感更佳。目前，这项技术已经在许多国家得到广泛应用，为全球粮食安全做出了重大贡献。",
  "reference": "",
  "source": "CET-4 2025.06 第1套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000056,
  "chinese": "近年来，中国东北地区正在大力开发冰雪资源。例如，哈尔滨利用丰富的冰雪资源打造了极具地方特色的“冰雪大世界”，让游客在欣赏冰雪之美的同时也能体验当地独特的民俗文化。如今，曾令人畏惧的冰天雪地正吸引着四面八方的游客，成为深受欢迎的旅游胜地。冰雪旅游业正为当地的经济发展做出越来越大的贡献。",
  "reference": "",
  "source": "CET-4 2025.06 第2套",
  "keywords": [],
  "acceptableAnswers": []
},
{
  "id": 1779400000057,
  "chinese": "近年来，中国越来越多的城市着力打造 “15 分钟便民生活圈（convenient living circles）”。社区居民步行 15 分钟就能享受到日常所需的公共服务。生活圈内建有便利店、公园、健身场地、图书馆、学校、社区食堂、诊所等。生活圈的建立能够为居民提供更加便利、舒适、友好、愉悦的生活环境，更好地满足城市居民多元化的日常生活服务需求，提升居民的生活品质和幸福感。",
  "reference": "",
  "source": "CET-4 2025.06 第3套",
  "keywords": [],
  "acceptableAnswers": []
}
]
export default translationsData
