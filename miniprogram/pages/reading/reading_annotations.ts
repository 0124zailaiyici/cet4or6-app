const readingAnnotations: Record<number, {
  vocab?: Record<string, string>
  qLocate?: Record<string, string>
  qHint?: Record<string, string>
}> = {
  // ===== 201906 第一套 =====

  // 选词填空 2019061
  1779441964372: {
    vocab: {
      innovation: 'n. 创新',
      vehicles: 'n. 车辆',
      lawmakers: 'n. 立法者',
      legislation: 'n. 法律，法规',
      dominance: 'n. 主导地位',
      substantial: 'adj. 重大的',
      manufacturer: 'n. 制造商',
      commercial: 'adj. 商业的',
      restrictive: 'adj. 限制性的',
    },
    qHint: {
      '26': '助动词has后接过去分词，from...to...表迁移 → migrated 迁移',
      '27': '不定冠词a后接名词，a bid to do = 为做某事而作的努力',
      '28': 'introduced后接名词作宾语，立法者提出法案 → legislation',
      '29': '所有格Michigan\'s后接名词，在汽车研发方面的主导地位 → dominance',
      '30': 'desire to do，不定式后接动词原形，取代领导地位 → replace',
      '31': 'the lead后接表示身份的名词，四项法案的主要发起人 → sponsor',
      '32': 'would后接动词原形，法案通过意味着重大更新 → represent 意味着',
      '33': 'on-demand后接名词，按需的车队 → fleets',
      '34': 'In后接名词构成状语，与上文形成对比 → contrast',
      '35': '比较级far more后接形容词修饰rules → restrictive 限制性的',
    },
  },

  // 长篇匹配 2019061
  1779441964374: {
    vocab: {
      centenarians: 'n. 百岁老人',
      longevity: 'n. 长寿',
      inevitable: 'adj. 不可避免的',
      milestones: 'n. 里程碑',
      sabbaticals: 'n. 休假',
      tangible: 'adj. 有形的',
      profound: 'adj. 深刻的',
      transitions: 'n. 转变，过渡',
      vitality: 'n. 活力',
      implications: 'n. 影响，含义',
      commitments: 'n. 承诺，责任',
      demographic: 'adj. 人口的',
      trajectory: 'n. 轨迹',
      assets: 'n. 资产',
      sequences: 'n. 序列，顺序',
    },
    qLocate: {
      '0': 'I段',
      '1': 'G段',
      '2': 'D段',
      '3': 'N段',
      '4': 'A段',
      '5': 'K段',
      '6': 'H段',
      '7': 'F段',
      '8': 'M段',
      '9': 'C段',
    },
    qHint: {
      '0': 'I段：传统的三阶段人生变成多阶段 → 人生会有更多不同职业。',
      '1': 'G段：延长职业能保障经济，但也会耗尽无形资产如活力、友谊。',
      '2': 'D段：1962年50%美国人在21岁前结婚→2014年推迟到29岁，约8年。',
      '3': 'N段：三阶段人生（教育→工作→退休）适用父母祖辈，但今天已不适用。',
      '4': 'A段：到2050年仅美国就有超过100万百岁老人。',
      '5': 'K段：多阶段人生会导致对生活和工作的方式产生深刻变化。',
      '6': 'H段：技术变革速度快，要么技能过时要么行业淘汰，必须不断再投资技能。',
      '7': 'F段：即使经济上能65岁退休，30多年不工作也会伤害认知和情感活力。',
      '8': 'M段：伴随多阶段人生的多样性，年龄和阶段的紧密联系即将结束。',
      '9': 'C段：如果人们活得更长更健康，将不可避免地重新规划工作和生活。',
    },
  },

  // 仔细阅读 2019061 第一篇 - Divorce risk
  1779441964376: {
    vocab: {
      vow: 'n. 誓言，誓约',
      spouse: 'n. 配偶',
      diagnosed: 'v. 诊断',
      struggling: 'v. 挣扎，艰难应对',
      onset: 'n. 发生，开始',
      chronic: 'adj. 慢性的',
      vulnerable: 'adj. 脆弱的',
      marital: 'adj. 婚姻的',
      widowed: 'adj. 丧偶的',
      norms: 'n. 准则，规范',
      caregiving: 'n. 看护，照料',
      prospective: 'adj. 潜在的，未来的',
      policymakers: 'n. 政策制定者',
    },
    qLocate: {
      '0': 'P1',
      '1': 'P4',
      '2': 'P5',
      '3': 'P6',
      '4': 'P8',
    },
    qHint: {
      '0': '文首说誓约承诺"无论生病健康都在一起"，但第二句立刻转折 But... 指出离婚风险上升 → 誓约并不能保证婚姻持久。',
      '1': '定位 P4 末句："more husbands than wives developing serious health problems" → D 选项 "比妻子更容易得重病"。',
      '2': '定位 P5："more likely to get divorced" → 女性病了更容易被离婚。注意区分"丧偶 widowed"和"离婚 divorced"。',
      '3': '定位 P6："Gender norms... may make it more difficult for men to provide care" → 性别准则使得男性更习惯于接受照顾而非提供。',
      '4': '定位 P8 末句："sick ex-wives may need additional care and services" → 对应 C 选项 "给离婚女性提供额外照顾"。',
    },
  },

  // 仔细阅读 2019061 第二篇 - Misnaming
  1779441964377: {
    vocab: {
      sibling: 'n. 兄弟姐妹',
      cognitive: 'adj. 认知的',
      classify: 'v. 分类',
      invariably: 'adv. 总是，不变地',
      resemblance: 'n. 相似',
      conducted: 'v. 实施，进行',
      incidents: 'n. 事件',
      boundaries: 'n. 界限',
      frustrated: 'adj. 沮丧的',
      random: 'adj. 随机的',
    },
    qLocate: {
      '0': 'P1',
      '1': 'P2',
      '2': 'P4',
      '3': 'P5',
      '4': 'P6',
    },
    qHint: {
      '0': '首句 "you probably got upset" → 不高兴，对应 B 选项 Unhappy。',
      '1': 'P2："common cognitive error that has to do with how our memories classify and store familiar names" → 与记忆工作方式有关。',
      '2': 'P4："names shared initial or internal sounds" → 名字发音相似导致叫错。',
      '3': 'P5："people mixed up names within relationship groups" → 错误发生在关系群体内部。',
      '4': 'P6："mothers may call on their children more often than fathers" → 母亲和孩子交流更多。',
    },
  },

  // ===== 201906 第二套 =====

  // 选词填空 2019062 - Killer whales
  1779441964430: {
    vocab: {
      predators: 'n. 食肉动物',
      brutal: 'adj. 残忍的，野蛮的',
      refined: 'adj. 精炼的，完善的',
      literally: 'adv. 字面上，确实',
      acquired: 'adj. 后天习得的',
      instinctive: 'adj. 本能的',
      adaptations: 'n. 适应',
      thrive: 'v. 繁荣，茁壮成长',
      habitats: 'n. 栖息地',
      speculate: 'v. 推测，推断',
    },
    qLocate: {
      '26': 'P1',
      '27': 'P1',
      '28': 'P1',
      '29': 'P2',
      '30': 'P2',
      '31': 'P3',
      '32': 'P3',
      '33': 'P4',
      '34': 'P4',
      '35': 'P4',
    },
    qHint: {
      '26': '最高级the most后接形容词，修饰捕食者 → brutal 残忍的',
      '27': '定冠词the后接名词，符合有文化生物的形象 → image',
      '28': 'highly后接形容词修饰behaviors → refined 精炼的/完善的',
      '29': 'which引导从句修饰colere，字面意思 → literally 字面上',
      '30': 'or连接并列结构，与learnt同义 → acquired 后天习得的',
      '31': 'genetic后接名词，帮助消化利用高脂饮食的适应能力 → adaptations',
      '32': 'allow them to后接动词原形，在寒冷气候中繁衍生息 → thrive',
      '33': 'a range of different后接名词复数，全球不同栖息地 → habitats',
      '34': 'that引导定语从句，帝国从极地延伸到极地 → extends',
      '35': 'leading scientists to后接动词原形，科学家推测 → speculate',
    },
  },

  // 长篇匹配 2019062 - Young adults
  1779441964431: {
    vocab: {
      demographic: 'adj. 人口的',
      attainment: 'n. 成就，达到',
      spouse: 'n. 配偶',
      postponement: 'n. 推迟',
      cohabitation: 'n. 同居',
      trajectory: 'n. 轨迹',
      prevalent: 'adj. 普遍的',
      recession: 'n. 衰退',
      counterparts: 'n. 对应的人/物',
      enrollments: 'n. 入学人数',
    },
    qLocate: {
      '0': 'H段',
      '1': 'E段',
      '2': 'B段',
      '3': 'B段',
      '4': 'K段',
      '5': 'F段',
      '6': 'I段',
      '7': 'H段',
      '8': 'J段',
      '9': 'G段',
    },
    qHint: {
      '0': 'H段：有工作的年轻人比没工作的更不可能住父母家，青年男性就业率下降。',
      '1': 'E段：2014年35%年轻男性住父母家，29%年轻女性住父母家。',
      '2': 'B段：1960年62%已婚/同居→2014年31.6%，大幅下降。',
      '3': 'B段：1960年only one-in-five(20%)住父母家。',
      '4': 'K段：有本科学位的年轻人在劳动力市场表现更好，更容易独立生活。',
      '5': 'F段：年轻女性(16%)比男性(13%)更可能成为单亲家长。',
      '6': 'I段：年轻女性住父母家增加，部分原因与男性劳动力市场结果相关的晚婚。',
      '7': 'H段：青年男性就业率从1960年84%降至2014年71%，收入下降。',
      '8': 'J段：经济大衰退初期大学入学人数扩大，增加了住父母家的年轻人数量。',
      '9': 'G段：晚婚或避免结婚是年轻人住父母家比例上升的首要因素。',
    },
  },

  // 仔细阅读 2019062 第一篇 - Women leaders
  1779441964433: {
    vocab: {
      capable: 'adj. 有能力的',
      corporate: 'adj. 公司的',
      indistinguishable: 'adj. 难以区分的',
      passionate: 'adj. 热情的',
      toughness: 'n. 坚韧',
      interruptions: 'n. 中断',
      counterparts: 'n. 对应的人',
      electorate: 'n. 选民',
      foreseeable: 'adj. 可预见的',
      barrier: 'n. 障碍',
    },
    qLocate: {
      '0': 'P1',
      '1': 'P3',
      '2': 'P4',
      '3': 'P5',
      '4': 'P6',
    },
    qHint: {
      '0': 'P1："women indistinguishable from men on key leadership traits" → 女性和男性一样聪明有创新力。',
      '1': 'P3："career interruptions related to motherhood may make it harder for women to advance" → 家庭责任影响职业发展。',
      '2': 'P4："a double standard... they have to do more than their male counterparts to prove themselves" → 性别偏见是主要因素。',
      '3': 'P5："the public is divided" → 公众对未来是否有更多女性领导持分歧意见。',
      '4': 'P6："73% expect to see a female president in their lifetime" → 期待有女性进入最高领导职位。',
    },
  },

  // 仔细阅读 2019062 第二篇 - Height
  1779441964434: {
    vocab: {
      nutrition: 'n. 营养',
      genetics: 'n. 遗传学',
      cardiovascular: 'adj. 心血管的',
      reversed: 'v. 逆转',
      potential: 'n. 潜力',
      implications: 'n. 影响',
      adjustment: 'adj. 调整',
      average: 'n. 平均',
      primarily: 'adv. 主要地',
      productive: 'adj. 有生产力的',
    },
    qLocate: {
      '0': 'P1',
      '1': 'P2',
      '2': 'P3',
      '3': 'P4',
      '4': 'P5',
    },
    qHint: {
      '0': 'P1：全球研究显示大多数国家人的身高在上一世纪明显增长。',
      '1': 'P2："genetics plays a less key role" when averaging over populations → 遗传对个体影响大但对群体影响小。',
      '2': 'P3："Being taller is associated with longer life expectancy" → 更高的人寿命更长。',
      '3': 'P4："the trend has reversed... height decreasing" → 现在比之前几代人更矮。',
      '4': 'P5："strongly influenced by the environment we grew up in" → 确保孩子在理想环境中成长。',
    },
  },
}

export default readingAnnotations
