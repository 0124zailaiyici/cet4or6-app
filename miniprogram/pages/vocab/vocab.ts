import readingsData from '../../data/readings'
import { applyTheme, getDarkMode } from '../../utils/theme'
import { lookupWord } from '../../utils/api'

interface IVocabWord {
  word: string
  phonetic: string
  definition: string
  chn: string
  source: string
  status: 'new' | 'learning' | 'review' | 'master'
  correctStreak: number
}

interface IVocabData {
  words: IVocabWord[]
  filteredWords: IVocabWord[]
  tab: number
  mastered: number
  learning: number
  reviewCount: number
  darkMode: boolean
  gameWord: IVocabWord | null
  gameWordIdx: number
  gameTotal: number
  gameOptions: string[]
  gameIndex: number
  gameCorrect: number
  lookingUp: boolean
  gameLoading: boolean
  gameAnswer: string
}

interface IVocabMethods {
  switchTab(e: WechatMiniprogram.TouchEvent): void
  startGame(e: WechatMiniprogram.TouchEvent): void
  showGameForIdx(idx: number): Promise<void>
  pickOption(e: WechatMiniprogram.TouchEvent): void
  nextGame(): void
  closeGame(): void
  addWord(): void
  loadWords(): void
  lookupWord(e: WechatMiniprogram.TouchEvent): void
}

const ALNUM_RE = /[^a-zA-Z]/g
const STOP_WORDS = new Set([
  'the','and','for','that','this','with','from','have','were','their','they','about','which','been','would','there','could','these','those','also','between','other','through','during','after','before','people','first','many','years','more','because','into','over','only','each','every','some','such','just','like','most','very','well','than','then','when','where','what','both','few','while','high','late','long','near','next','once','over','same','able','much','face','name','part'
])

const WORD_BANK: Record<string, { phonetic: string; definition: string }> = {
  abandon: { phonetic: '/əˈbændən/', definition: 'v. 抛弃，放弃' },
  abolish: { phonetic: '/əˈbɒlɪʃ/', definition: 'v. 废除，取消' },
  absorb: { phonetic: '/əbˈzɔːb/', definition: 'v. 吸收；吸引' },
  abstract: { phonetic: '/ˈæbstrækt/', definition: 'adj. 抽象的；n. 摘要' },
  abundant: { phonetic: '/əˈbʌndənt/', definition: 'adj. 丰富的，充裕的' },
  accelerate: { phonetic: '/əkˈseləreɪt/', definition: 'v. 加速，促进' },
  access: { phonetic: '/ˈækses/', definition: 'n. 通道；v. 访问' },
  accomplish: { phonetic: '/əˈkʌmplɪʃ/', definition: 'v. 完成，实现' },
  accurate: { phonetic: '/ˈækjərət/', definition: 'adj. 准确的，精确的' },
  achieve: { phonetic: '/əˈtʃiːv/', definition: 'v. 达到，取得' },
  acknowledge: { phonetic: '/əkˈnɒlɪdʒ/', definition: 'v. 承认；感谢' },
  acquire: { phonetic: '/əˈkwaɪə/', definition: 'v. 获得，学到' },
  adapt: { phonetic: '/əˈdæpt/', definition: 'v. 适应；改编' },
  adequate: { phonetic: '/ˈædɪkwət/', definition: 'adj. 足够的，适当的' },
  adjust: { phonetic: '/əˈdʒʌst/', definition: 'v. 调整，适应' },
  administration: { phonetic: '/ədˌmɪnɪˈstreɪʃn/', definition: 'n. 管理；行政' },
  advance: { phonetic: '/ədˈvɑːns/', definition: 'v./n. 前进；进步' },
  advantage: { phonetic: '/ədˈvɑːntɪdʒ/', definition: 'n. 优势，有利条件' },
  affect: { phonetic: '/əˈfekt/', definition: 'v. 影响；感动' },
  afford: { phonetic: '/əˈfɔːd/', definition: 'v. 负担得起' },
  aggressive: { phonetic: '/əˈɡresɪv/', definition: 'adj. 侵略的；好斗的' },
  allocate: { phonetic: '/ˈæləkeɪt/', definition: 'v. 分配，拨出' },
  alternative: { phonetic: '/ɔːlˈtɜːnətɪv/', definition: 'n. 替代方案；adj. 替代的' },
  ambition: { phonetic: '/æmˈbɪʃn/', definition: 'n. 雄心，野心' },
  annual: { phonetic: '/ˈænjuəl/', definition: 'adj. 每年的；n. 年刊' },
  anticipate: { phonetic: '/ænˈtɪsɪpeɪt/', definition: 'v. 预期，期望' },
  anxiety: { phonetic: '/æŋˈzaɪəti/', definition: 'n. 焦虑，担忧' },
  apparent: { phonetic: '/əˈpærənt/', definition: 'adj. 明显的；表面的' },
  appeal: { phonetic: '/əˈpiːl/', definition: 'v./n. 呼吁；吸引' },
  appreciate: { phonetic: '/əˈpriːʃieɪt/', definition: 'v. 欣赏；感激' },
  approach: { phonetic: '/əˈprəʊtʃ/', definition: 'v. 接近；n. 方法' },
  appropriate: { phonetic: '/əˈprəʊpriət/', definition: 'adj. 适当的' },
  approve: { phonetic: '/əˈpruːv/', definition: 'v. 批准；赞成' },
  aspect: { phonetic: '/ˈæspekt/', definition: 'n. 方面；面貌' },
  assemble: { phonetic: '/əˈsembl/', definition: 'v. 集合；组装' },
  assess: { phonetic: '/əˈses/', definition: 'v. 评估，评定' },
  assign: { phonetic: '/əˈsaɪn/', definition: 'v. 分配；指派' },
  assist: { phonetic: '/əˈsɪst/', definition: 'v. 帮助，协助' },
  associate: { phonetic: '/əˈsəʊʃieɪt/', definition: 'v. 关联；n. 伙伴' },
  assume: { phonetic: '/əˈsjuːm/', definition: 'v. 假设；承担' },
  assure: { phonetic: '/əˈʃʊə/', definition: 'v. 使确信；保证' },
  atmosphere: { phonetic: '/ˈætməsfɪə/', definition: 'n. 大气；氛围' },
  attach: { phonetic: '/əˈtætʃ/', definition: 'v. 附上；依恋' },
  attempt: { phonetic: '/əˈtempt/', definition: 'v./n. 尝试，企图' },
  attitude: { phonetic: '/ˈætɪtjuːd/', definition: 'n. 态度；看法' },
  attract: { phonetic: '/əˈtrækt/', definition: 'v. 吸引' },
  authority: { phonetic: '/ɔːˈθɒrəti/', definition: 'n. 权威；当局' },
  available: { phonetic: '/əˈveɪləbl/', definition: 'adj. 可用的；有效的' },
  avoid: { phonetic: '/əˈvɔɪd/', definition: 'v. 避免，回避' },
  aware: { phonetic: '/əˈweə/', definition: 'adj. 意识到的' },
  barrier: { phonetic: '/ˈbæriə/', definition: 'n. 障碍；屏障' },
  behalf: { phonetic: '/bɪˈhɑːf/', definition: 'n. 代表；利益' },
  benefit: { phonetic: '/ˈbenɪfɪt/', definition: 'n. 利益；v. 受益' },
  budget: { phonetic: '/ˈbʌdʒɪt/', definition: 'n. 预算；v. 做预算' },
  campaign: { phonetic: '/kæmˈpeɪn/', definition: 'n. 运动；战役' },
  capable: { phonetic: '/ˈkeɪpəbl/', definition: 'adj. 有能力的' },
  capacity: { phonetic: '/kəˈpæsəti/', definition: 'n. 容量；能力' },
  capture: { phonetic: '/ˈkæptʃə/', definition: 'v. 捕获；俘获' },
  career: { phonetic: '/kəˈrɪə/', definition: 'n. 职业，生涯' },
  category: { phonetic: '/ˈkætəɡəri/', definition: 'n. 类别，种类' },
  challenge: { phonetic: '/ˈtʃælɪndʒ/', definition: 'n. 挑战；v. 质疑' },
  character: { phonetic: '/ˈkærəktə/', definition: 'n. 性格；角色' },
  circumstance: { phonetic: '/ˈsɜːkəmstəns/', definition: 'n. 环境；情况' },
  claim: { phonetic: '/kleɪm/', definition: 'v./n. 声称；要求' },
  collapse: { phonetic: '/kəˈlæps/', definition: 'v./n. 倒塌；崩溃' },
  colleague: { phonetic: '/ˈkɒliːɡ/', definition: 'n. 同事' },
  combat: { phonetic: '/ˈkɒmbæt/', definition: 'n./v. 战斗；对抗' },
  combination: { phonetic: '/ˌkɒmbɪˈneɪʃn/', definition: 'n. 结合；组合' },
  communicate: { phonetic: '/kəˈmjuːnɪkeɪt/', definition: 'v. 交流；传达' },
  community: { phonetic: '/kəˈmjuːnəti/', definition: 'n. 社区；团体' },
  companion: { phonetic: '/kəmˈpæniən/', definition: 'n. 同伴；伙伴' },
  compare: { phonetic: '/kəmˈpeə/', definition: 'v. 比较，对比' },
  compensate: { phonetic: '/ˈkɒmpenseɪt/', definition: 'v. 补偿；赔偿' },
  compete: { phonetic: '/kəmˈpiːt/', definition: 'v. 竞争，比赛' },
  complex: { phonetic: '/ˈkɒmpleks/', definition: 'adj. 复杂的；n. 综合体' },
  concentrate: { phonetic: '/ˈkɒnsntreɪt/', definition: 'v. 集中；专注' },
  concept: { phonetic: '/ˈkɒnsept/', definition: 'n. 概念；观念' },
  concern: { phonetic: '/kənˈsɜːn/', definition: 'n. 关切；v. 涉及' },
  conclude: { phonetic: '/kənˈkluːd/', definition: 'v. 结束；推断' },
  conduct: { phonetic: '/kənˈdʌkt/', definition: 'v. 引导；行为' },
  confidence: { phonetic: '/ˈkɒnfɪdəns/', definition: 'n. 信心；信任' },
  confirm: { phonetic: '/kənˈfɜːm/', definition: 'v. 确认；证实' },
  conflict: { phonetic: '/ˈkɒnflɪkt/', definition: 'n./v. 冲突；矛盾' },
  connect: { phonetic: '/kəˈnekt/', definition: 'v. 连接；联系' },
  conscious: { phonetic: '/ˈkɒnʃəs/', definition: 'adj. 有意识的；自觉的' },
  consequence: { phonetic: '/ˈkɒnsɪkwəns/', definition: 'n. 结果；后果' },
  conservative: { phonetic: '/kənˈsɜːvətɪv/', definition: 'adj. 保守的' },
  considerable: { phonetic: '/kənˈsɪdərəbl/', definition: 'adj. 相当大的' },
  consist: { phonetic: '/kənˈsɪst/', definition: 'v. 由…组成' },
  constant: { phonetic: '/ˈkɒnstənt/', definition: 'adj. 不断的；恒定的' },
  constitute: { phonetic: '/ˈkɒnstɪtjuːt/', definition: 'v. 组成；构成' },
  consume: { phonetic: '/kənˈsjuːm/', definition: 'v. 消费；消耗' },
  contact: { phonetic: '/ˈkɒntækt/', definition: 'n. 接触；v. 联系' },
  contain: { phonetic: '/kənˈteɪn/', definition: 'v. 包含；容纳' },
  contemporary: { phonetic: '/kənˈtemprəri/', definition: 'adj. 当代的' },
  context: { phonetic: '/ˈkɒntekst/', definition: 'n. 上下文；背景' },
  contract: { phonetic: '/ˈkɒntrækt/', definition: 'n. 合同；v. 收缩' },
  contrast: { phonetic: '/ˈkɒntrɑːst/', definition: 'n. 对比；对照' },
  contribute: { phonetic: '/kənˈtrɪbjuːt/', definition: 'v. 贡献；捐献' },
  controversy: { phonetic: '/ˈkɒntrəvɜːsi/', definition: 'n. 争议；争论' },
  convenience: { phonetic: '/kənˈviːniəns/', definition: 'n. 便利；方便' },
  conventional: { phonetic: '/kənˈvenʃənl/', definition: 'adj. 传统的；惯例的' },
  convince: { phonetic: '/kənˈvɪns/', definition: 'v. 使确信；说服' },
  cooperate: { phonetic: '/kəʊˈɒpəreɪt/', definition: 'v. 合作；配合' },
  coordinate: { phonetic: '/kəʊˈɔːdɪneɪt/', definition: 'v. 协调；调整' },
  council: { phonetic: '/ˈkaʊnsl/', definition: 'n. 委员会；理事会' },
  creative: { phonetic: '/kriˈeɪtɪv/', definition: 'adj. 创造性的' },
  crisis: { phonetic: '/ˈkraɪsɪs/', definition: 'n. 危机；紧要关头' },
  criterion: { phonetic: '/kraɪˈtɪəriən/', definition: 'n. 标准；准则' },
  crucial: { phonetic: '/ˈkruːʃl/', definition: 'adj. 关键的；决定性的' },
  cultivate: { phonetic: '/ˈkʌltɪveɪt/', definition: 'v. 培养；耕作' },
  culture: { phonetic: '/ˈkʌltʃə/', definition: 'n. 文化；文明' },
  current: { phonetic: '/ˈkʌrənt/', definition: 'adj. 当前的；n. 水流' },
  debate: { phonetic: '/dɪˈbeɪt/', definition: 'v./n. 辩论；争论' },
  decade: { phonetic: '/ˈdekeɪd/', definition: 'n. 十年' },
  decline: { phonetic: '/dɪˈklaɪn/', definition: 'v. 下降；拒绝' },
  decorate: { phonetic: '/ˈdekəreɪt/', definition: 'v. 装饰；装修' },
  decrease: { phonetic: '/dɪˈkriːs/', definition: 'v./n. 减少；降低' },
  defect: { phonetic: '/ˈdiːfekt/', definition: 'n. 缺陷；缺点' },
  define: { phonetic: '/dɪˈfaɪn/', definition: 'v. 定义；界定' },
  deliver: { phonetic: '/dɪˈlɪvə/', definition: 'v. 递送；发表' },
  demand: { phonetic: '/dɪˈmɑːnd/', definition: 'v./n. 要求；需求' },
  demonstrate: { phonetic: '/ˈdemənstreɪt/', definition: 'v. 证明；演示' },
  deny: { phonetic: '/dɪˈnaɪ/', definition: 'v. 否认；拒绝' },
  depend: { phonetic: '/dɪˈpend/', definition: 'v. 依赖；取决于' },
  depress: { phonetic: '/dɪˈpres/', definition: 'v. 使沮丧；压低' },
  derive: { phonetic: '/dɪˈraɪv/', definition: 'v. 源自；获得' },
  deserve: { phonetic: '/dɪˈzɜːv/', definition: 'v. 值得；应得' },
  despite: { phonetic: '/dɪˈspaɪt/', definition: 'prep. 尽管；不管' },
  destination: { phonetic: '/ˌdestɪˈneɪʃn/', definition: 'n. 目的地；终点' },
  detect: { phonetic: '/dɪˈtekt/', definition: 'v. 发现；探测' },
  determine: { phonetic: '/dɪˈtɜːmɪn/', definition: 'v. 决定；确定' },
  device: { phonetic: '/dɪˈvaɪs/', definition: 'n. 设备；装置' },
  discover: { phonetic: '/dɪˈskʌvə/', definition: 'v. 发现；发觉' },
  display: { phonetic: '/dɪˈspleɪ/', definition: 'v./n. 展示；陈列' },
  distinguish: { phonetic: '/dɪˈstɪŋɡwɪʃ/', definition: 'v. 区分；辨别' },
  distribute: { phonetic: '/dɪˈstrɪbjuːt/', definition: 'v. 分配；分发' },
  diverse: { phonetic: '/daɪˈvɜːs/', definition: 'adj. 多样的；不同的' },
  domestic: { phonetic: '/dəˈmestɪk/', definition: 'adj. 国内的；家庭的' },
  dominate: { phonetic: '/ˈdɒmɪneɪt/', definition: 'v. 支配；统治' },
  dominance: { phonetic: '/ˈdɒmɪnəns/', definition: 'n. 支配；优势' },
  draft: { phonetic: '/drɑːft/', definition: 'n. 草稿；v. 起草' },
  dramatic: { phonetic: '/drəˈmætɪk/', definition: 'adj. 戏剧性的；巨大的' },
  duration: { phonetic: '/djuˈreɪʃn/', definition: 'n. 持续时间' },
  dynamic: { phonetic: '/daɪˈnæmɪk/', definition: 'adj. 动态的；有活力的' },
  economy: { phonetic: '/ɪˈkɒnəmi/', definition: 'n. 经济；节约' },
  edit: { phonetic: '/ˈedɪt/', definition: 'v. 编辑；剪辑' },
  effect: { phonetic: '/ɪˈfekt/', definition: 'n. 效果；影响' },
  eliminate: { phonetic: '/ɪˈlɪmɪneɪt/', definition: 'v. 消除；淘汰' },
  emerge: { phonetic: '/ɪˈmɜːdʒ/', definition: 'v. 出现；浮现' },
  emotion: { phonetic: '/ɪˈməʊʃn/', definition: 'n. 情感；情绪' },
  emphasis: { phonetic: '/ˈemfəsɪs/', definition: 'n. 强调；重点' },
  employ: { phonetic: '/ɪmˈplɔɪ/', definition: 'v. 雇用；使用' },
  enable: { phonetic: '/ɪˈneɪbl/', definition: 'v. 使能够；启用' },
  encounter: { phonetic: '/ɪnˈkaʊntə/', definition: 'v./n. 遭遇；邂逅' },
  encourage: { phonetic: '/ɪnˈkʌrɪdʒ/', definition: 'v. 鼓励' },
  engage: { phonetic: '/ɪnˈɡeɪdʒ/', definition: 'v. 从事；吸引' },
  enhance: { phonetic: '/ɪnˈhɑːns/', definition: 'v. 提高；增强' },
  enormous: { phonetic: '/ɪˈnɔːməs/', definition: 'adj. 巨大的；庞大的' },
  enterprise: { phonetic: '/ˈentəpraɪz/', definition: 'n. 企业；事业' },
  environment: { phonetic: '/ɪnˈvaɪrənmənt/', definition: 'n. 环境' },
  equip: { phonetic: '/ɪˈkwɪp/', definition: 'v. 装备；配备' },
  equivalent: { phonetic: '/ɪˈkwɪvələnt/', definition: 'adj. 等价的；n. 等价物' },
  essential: { phonetic: '/ɪˈsenʃl/', definition: 'adj. 本质的；必要的' },
  establish: { phonetic: '/ɪˈstæblɪʃ/', definition: 'v. 建立' },
  evaluate: { phonetic: '/ɪˈvæljueɪt/', definition: 'v. 评估；评价' },
  evidence: { phonetic: '/ˈevɪdəns/', definition: 'n. 证据；迹象' },
  evolution: { phonetic: '/ˌiːvəˈluːʃn/', definition: 'n. 进化；演变' },
  examine: { phonetic: '/ɪɡˈzæmɪn/', definition: 'v. 检查；考试' },
  exceed: { phonetic: '/ɪkˈsiːd/', definition: 'v. 超过；超出' },
  exception: { phonetic: '/ɪkˈsepʃn/', definition: 'n. 例外；除外' },
  exchange: { phonetic: '/ɪksˈtʃeɪndʒ/', definition: 'v./n. 交换；交流' },
  exclude: { phonetic: '/ɪkˈskluːd/', definition: 'v. 排除；排斥' },
  exercise: { phonetic: '/ˈeksəsaɪz/', definition: 'n./v. 锻炼；运用' },
  exhibit: { phonetic: '/ɪɡˈzɪbɪt/', definition: 'v. 展出；展示' },
  exist: { phonetic: '/ɪɡˈzɪst/', definition: 'v. 存在；生存' },
  expand: { phonetic: '/ɪkˈspænd/', definition: 'v. 扩大；膨胀' },
  expect: { phonetic: '/ɪkˈspekt/', definition: 'v. 预期；期望' },
  expense: { phonetic: '/ɪkˈspens/', definition: 'n. 花费；代价' },
  experiment: { phonetic: '/ɪkˈsperɪmənt/', definition: 'n. 实验；试验' },
  expert: { phonetic: '/ˈekspɜːt/', definition: 'n. 专家；adj. 熟练的' },
  exploit: { phonetic: '/ɪkˈsplɔɪt/', definition: 'v. 开发；利用' },
  explore: { phonetic: '/ɪkˈsplɔː/', definition: 'v. 探索；探究' },
  export: { phonetic: '/ˈekspɔːt/', definition: 'v./n. 出口；输出' },
  expose: { phonetic: '/ɪkˈspəʊz/', definition: 'v. 暴露；揭露' },
  extend: { phonetic: '/ɪkˈstend/', definition: 'v. 扩展；延伸' },
  extensive: { phonetic: '/ɪkˈstensɪv/', definition: 'adj. 广泛的；大量的' },
  external: { phonetic: '/ɪkˈstɜːnl/', definition: 'adj. 外部的；外在的' },
  facility: { phonetic: '/fəˈsɪləti/', definition: 'n. 设施；能力' },
  factor: { phonetic: '/ˈfæktə/', definition: 'n. 因素；要素' },
  faculty: { phonetic: '/ˈfæklti/', definition: 'n. 才能；全体教员' },
  feature: { phonetic: '/ˈfiːtʃə/', definition: 'n. 特征；v. 以…为特色' },
  finance: { phonetic: '/ˈfaɪnæns/', definition: 'n. 财务；金融' },
  flexible: { phonetic: '/ˈfleksəbl/', definition: 'adj. 灵活的；柔韧的' },
  forecast: { phonetic: '/ˈfɔːkɑːst/', definition: 'v./n. 预测；预报' },
  foundation: { phonetic: '/faʊnˈdeɪʃn/', definition: 'n. 基础；基金会' },
  fraction: { phonetic: '/ˈfrækʃn/', definition: 'n. 分数；小部分' },
  framework: { phonetic: '/ˈfreɪmwɜːk/', definition: 'n. 框架；体系' },
  frequency: { phonetic: '/ˈfriːkwənsi/', definition: 'n. 频率；频繁' },
  function: { phonetic: '/ˈfʌŋkʃn/', definition: 'n. 功能；v. 运作' },
  fund: { phonetic: '/fʌnd/', definition: 'n. 基金；v. 资助' },
  fundamental: { phonetic: '/ˌfʌndəˈmentl/', definition: 'adj. 基本的；根本的' },
  generate: { phonetic: '/ˈdʒenəreɪt/', definition: 'v. 产生；生成' },
  generation: { phonetic: '/ˌdʒenəˈreɪʃn/', definition: 'n. 一代；产生' },
  global: { phonetic: '/ˈɡləʊbl/', definition: 'adj. 全球的；全面的' },
  goal: { phonetic: '/ɡəʊl/', definition: 'n. 目标；球门' },
  govern: { phonetic: '/ˈɡʌvn/', definition: 'v. 管理；统治' },
  grant: { phonetic: '/ɡrɑːnt/', definition: 'v. 授予；n. 补助金' },
  guarantee: { phonetic: '/ˌɡærənˈtiː/', definition: 'v./n. 保证；担保' },
  guidance: { phonetic: '/ˈɡaɪdns/', definition: 'n. 指导；引导' },
  identity: { phonetic: '/aɪˈdentəti/', definition: 'n. 身份；同一性' },
  ignore: { phonetic: '/ɪɡˈnɔː/', definition: 'v. 忽视；不理会' },
  illustrate: { phonetic: '/ˈɪləstreɪt/', definition: 'v. 说明；阐明' },
  image: { phonetic: '/ˈɪmɪdʒ/', definition: 'n. 图像；形象' },
  impact: { phonetic: '/ˈɪmpækt/', definition: 'n./v. 影响；冲击' },
  implement: { phonetic: '/ˈɪmplɪment/', definition: 'v. 实施；执行' },
  imply: { phonetic: '/ɪmˈplaɪ/', definition: 'v. 暗示；意味着' },
  impose: { phonetic: '/ɪmˈpəʊz/', definition: 'v. 强加；征收' },
  impress: { phonetic: '/ɪmˈpres/', definition: 'v. 给…深刻印象' },
  incident: { phonetic: '/ˈɪnsɪdənt/', definition: 'n. 事件；事变' },
  include: { phonetic: '/ɪnˈkluːd/', definition: 'v. 包括；包含' },
  indicate: { phonetic: '/ˈɪndɪkeɪt/', definition: 'v. 表明；指示' },
  individual: { phonetic: '/ˌɪndɪˈvɪdʒuəl/', definition: 'adj. 个人的；n. 个人' },
  inevitable: { phonetic: '/ɪnˈevɪtəbl/', definition: 'adj. 不可避免的' },
  influence: { phonetic: '/ˈɪnfluəns/', definition: 'n./v. 影响；感化' },
  inform: { phonetic: '/ɪnˈfɔːm/', definition: 'v. 通知；告知' },
  initial: { phonetic: '/ɪˈnɪʃl/', definition: 'adj. 最初的；初始的' },
  initiative: { phonetic: '/ɪˈnɪʃətɪv/', definition: 'n. 倡议；主动性' },
  injury: { phonetic: '/ˈɪndʒəri/', definition: 'n. 伤害；损伤' },
  innovation: { phonetic: '/ˌɪnəˈveɪʃn/', definition: 'n. 创新；革新' },
  input: { phonetic: '/ˈɪnpʊt/', definition: 'n. 输入；投入' },
  insight: { phonetic: '/ˈɪnsaɪt/', definition: 'n. 洞察力；见解' },
  inspect: { phonetic: '/ɪnˈspekt/', definition: 'v. 检查；视察' },
  inspire: { phonetic: '/ɪnˈspaɪə/', definition: 'v. 激励；鼓舞' },
  install: { phonetic: '/ɪnˈstɔːl/', definition: 'v. 安装；安置' },
  instance: { phonetic: '/ˈɪnstəns/', definition: 'n. 实例；情况' },
  institution: { phonetic: '/ˌɪnstɪˈtjuːʃn/', definition: 'n. 机构；制度' },
  instrument: { phonetic: '/ˈɪnstrəmənt/', definition: 'n. 仪器；工具' },
  insurance: { phonetic: '/ɪnˈʃʊərəns/', definition: 'n. 保险；保障' },
  intellectual: { phonetic: '/ˌɪntəˈlektʃuəl/', definition: 'adj. 智力的；n. 知识分子' },
  intelligence: { phonetic: '/ɪnˈtelɪdʒəns/', definition: 'n. 智力；情报' },
  intend: { phonetic: '/ɪnˈtend/', definition: 'v. 打算；意图' },
  intense: { phonetic: '/ɪnˈtens/', definition: 'adj. 强烈的；紧张的' },
  interact: { phonetic: '/ˌɪntərˈækt/', definition: 'v. 互动；相互作用' },
  internal: { phonetic: '/ɪnˈtɜːnl/', definition: 'adj. 内部的；国内的' },
  interpret: { phonetic: '/ɪnˈtɜːprɪt/', definition: 'v. 解释；口译' },
  interview: { phonetic: '/ˈɪntəvjuː/', definition: 'n./v. 面试；采访' },
  investigate: { phonetic: '/ɪnˈvestɪɡeɪt/', definition: 'v. 调查；研究' },
  investment: { phonetic: '/ɪnˈvestmənt/', definition: 'n. 投资；投入' },
  involve: { phonetic: '/ɪnˈvɒlv/', definition: 'v. 涉及；包含' },
  isolate: { phonetic: '/ˈaɪsəleɪt/', definition: 'v. 隔离；孤立' },
  issue: { phonetic: '/ˈɪʃuː/', definition: 'n. 问题；v. 发行' },
  journal: { phonetic: '/ˈdʒɜːnl/', definition: 'n. 期刊；日记' },
  judgement: { phonetic: '/ˈdʒʌdʒmənt/', definition: 'n. 判断；审判' },
  justify: { phonetic: '/ˈdʒʌstɪfaɪ/', definition: 'v. 证明…正当' },
  label: { phonetic: '/ˈleɪbl/', definition: 'n. 标签；v. 标注' },
  labor: { phonetic: '/ˈleɪbə/', definition: 'n./v. 劳动；努力' },
  launch: { phonetic: '/lɔːntʃ/', definition: 'v. 发射；发起' },
  legislation: { phonetic: '/ˌledʒɪsˈleɪʃn/', definition: 'n. 法规；立法' },
  leisure: { phonetic: '/ˈleʒə/', definition: 'n. 休闲；空闲' },
  liberal: { phonetic: '/ˈlɪbərəl/', definition: 'adj. 自由的；开明的' },
  maintain: { phonetic: '/meɪnˈteɪn/', definition: 'v. 维持；保养' },
  manufacture: { phonetic: '/ˌmænjuˈfæktʃə/', definition: 'v. 制造；生产' },
  massive: { phonetic: '/ˈmæsɪv/', definition: 'adj. 大量的；大规模的' },
  material: { phonetic: '/məˈtɪəriəl/', definition: 'n. 材料；adj. 物质的' },
  mature: { phonetic: '/məˈtʃʊə/', definition: 'adj. 成熟的；v. 成熟' },
  maximum: { phonetic: '/ˈmæksɪməm/', definition: 'adj./n. 最大（的）' },
  mechanism: { phonetic: '/ˈmekənɪzəm/', definition: 'n. 机制；机理' },
  mental: { phonetic: '/ˈmentl/', definition: 'adj. 精神的；心理的' },
  minimum: { phonetic: '/ˈmɪnɪməm/', definition: 'adj./n. 最小（的）' },
  minor: { phonetic: '/ˈmaɪnə/', definition: 'adj. 较小的；次要的' },
  miracle: { phonetic: '/ˈmɪrəkl/', definition: 'n. 奇迹' },
  modify: { phonetic: '/ˈmɒdɪfaɪ/', definition: 'v. 修改；调整' },
  monitor: { phonetic: '/ˈmɒnɪtə/', definition: 'v. 监控；n. 班长' },
  moral: { phonetic: '/ˈmɒrəl/', definition: 'adj. 道德的；n. 寓意' },
  motion: { phonetic: '/ˈməʊʃn/', definition: 'n. 运动；动作' },
  motivate: { phonetic: '/ˈməʊtɪveɪt/', definition: 'v. 激发；促使' },
  negative: { phonetic: '/ˈneɡətɪv/', definition: 'adj. 消极的；否定的' },
  neglect: { phonetic: '/nɪˈɡlekt/', definition: 'v./n. 忽视；疏忽' },
  negotiate: { phonetic: '/nɪˈɡəʊʃieɪt/', definition: 'v. 谈判；协商' },
  network: { phonetic: '/ˈnetwɜːk/', definition: 'n. 网络；关系网' },
  normal: { phonetic: '/ˈnɔːml/', definition: 'adj. 正常的；标准的' },
  notion: { phonetic: '/ˈnəʊʃn/', definition: 'n. 概念；看法' },
  nuclear: { phonetic: '/ˈnjuːkliə/', definition: 'adj. 核能的；核心的' },
  numerous: { phonetic: '/ˈnjuːmərəs/', definition: 'adj. 许多的；大量的' },
  object: { phonetic: '/ˈɒbdʒɪkt/', definition: 'n. 物体；v. 反对' },
  observe: { phonetic: '/əbˈzɜːv/', definition: 'v. 观察；遵守' },
  obstacle: { phonetic: '/ˈɒbstəkl/', definition: 'n. 障碍；阻碍' },
  obtain: { phonetic: '/əbˈteɪn/', definition: 'v. 获得；得到' },
  obvious: { phonetic: '/ˈɒbviəs/', definition: 'adj. 明显的；显然的' },
  occupy: { phonetic: '/ˈɒkjupaɪ/', definition: 'v. 占领；占据' },
  occur: { phonetic: '/əˈkɜː/', definition: 'v. 发生；出现' },
  operate: { phonetic: '/ˈɒpəreɪt/', definition: 'v. 操作；经营' },
  opponent: { phonetic: '/əˈpəʊnənt/', definition: 'n. 对手；反对者' },
  opportunity: { phonetic: '/ˌɒpəˈtjuːnəti/', definition: 'n. 机会' },
  oppose: { phonetic: '/əˈpəʊz/', definition: 'v. 反对；对抗' },
  option: { phonetic: '/ˈɒpʃn/', definition: 'n. 选择；选项' },
  organize: { phonetic: '/ˈɔːɡənaɪz/', definition: 'v. 组织；安排' },
  origin: { phonetic: '/ˈɒrɪdʒɪn/', definition: 'n. 起源；来源' },
  outcome: { phonetic: '/ˈaʊtkʌm/', definition: 'n. 结果；成果' },
  outlet: { phonetic: '/ˈaʊtlet/', definition: 'n. 出口；发泄途径' },
  overall: { phonetic: '/ˌəʊvərˈɔːl/', definition: 'adj. 全面的；adv. 总体上' },
  overcome: { phonetic: '/ˌəʊvəˈkʌm/', definition: 'v. 克服；战胜' },
  overlook: { phonetic: '/ˌəʊvəˈlʊk/', definition: 'v. 忽视；俯视' },
  overseas: { phonetic: '/ˌəʊvəˈsiːz/', definition: 'adj./adv. 海外的' },
  participate: { phonetic: '/pɑːˈtɪsɪpeɪt/', definition: 'v. 参加；参与' },
  particular: { phonetic: '/pəˈtɪkjələ/', definition: 'adj. 特定的；特别的' },
  partner: { phonetic: '/ˈpɑːtnə/', definition: 'n. 伙伴；搭档' },
  passion: { phonetic: '/ˈpæʃn/', definition: 'n. 热情；激情' },
  patient: { phonetic: '/ˈpeɪʃnt/', definition: 'n. 病人；adj. 耐心的' },
  pattern: { phonetic: '/ˈpætn/', definition: 'n. 模式；图案' },
  penalty: { phonetic: '/ˈpenəlti/', definition: 'n. 惩罚；罚金' },
  perceive: { phonetic: '/pəˈsiːv/', definition: 'v. 察觉；理解' },
  performance: { phonetic: '/pəˈfɔːməns/', definition: 'n. 表现；表演' },
  permanent: { phonetic: '/ˈpɜːmənənt/', definition: 'adj. 永久的；持久的' },
  permit: { phonetic: '/pəˈmɪt/', definition: 'v. 允许；n. 许可证' },
  persist: { phonetic: '/pəˈsɪst/', definition: 'v. 坚持；持续' },
  perspective: { phonetic: '/pəˈspektɪv/', definition: 'n. 观点；视角' },
  phase: { phonetic: '/feɪz/', definition: 'n. 阶段；时期' },
  phenomenon: { phonetic: '/fɪˈnɒmɪnən/', definition: 'n. 现象' },
  philosophy: { phonetic: '/fɪˈlɒsəfi/', definition: 'n. 哲学；人生观' },
  physical: { phonetic: '/ˈfɪzɪkl/', definition: 'adj. 身体的；物理的' },
  policy: { phonetic: '/ˈpɒləsi/', definition: 'n. 政策；方针' },
  political: { phonetic: '/pəˈlɪtɪkl/', definition: 'adj. 政治的' },
  pollute: { phonetic: '/pəˈluːt/', definition: 'v. 污染；玷污' },
  portion: { phonetic: '/ˈpɔːʃn/', definition: 'n. 部分；份' },
  possess: { phonetic: '/pəˈzes/', definition: 'v. 拥有；占据' },
  potential: { phonetic: '/pəˈtenʃl/', definition: 'adj. 潜在的；n. 潜力' },
  poverty: { phonetic: '/ˈpɒvəti/', definition: 'n. 贫困；贫穷' },
  practical: { phonetic: '/ˈpræktɪkl/', definition: 'adj. 实际的；实用的' },
  precious: { phonetic: '/ˈpreʃəs/', definition: 'adj. 珍贵的；宝贵的' },
  precise: { phonetic: '/prɪˈsaɪs/', definition: 'adj. 精确的；准确的' },
  predict: { phonetic: '/prɪˈdɪkt/', definition: 'v. 预测；预言' },
  prefer: { phonetic: '/prɪˈfɜː/', definition: 'v. 偏爱；更喜欢' },
  prejudice: { phonetic: '/ˈpredʒudɪs/', definition: 'n. 偏见；歧视' },
  preparation: { phonetic: '/ˌprepəˈreɪʃn/', definition: 'n. 准备；预备' },
  preserve: { phonetic: '/prɪˈzɜːv/', definition: 'v. 保存；保护' },
  pressure: { phonetic: '/ˈpreʃə/', definition: 'n. 压力；压迫' },
  prevail: { phonetic: '/prɪˈveɪl/', definition: 'v. 盛行；占上风' },
  prevent: { phonetic: '/prɪˈvent/', definition: 'v. 阻止；防止' },
  previous: { phonetic: '/ˈpriːviəs/', definition: 'adj. 先前的；以前的' },
  primary: { phonetic: '/ˈpraɪməri/', definition: 'adj. 主要的；初级的' },
  principal: { phonetic: '/ˈprɪnsəpl/', definition: 'adj. 主要的；n. 校长' },
  principle: { phonetic: '/ˈprɪnsəpl/', definition: 'n. 原则；原理' },
  prior: { phonetic: '/ˈpraɪə/', definition: 'adj. 优先的；在前的' },
  priority: { phonetic: '/praɪˈɒrəti/', definition: 'n. 优先；重点' },
  private: { phonetic: '/ˈpraɪvɪt/', definition: 'adj. 私人的；私有的' },
  privilege: { phonetic: '/ˈprɪvəlɪdʒ/', definition: 'n. 特权；优惠' },
  procedure: { phonetic: '/prəˈsiːdʒə/', definition: 'n. 程序；步骤' },
  process: { phonetic: '/ˈprəʊses/', definition: 'n. 过程；v. 处理' },
  professional: { phonetic: '/prəˈfeʃənl/', definition: 'adj. 专业的；n. 专业人士' },
  profit: { phonetic: '/ˈprɒfɪt/', definition: 'n. 利润；v. 获益' },
  progress: { phonetic: '/ˈprəʊɡres/', definition: 'n./v. 进步；进展' },
  project: { phonetic: '/ˈprɒdʒekt/', definition: 'n. 项目；v. 投射' },
  promote: { phonetic: '/prəˈməʊt/', definition: 'v. 促进；晋升' },
  prompt: { phonetic: '/prɒmpt/', definition: 'v. 促使；adj. 迅速的' },
  proof: { phonetic: '/pruːf/', definition: 'n. 证据；证明' },
  proper: { phonetic: '/ˈprɒpə/', definition: 'adj. 适当的；恰当的' },
  property: { phonetic: '/ˈprɒpəti/', definition: 'n. 财产；性质' },
  proportion: { phonetic: '/prəˈpɔːʃn/', definition: 'n. 比例；部分' },
  proposal: { phonetic: '/prəˈpəʊzl/', definition: 'n. 提议；建议' },
  prospect: { phonetic: '/ˈprɒspekt/', definition: 'n. 前景；展望' },
  protect: { phonetic: '/prəˈtekt/', definition: 'v. 保护；防卫' },
  prove: { phonetic: '/pruːv/', definition: 'v. 证明；证实' },
  provide: { phonetic: '/prəˈvaɪd/', definition: 'v. 提供；供给' },
  province: { phonetic: '/ˈprɒvɪns/', definition: 'n. 省；领域' },
  psychology: { phonetic: '/saɪˈkɒlədʒi/', definition: 'n. 心理学' },
  publish: { phonetic: '/ˈpʌblɪʃ/', definition: 'v. 出版；发表' },
  purchase: { phonetic: '/ˈpɜːtʃəs/', definition: 'v./n. 购买；采购' },
  pursue: { phonetic: '/pəˈsjuː/', definition: 'v. 追求；追逐' },
  qualify: { phonetic: '/ˈkwɒlɪfaɪ/', definition: 'v. 使合格；限定' },
  quantity: { phonetic: '/ˈkwɒntəti/', definition: 'n. 数量；大量' },
  range: { phonetic: '/reɪndʒ/', definition: 'n. 范围；v. 延伸' },
  rank: { phonetic: '/ræŋk/', definition: 'n. 等级；v. 排名' },
  rapid: { phonetic: '/ˈræpɪd/', definition: 'adj. 迅速的；快速的' },
  rate: { phonetic: '/reɪt/', definition: 'n. 比率；v. 评价' },
  rational: { phonetic: '/ˈræʃnəl/', definition: 'adj. 理性的；合理的' },
  reaction: { phonetic: '/riˈækʃn/', definition: 'n. 反应；反作用' },
  reality: { phonetic: '/riˈæləti/', definition: 'n. 现实；实际' },
  reasonable: { phonetic: '/ˈriːznəbl/', definition: 'adj. 合理的；适度的' },
  recall: { phonetic: '/rɪˈkɔːl/', definition: 'v./n. 回忆；召回' },
  recognize: { phonetic: '/ˈrekəɡnaɪz/', definition: 'v. 认出；承认' },
  recommend: { phonetic: '/ˌrekəˈmend/', definition: 'v. 推荐；建议' },
  recommendation: { phonetic: '/ˌrekəmenˈdeɪʃn/', definition: 'n. 推荐；建议' },
  recover: { phonetic: '/rɪˈkʌvə/', definition: 'v. 恢复；康复' },
  reduce: { phonetic: '/rɪˈdjuːs/', definition: 'v. 减少；降低' },
  refer: { phonetic: '/rɪˈfɜː/', definition: 'v. 参考；提及' },
  reflect: { phonetic: '/rɪˈflekt/', definition: 'v. 反映；反射' },
  reform: { phonetic: '/rɪˈfɔːm/', definition: 'v./n. 改革；改造' },
  regard: { phonetic: '/rɪˈɡɑːd/', definition: 'v. 视为；n. 关心' },
  regime: { phonetic: '/reɪˈʒiːm/', definition: 'n. 政权；体制' },
  region: { phonetic: '/ˈriːdʒən/', definition: 'n. 地区；区域' },
  register: { phonetic: '/ˈredʒɪstə/', definition: 'v./n. 登记；注册' },
  regulate: { phonetic: '/ˈreɡjuleɪt/', definition: 'v. 管理；调节' },
  reject: { phonetic: '/rɪˈdʒekt/', definition: 'v. 拒绝；驳回' },
  relate: { phonetic: '/rɪˈleɪt/', definition: 'v. 关联；叙述' },
  release: { phonetic: '/rɪˈliːs/', definition: 'v./n. 释放；发布' },
  relevant: { phonetic: '/ˈreləvənt/', definition: 'adj. 相关的；切题的' },
  relief: { phonetic: '/rɪˈliːf/', definition: 'n. 减轻；救济' },
  rely: { phonetic: '/rɪˈlaɪ/', definition: 'v. 依赖；信赖' },
  remain: { phonetic: '/rɪˈmeɪn/', definition: 'v. 保持；剩余' },
  remarkable: { phonetic: '/rɪˈmɑːkəbl/', definition: 'adj. 显著的；非凡的' },
  remedy: { phonetic: '/ˈremədi/', definition: 'n. 补救；v. 纠正' },
  remind: { phonetic: '/rɪˈmaɪnd/', definition: 'v. 提醒；使想起' },
  remote: { phonetic: '/rɪˈməʊt/', definition: 'adj. 遥远的；偏僻的' },
  remove: { phonetic: '/rɪˈmuːv/', definition: 'v. 移除；去除' },
  replace: { phonetic: '/rɪˈpleɪs/', definition: 'v. 取代；替换' },
  represent: { phonetic: '/ˌreprɪˈzent/', definition: 'v. 代表；表示' },
  reproduce: { phonetic: '/ˌriːprəˈdjuːs/', definition: 'v. 繁殖；复制' },
  reputation: { phonetic: '/ˌrepjuˈteɪʃn/', definition: 'n. 名誉；声望' },
  request: { phonetic: '/rɪˈkwest/', definition: 'v./n. 请求；要求' },
  require: { phonetic: '/rɪˈkwaɪə/', definition: 'v. 需要；要求' },
  research: { phonetic: '/rɪˈsɜːtʃ/', definition: 'n./v. 研究；调查' },
  resemble: { phonetic: '/rɪˈzembl/', definition: 'v. 相似；像' },
  resolve: { phonetic: '/rɪˈzɒlv/', definition: 'v. 解决；决心' },
  resource: { phonetic: '/rɪˈsɔːs/', definition: 'n. 资源；财力' },
  respond: { phonetic: '/rɪˈspɒnd/', definition: 'v. 回应；响应' },
  restore: { phonetic: '/rɪˈstɔː/', definition: 'v. 恢复；修复' },
  restrict: { phonetic: '/rɪˈstrɪkt/', definition: 'v. 限制；约束' },
  restrictive: { phonetic: '/rɪˈstrɪktɪv/', definition: 'adj. 限制的' },
  retain: { phonetic: '/rɪˈteɪn/', definition: 'v. 保留；保持' },
  reveal: { phonetic: '/rɪˈviːl/', definition: 'v. 揭示；透露' },
  revenue: { phonetic: '/ˈrevənjuː/', definition: 'n. 收入；税收' },
  reverse: { phonetic: '/rɪˈvɜːs/', definition: 'v. 逆转；adj. 相反的' },
  revise: { phonetic: '/rɪˈvaɪz/', definition: 'v. 修订；复习' },
  revolution: { phonetic: '/ˌrevəˈluːʃn/', definition: 'n. 革命；变革' },
  reward: { phonetic: '/rɪˈwɔːd/', definition: 'n. 奖励；v. 奖赏' },
  rhythm: { phonetic: '/ˈrɪðəm/', definition: 'n. 节奏；韵律' },
  route: { phonetic: '/ruːt/', definition: 'n. 路线；途径' },
  rural: { phonetic: '/ˈrʊərəl/', definition: 'adj. 农村的；乡下的' },
  sacrifice: { phonetic: '/ˈsækrɪfaɪs/', definition: 'v./n. 牺牲；献祭' },
  safety: { phonetic: '/ˈseɪfti/', definition: 'n. 安全；平安' },
  sample: { phonetic: '/ˈsɑːmpl/', definition: 'n. 样本；v. 采样' },
  scale: { phonetic: '/skeɪl/', definition: 'n. 规模；刻度' },
  schedule: { phonetic: '/ˈʃedjuːl/', definition: 'n. 时间表；v. 安排' },
  scheme: { phonetic: '/skiːm/', definition: 'n. 计划；方案' },
  scholarship: { phonetic: '/ˈskɒləʃɪp/', definition: 'n. 奖学金' },
  security: { phonetic: '/sɪˈkjʊərəti/', definition: 'n. 安全；保障' },
  segment: { phonetic: '/ˈseɡmənt/', definition: 'n. 部分；片段' },
  select: { phonetic: '/sɪˈlekt/', definition: 'v. 选择；挑选' },
  separate: { phonetic: '/ˈseprət/', definition: 'v. 分隔；adj. 分开的' },
  sequence: { phonetic: '/ˈsiːkwəns/', definition: 'n. 顺序；序列' },
  series: { phonetic: '/ˈsɪəriːz/', definition: 'n. 系列；连续' },
  session: { phonetic: '/ˈseʃn/', definition: 'n. 会议；学期' },
  setting: { phonetic: '/ˈsetɪŋ/', definition: 'n. 环境；设置' },
  severe: { phonetic: '/sɪˈvɪə/', definition: 'adj. 严重的；剧烈的' },
  shelter: { phonetic: '/ˈʃeltə/', definition: 'n. 庇护所；v. 遮蔽' },
  shift: { phonetic: '/ʃɪft/', definition: 'v./n. 转移；转变' },
  signal: { phonetic: '/ˈsɪɡnəl/', definition: 'n. 信号；v. 发信号' },
  significance: { phonetic: '/sɪɡˈnɪfɪkəns/', definition: 'n. 意义；重要性' },
  significant: { phonetic: '/sɪɡˈnɪfɪkənt/', definition: 'adj. 重要的；显著的' },
  similar: { phonetic: '/ˈsɪmələ/', definition: 'adj. 相似的；类似的' },
  simplify: { phonetic: '/ˈsɪmplɪfaɪ/', definition: 'v. 简化；精简' },
  site: { phonetic: '/saɪt/', definition: 'n. 场所；地点' },
  solution: { phonetic: '/səˈluːʃn/', definition: 'n. 解决方案；溶液' },
  source: { phonetic: '/sɔːs/', definition: 'n. 来源；出处' },
  specific: { phonetic: '/spəˈsɪfɪk/', definition: 'adj. 具体的；特定的' },
  stable: { phonetic: '/ˈsteɪbl/', definition: 'adj. 稳定的；稳固的' },
  standard: { phonetic: '/ˈstændəd/', definition: 'n. 标准；adj. 标准的' },
  status: { phonetic: '/ˈsteɪtəs/', definition: 'n. 地位；状态' },
  strategy: { phonetic: '/ˈstrætədʒi/', definition: 'n. 策略；战略' },
  stress: { phonetic: '/stres/', definition: 'n. 压力；v. 强调' },
  structure: { phonetic: '/ˈstrʌktʃə/', definition: 'n. 结构；v. 构造' },
  struggle: { phonetic: '/ˈstrʌɡl/', definition: 'v./n. 奋斗；斗争' },
  subjective: { phonetic: '/səbˈdʒektɪv/', definition: 'adj. 主观的' },
  submit: { phonetic: '/səbˈmɪt/', definition: 'v. 提交；服从' },
  subsequent: { phonetic: '/ˈsʌbsɪkwənt/', definition: 'adj. 随后的；后来的' },
  substance: { phonetic: '/ˈsʌbstəns/', definition: 'n. 物质；实质' },
  substantial: { phonetic: '/səbˈstænʃl/', definition: 'adj. 大量的；实质的' },
  substitute: { phonetic: '/ˈsʌbstɪtjuːt/', definition: 'n. 替代品；v. 替代' },
  sufficient: { phonetic: '/səˈfɪʃnt/', definition: 'adj. 足够的；充分的' },
  suggest: { phonetic: '/səˈdʒest/', definition: 'v. 建议；暗示' },
  suitable: { phonetic: '/ˈsuːtəbl/', definition: 'adj. 合适的；适宜的' },
  superior: { phonetic: '/suːˈpɪəriə/', definition: 'adj. 优越的；上级的' },
  supply: { phonetic: '/səˈplaɪ/', definition: 'v./n. 供应；提供' },
  support: { phonetic: '/səˈpɔːt/', definition: 'v./n. 支持；供养' },
  suppose: { phonetic: '/səˈpəʊz/', definition: 'v. 假设；认为' },
  survey: { phonetic: '/ˈsɜːveɪ/', definition: 'n./v. 调查；测量' },
  survive: { phonetic: '/səˈvaɪv/', definition: 'v. 幸存；生存' },
  suspect: { phonetic: '/səˈspekt/', definition: 'v. 怀疑；n. 嫌疑人' },
  suspend: { phonetic: '/səˈspend/', definition: 'v. 暂停；悬挂' },
  sustain: { phonetic: '/səˈsteɪn/', definition: 'v. 维持；支撑' },
  symbol: { phonetic: '/ˈsɪmbl/', definition: 'n. 象征；符号' },
  target: { phonetic: '/ˈtɑːɡɪt/', definition: 'n. 目标；v. 瞄准' },
  task: { phonetic: '/tɑːsk/', definition: 'n. 任务；工作' },
  technique: { phonetic: '/tekˈniːk/', definition: 'n. 技术；技巧' },
  technology: { phonetic: '/tekˈnɒlədʒi/', definition: 'n. 技术' },
  tendency: { phonetic: '/ˈtendənsi/', definition: 'n. 趋势；倾向' },
  tension: { phonetic: '/ˈtenʃn/', definition: 'n. 紧张；张力' },
  terminal: { phonetic: '/ˈtɜːmɪnl/', definition: 'n. 终端；adj. 末期的' },
  territory: { phonetic: '/ˈterətri/', definition: 'n. 领土；领域' },
  theme: { phonetic: '/θiːm/', definition: 'n. 主题；主旋律' },
  theory: { phonetic: '/ˈθɪəri/', definition: 'n. 理论；学说' },
  thorough: { phonetic: '/ˈθʌrə/', definition: 'adj. 彻底的；全面的' },
  threaten: { phonetic: '/ˈθretn/', definition: 'v. 威胁；恐吓' },
  tolerate: { phonetic: '/ˈtɒləreɪt/', definition: 'v. 容忍；忍受' },
  topic: { phonetic: '/ˈtɒpɪk/', definition: 'n. 主题；话题' },
  tradition: { phonetic: '/trəˈdɪʃn/', definition: 'n. 传统；惯例' },
  transfer: { phonetic: '/trænsˈfɜː/', definition: 'v. 转移；转让' },
  transform: { phonetic: '/trænsˈfɔːm/', definition: 'v. 转变；改造' },
  transition: { phonetic: '/trænˈzɪʃn/', definition: 'n. 过渡；转变' },
  transmit: { phonetic: '/trænsˈmɪt/', definition: 'v. 传输；传播' },
  transport: { phonetic: '/ˈtrænspɔːt/', definition: 'v./n. 运输；交通' },
  trend: { phonetic: '/trend/', definition: 'n. 趋势；潮流' },
  trigger: { phonetic: '/ˈtrɪɡə/', definition: 'v. 触发；n. 扳机' },
  ultimate: { phonetic: '/ˈʌltɪmət/', definition: 'adj. 最终的；根本的' },
  underestimate: { phonetic: '/ˌʌndərˈestɪmeɪt/', definition: 'v. 低估' },
  undergo: { phonetic: '/ˌʌndəˈɡəʊ/', definition: 'v. 经历；承受' },
  undertake: { phonetic: '/ˌʌndəˈteɪk/', definition: 'v. 承担；从事' },
  unique: { phonetic: '/juˈniːk/', definition: 'adj. 独特的；唯一的' },
  unite: { phonetic: '/juˈnaɪt/', definition: 'v. 联合；团结' },
  universal: { phonetic: '/ˌjuːnɪˈvɜːsl/', definition: 'adj. 普遍的；全体的' },
  urban: { phonetic: '/ˈɜːbən/', definition: 'adj. 城市的' },
  urge: { phonetic: '/ɜːdʒ/', definition: 'v. 催促；n. 冲动' },
  utilize: { phonetic: '/ˈjuːtɪlaɪz/', definition: 'v. 利用；使用' },
  valid: { phonetic: '/ˈvælɪd/', definition: 'adj. 有效的；合理的' },
  value: { phonetic: '/ˈvæljuː/', definition: 'n. 价值；v. 重视' },
  variety: { phonetic: '/vəˈraɪəti/', definition: 'n. 多样；种类' },
  various: { phonetic: '/ˈveəriəs/', definition: 'adj. 各种各样的' },
  version: { phonetic: '/ˈvɜːʃn/', definition: 'n. 版本；说法' },
  vertical: { phonetic: '/ˈvɜːtɪkl/', definition: 'adj. 垂直的；竖立的' },
  victim: { phonetic: '/ˈvɪktɪm/', definition: 'n. 受害者；牺牲品' },
  violence: { phonetic: '/ˈvaɪələns/', definition: 'n. 暴力；猛烈' },
  virtue: { phonetic: '/ˈvɜːtʃuː/', definition: 'n. 美德；优点' },
  visible: { phonetic: '/ˈvɪzəbl/', definition: 'adj. 可见的；明显的' },
  vision: { phonetic: '/ˈvɪʒn/', definition: 'n. 视力；视野；愿景' },
  visual: { phonetic: '/ˈvɪʒuəl/', definition: 'adj. 视觉的；直观的' },
  vital: { phonetic: '/ˈvaɪtl/', definition: 'adj. 至关重要的' },
  vivid: { phonetic: '/ˈvɪvɪd/', definition: 'adj. 生动的；鲜明的' },
  volume: { phonetic: '/ˈvɒljuːm/', definition: 'n. 量；卷；音量' },
  volunteer: { phonetic: '/ˌvɒlənˈtɪə/', definition: 'n. 志愿者；v. 自愿' },
  withdraw: { phonetic: '/wɪðˈdrɔː/', definition: 'v. 撤回；退出' },
  witness: { phonetic: '/ˈwɪtnəs/', definition: 'n. 目击者；v. 目击' },
}

const EXTRACTED_CACHE_KEY = 'vocab_extracted_words'

function extractWords(): IVocabWord[] {
  const cached = wx.getStorageSync(EXTRACTED_CACHE_KEY) as IVocabWord[] | undefined
  if (cached && cached.length) return cached

  const wordMap: Record<string, IVocabWord> = {}
  for (const r of readingsData as Array<{ passage?: string; title?: string }>) {
    const passage = (r.passage || '').replace(ALNUM_RE, ' ')
    const source = r.title || ''
    const tokens = [...new Set(passage.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 4 && !STOP_WORDS.has(w)))]
    for (const t of tokens) {
      if (wordMap[t]) {
        if (wordMap[t].source.indexOf(source) === -1) wordMap[t].source += ' / ' + source
        continue
      }
      const known = WORD_BANK[t]
      wordMap[t] = {
        word: t,
        phonetic: known?.phonetic || '',
        definition: '',
        chn: known?.definition || '',
        source,
        status: 'new',
        correctStreak: 0,
      }
    }
  }
  const result = Object.values(wordMap)
  wx.setStorageSync(EXTRACTED_CACHE_KEY, result)
  return result
}

function hasCJK(s: string): boolean { return /[\u4e00-\u9fff]/.test(s) }

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

Page<IVocabData, IVocabMethods>({
  data: {
    words: [],
    filteredWords: [],
    tab: 0,
    mastered: 0,
    learning: 0,
    reviewCount: 0,
    darkMode: false,
    gameWord: null,
    gameWordIdx: 0,
    gameTotal: 0,
    gameOptions: [],
    gameIndex: -1,
    gameCorrect: -1,
    lookingUp: false,
    gameLoading: false,
    gameAnswer: '',
  },

  onShow() {
    applyTheme(getDarkMode())
    this.setData({ darkMode: getDarkMode() })
    this.loadWords()
  },

  loadWords() {
    const app = getApp<IAppOption>()
    let stored = app.globalData.studyData.vocabWords as IVocabWord[]
    if (!stored || stored.length === 0) {
      stored = extractWords()
      app.globalData.studyData.vocabWords = stored
      wx.setStorageSync('studyData', app.globalData.studyData)
    }
    const words = stored.slice()
    const stats = { mastered: 0, learning: 0, reviewCount: 0 }
    const tab = this.data.tab
    const filtered: IVocabWord[] = []
    for (const w of words) {
      if (w.status === 'master') stats.mastered++
      else stats.learning++
      if (w.status === 'review') stats.reviewCount++
      if (tab === 0 && w.status !== 'master') filtered.push(w)
      else if (tab === 1 && w.status === 'review') filtered.push(w)
      else if (tab === 2 && w.status === 'master') filtered.push(w)
    }
    this.setData({
      words,
      filteredWords: filtered,
      ...stats,
    })
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const tab = Number(e.currentTarget.dataset.tab)
    const words = this.data.words
    const filtered: IVocabWord[] = []
    for (const w of words) {
      if (tab === 0 && w.status !== 'master') filtered.push(w)
      else if (tab === 1 && w.status === 'review') filtered.push(w)
      else if (tab === 2 && w.status === 'master') filtered.push(w)
    }
    this.setData({ tab, filteredWords: filtered })
  },

  startGame(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const word = this.data.filteredWords[idx]
    if (!word?.definition) return
    this.showGameForIdx(idx)
  },

  async showGameForIdx(idx: number) {
    const word = this.data.filteredWords[idx]
    if (!word?.chn && !word?.definition) return this.closeGame()
    this.setData({
      gameWord: word, gameWordIdx: idx, gameTotal: this.data.filteredWords.length,
      gameOptions: [], gameIndex: -1, gameCorrect: -1, gameAnswer: '',
    })
    // 兼容老数据：definition 里存的是中文 → 挪到 chn
    if (!word.chn && hasCJK(word.definition)) {
      word.chn = word.definition; word.definition = ''
    }
    if (!word.chn) {
      this.setData({ gameLoading: true })
      try {
        const result = await lookupWord(word.word)
        const entry = Array.isArray(result) ? result[0] : result
        const chn = entry.chinese || ''
        if (chn) {
          word.chn = chn
          const app = getApp<IAppOption>()
          const stored = app.globalData.studyData.vocabWords as IVocabWord[]
          const sw = stored.find(v => v.word === word.word)
          if (sw) { sw.chn = chn; wx.setStorageSync('studyData', app.globalData.studyData) }
        }
      } catch {}
      this.setData({ gameLoading: false })
    }
    if (!word.chn) return this.closeGame()
    const candidates = this.data.words.filter(w => w.word !== word.word && w.chn)
    if (candidates.length < 3) {
      for (const c of candidates) {
        if (c.chn) continue
        try {
          const r = await lookupWord(c.word)
          const e = Array.isArray(r) ? r[0] : r
          const cn = e.chinese || ''
          if (cn) { c.chn = cn; const app = getApp<IAppOption>(); const sw = app.globalData.studyData.vocabWords.find((v: IVocabWord) => v.word === c.word); if (sw) { sw.chn = cn; wx.setStorageSync('studyData', app.globalData.studyData) } }
        } catch {}
      }
    }
    const avail = this.data.words.filter(w => w.word !== word.word && w.chn)
    const pick = shuffleInPlace(avail).slice(0, 3)
    const options = shuffleInPlace([word, ...pick])
    this.setData({ gameOptions: options.map(w => w.chn) })
  },

  pickOption(e: WechatMiniprogram.TouchEvent) {
    if (this.data.gameIndex >= 0) return
    const oi = Number(e.currentTarget.dataset.oi)
    const correctChn = this.data.gameWord?.chn || ''
    const isCorrect = this.data.gameOptions[oi] === correctChn
    this.setData({ gameIndex: oi, gameCorrect: this.data.gameOptions.indexOf(correctChn), gameAnswer: correctChn })

    const app = getApp<IAppOption>()
    const words = app.globalData.studyData.vocabWords as IVocabWord[]
    const w = words.find(v => v.word === this.data.gameWord?.word)
    if (!w) return

    w.correctStreak = isCorrect ? w.correctStreak + 1 : Math.max(0, w.correctStreak - 1)
    w.status = w.correctStreak >= 3 ? 'master' : isCorrect ? 'learning' : 'review'
    wx.setStorageSync('studyData', app.globalData.studyData)

    const wordsCopy = this.data.words.slice()
    const fwCopy = this.data.filteredWords.slice()
    const updateWord = (arr: IVocabWord[]) => {
      const found = arr.find(v => v.word === w.word)
      if (found) { found.status = w.status; found.correctStreak = w.correctStreak }
    }
    updateWord(wordsCopy)
    updateWord(fwCopy)
    const stats = { mastered: 0, learning: 0, reviewCount: 0 }
    for (const v of wordsCopy) {
      if (v.status === 'master') stats.mastered++
      else stats.learning++
      if (v.status === 'review') stats.reviewCount++
    }
    this.setData({ words: wordsCopy, filteredWords: fwCopy, ...stats })
  },

  nextGame() {
    const nextIdx = this.data.gameWordIdx + 1
    if (nextIdx >= this.data.gameTotal) {
      this.closeGame()
      wx.showToast({ title: '全部挑战完成！', icon: 'success' })
      return
    }
    this.showGameForIdx(nextIdx)
  },

  closeGame() {
    this.setData({ gameWord: null, gameWordIdx: 0, gameTotal: 0, gameOptions: [], gameIndex: -1, gameCorrect: -1, gameAnswer: '' })
  },

  async lookupWord(e: WechatMiniprogram.TouchEvent) {
    const idx = Number(e.currentTarget.dataset.idx)
    const word = this.data.filteredWords[idx]
    if (!word) return
    this.setData({ lookingUp: true })
    try {
      const result = await lookupWord(word.word)
      const entry = Array.isArray(result) ? result[0] : result
      const phonetic = entry.phonetic || entry.phonetics?.[0]?.text || ''
      const engDef = entry.meanings?.[0]?.definitions?.[0]?.definition || ''
      const chn = entry.chinese || ''
      if (!engDef && !chn) {
        wx.showToast({ title: '未找到释义', icon: 'none' })
        return
      }
      const app = getApp<IAppOption>()
      const words = app.globalData.studyData.vocabWords as IVocabWord[]
      const w = words.find(v => v.word === word.word)
      if (w) {
        w.phonetic = phonetic
        w.definition = engDef
        w.chn = chn
        wx.setStorageSync('studyData', app.globalData.studyData)
        this.loadWords()
        wx.showToast({ title: `已查到「${word.word}」`, icon: 'success' })
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('404')) {
        wx.showToast({ title: '词库暂无此词', icon: 'none' })
      } else if (msg.includes('请求失败') || msg.includes('fail')) {
        wx.showToast({ title: '请先启动 server', icon: 'none' })
      } else {
        wx.showToast({ title: '查询失败', icon: 'none' })
      }
    }
    this.setData({ lookingUp: false })
  },

  addWord() {
    wx.showModal({
      title: '添加单词',
      editable: true,
      placeholderText: '输入英文单词',
      success: (res) => {
        if (!res.confirm || !res.content) return
        const w = res.content.trim().toLowerCase()
        const app = getApp<IAppOption>()
        const words = app.globalData.studyData.vocabWords as IVocabWord[]
        if (words.find(v => v.word === w)) {
          wx.showToast({ title: '单词已存在', icon: 'none' })
          return
        }
        const known = WORD_BANK[w]
        words.push({
          word: w,
          phonetic: known?.phonetic || '',
          definition: '',
          chn: known?.definition || '',
          source: '手动添加',
          status: 'new',
          correctStreak: 0,
        })
        wx.setStorageSync('studyData', app.globalData.studyData)
        this.loadWords()
        wx.showToast({ title: '已添加 ' + w, icon: 'success' })
      },
    })
  },
})
