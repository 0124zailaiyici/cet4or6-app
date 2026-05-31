const fs = require('fs')
const path = require('path')

// Manually curated transcript data for passage 1 (2019.06 第1套)
const passage1 = {
  id: 1779533939018,
  groups: [
    {
      qStart: 1, qEnd: 2,
      transcript: 'A 9-year-old Central California boy braved strong currents and cold water to swim from San Francisco to Alcatraz Island and back. A California television station in Fresno reported Tuesday that James Savage set a record as the youngest swimmer to make the journey to the former prison. The TV station reported that by completing the swim, the fourth-grade student from Los Banos broke a record previously held by a 10-year-old boy. James said that waves in the San Francisco Bay hitting him in the face 30 minutes into his swim made him want to give up. His father said he had offered his son $100 as a reward; to encourage his struggling son, he doubled it to $200. James pushed forward, making it to Alcatraz Island and back in a little more than two hours. Alcatraz is over a mile from the mainland.',
      highlights: [
        { qNum: 1, text: '9-year-old Central California boy braved strong currents and cold water to swim from San Francisco to Alcatraz Island and back' },
        { qNum: 2, text: 'his father said he had offered his son $100 as a reward; to encourage his struggling son, he doubled it to $200' },
      ],
      answers: [{ q: 1, letter: 'A' }, { q: 2, letter: 'A' }],
    },
    {
      qStart: 3, qEnd: 4,
      transcript: 'On the 1st of January, new regulations will come into effect which eliminate an annual leave bonus for people who put off marrying until the age of 23 for women, and 25 for men, the South China Morning Post reports. The holiday bonus was designed to encourage young people to delay getting married in line with China\'s one-child policy. But with that policy now being abolished, this holiday incentive is no longer necessary, the government says. In Shanghai, a young couple at a marriage registration office told the paper that they decided to register their marriage as soon as possible to take advantage of the existing policy, because an extra holiday was a big deal for them. In Beijing, one registration office had about 300 couples seeking to get married the day after the changes were announced, rather than the usual number of between 70 and 80. But one lawyer tells the paper that the changes still have to be adopted by local governments and these procedures take time. So people who are rushing to register for marriage can relax.',
      highlights: [
        { qNum: 3, text: 'The holiday bonus was designed to encourage young people to delay getting married in line with China\'s one-child policy' },
        { qNum: 4, text: 'the changes still have to be adopted by local governments and these procedures take time. So people who are rushing to register for marriage can relax' },
      ],
      answers: [{ q: 3, letter: 'B' }, { q: 4, letter: 'D' }],
    },
    {
      qStart: 5, qEnd: 7,
      transcript: 'Everyone loves a good house party, but the cleaning-up the next morning isn\'t as enjoyable. Now, however, a New Zealand-based start-up company aims to bring messy homes — and even splitting headaches — back to normal. The properly-named start-up Morning-After Maids was launched about a month ago in Auckland by roommates Rebecca Foley and Catherine Ashurst. Aside from cleaning-up, the two will also cook breakfast and even get coffee and painkillers for recovering merrymakers. Although they are both gainfully employed, they fit cleaning jobs into their nights and weekends, which is when their service is in most demand anyway. Besides being flooded with requests from across the country, Foley and Ashurst have also received requests from the U.S. and Canada to provide services there. They are reportedly meeting with lawyers to see how best to take the business forward.',
      highlights: [
        { qNum: 5, text: 'a New Zealand-based start-up company aims to bring messy homes back to normal' },
        { qNum: 6, text: 'Everyone loves a good house party, but the cleaning-up the next morning isn\'t as enjoyable' },
        { qNum: 7, text: 'They are reportedly meeting with lawyers to see how best to take the business forward' },
      ],
      answers: [{ q: 5, letter: 'C' }, { q: 6, letter: 'B' }, { q: 7, letter: 'D' }],
    },
    {
      qStart: 8, qEnd: 11,
      transcript: 'W: Kyle, how did your driver\'s theory exam go? It was yesterday, right?\nM: Yes, I prepared as much as I could, but I was so nervous since it was my second try. The people who worked at the test center were very kind, though. We had a little conversation which calmed me down a bit, and that was just what I needed. Then, after the exam, they printed out my result, but I was afraid to open it until I was outside. It was such a relief to pass.\nW: Congratulations! I knew you could do it! I guess you underestimated how difficult it would be the first time, didn\'t you? I hear a lot of people make that mistake and go in underprepared, but good job in passing the second time.\nM: Thanks. I\'ve only had two driving lessons so far, and my instructor is very understanding. So I\'m really enjoying it. And I can\'t wait for my next session, although the lessons are rather expensive, £20 an hour. And the instructor says I\'ll need about 30 to 40 lessons in total — six to eight hundred pounds. So this time I\'ll need to make a lot more effort and hopefully will be successful the first time.',
      highlights: [
        { qNum: 8, text: 'how did your driver\'s theory exam go?' },
        { qNum: 9, text: 'I guess you underestimated how difficult it would be the first time' },
        { qNum: 10, text: 'the lessons are rather expensive, £20 an hour' },
        { qNum: 11, text: 'this time I\'ll need to make a lot more effort and hopefully will be successful the first time' },
      ],
      answers: [{ q: 8, letter: 'C' }, { q: 9, letter: 'A' }, { q: 10, letter: 'B' }, { q: 11, letter: 'A' }],
    },
    {
      qStart: 12, qEnd: 15,
      transcript: 'M: Emma, I got accepted to the University of Leeds. Since you\'re going to university in England, do you know how much it is for international students to study there?\nW: Congratulations! Yes, I believe for international students, you\'ll have to pay around £13,000 a year.\nM: Okay, so that\'s about $17,000 for the tuition and fees. Anyway, I\'m only going to be there for a year, doing my master\'s. So it\'s pretty good. Also, I have a good chance of winning a scholarship at Leeds, which would be pretty awesome — the benefits of being a music genius.\nW: Yeah, I heard you\'re a talented piano player. So you\'re doing a postgraduate degree now?\nM: Are you still planning on being a teacher?\nW: I\'m still going to be a teacher. But the plan is to work at an international school overseas, after I get a year or so of experience in England.',
      highlights: [
        { qNum: 12, text: 'do you know how much it is for international students to study there?' },
        { qNum: 13, text: 'I\'m only going to be there for a year, doing my master\'s' },
        { qNum: 14, text: 'I have a good chance of winning a scholarship at Leeds — the benefits of being a music genius' },
        { qNum: 15, text: 'I\'m still going to be a teacher. But the plan is to work at an international school overseas' },
      ],
      answers: [{ q: 12, letter: 'C' }, { q: 13, letter: 'D' }, { q: 14, letter: 'B' }, { q: 15, letter: 'D' }],
    },
    {
      qStart: 16, qEnd: 18,
      transcript: 'Scientists have identified thousands of known ant species around the world — and only a few of them bug humans. Most ants live in the woods or out in nature. There, they keep other creatures in check, distribute seeds, and clean dead and decaying materials from the ground. A very small percentage of ants do harm to humans. But those are incredibly challenging to control. Once they settle in, these insects start affecting your home. Some, like carpenter ants, can undermine a home\'s structure, while others interfere with electrical units. Unfortunately, our homes are very attractive to ants, because they provide everything the colony needs to survive, such as food, water, and shelter. So how can we prevent ants from getting into our homes? Most important of all, avoid giving ants any access to food, particularly sugary food, because ants have a sweet tooth. We also need to clean up spills as soon as they occur and store food in airtight containers.',
      highlights: [
        { qNum: 16, text: 'only a few of them bug humans' },
        { qNum: 17, text: 'carpenter ants can undermine a home\'s structure' },
        { qNum: 18, text: 'avoid giving ants any access to food, particularly sugary food' },
      ],
      answers: [{ q: 16, letter: 'C' }, { q: 17, letter: 'B' }, { q: 18, letter: 'A' }],
    },
    {
      qStart: 19, qEnd: 21,
      transcript: 'My research focus is on what happens to our immune system as we age. The job of the immune system is to fight infections. It also protects us from viruses and from auto-immune diseases. We know that as we get older, it\'s easier for us to get infections. So, older adults have more chances of falling ill. This is evidence that our immune system really doesn\'t function so well when we age. In our work we work very closely with a great group of volunteers called "The 1,000 Elders". These volunteers are all 65 or over but in good health. They come to the university to provide us with blood samples, to be interviewed and to help us carry out a whole range of research. The real impact of our research is going to be on health in old age. I want to make sure that older adults are still able to enjoy their old age and that they\'re not spending time in hospital with infections.',
      highlights: [
        { qNum: 19, text: 'My research focus is on what happens to our immune system as we age' },
        { qNum: 20, text: 'They come to the university to provide us with blood samples, to be interviewed and to help us carry out a whole range of research' },
        { qNum: 21, text: 'The real impact of our research is going to be on health in old age' },
      ],
      answers: [{ q: 19, letter: 'D' }, { q: 20, letter: 'B' }, { q: 21, letter: 'C' }],
    },
    {
      qStart: 22, qEnd: 25,
      transcript: 'When Ted Komada started teaching 14 years ago at Killip Elementary, he didn\'t know how to manage a classroom and was struggling to connect with students. He noticed a couple of days after school that a group of kids would get together to play chess. "I know how to play chess. Let me go and show these kids how to do it," he said. Now Komada coaches the school\'s chess team. The whole program started as a safe place for kids to come after school. And this week dozens of those students are getting ready to head out to Nashville, Tennessee, to compete with about 5,000 other young people at the Super Nationals of chess. The school has the highest number of kids from low-income families. Komada likes to teach his students that they should think about their move before they do it. The lessons prove valuable outside the classroom as well. Students are more likely to think about their actions and see whether they will lead to trouble.',
      highlights: [
        { qNum: 22, text: 'a group of kids would get together to play chess' },
        { qNum: 23, text: 'dozens of those students are getting ready to head out to Nashville to compete at the Super Nationals of chess' },
        { qNum: 24, text: 'The school has the highest number of kids from low-income families' },
        { qNum: 25, text: 'they should think about their move before they do it' },
      ],
      answers: [{ q: 22, letter: 'D' }, { q: 23, letter: 'C' }, { q: 24, letter: 'A' }, { q: 25, letter: 'B' }],
    },
  ]
}

// Write
const outFile = path.join(__dirname, 'audio', 'transcript_data.json')
fs.writeFileSync(outFile, JSON.stringify(passage1, null, 2), 'utf-8')
console.log(`Written to ${outFile}`)
