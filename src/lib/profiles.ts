export type Profile = {
  symbol: string;
  name: string;
  sector: string;
  founded: string;
  home: string;
  crossed: string;
  crossedShort: string;
  story: string[];
  milestones: { when: string; text: string }[];
};

const PROFILES: Record<string, Profile> = {
  NVDA: {
    symbol: "NVDA",
    name: "NVIDIA",
    sector: "Semiconductors",
    founded: "1993",
    home: "Santa Clara",
    crossed: "May 30, 2023",
    crossedShort: "May 2023",
    story: [
      "Jensen Huang, Chris Malachowsky, and Curtis Priem started NVIDIA in 1993 to make chips that could draw 3D graphics. The GeForce line won the PC gaming market. CUDA, released in 2006, let developers run general work on those same chips, which is the thread that later tied the company to scientific computing and then to training neural nets.",
      "The data-center business overtook gaming as hyperscalers bought GPUs for AI. NVIDIA first closed above $1 trillion on May 30, 2023, then passed $2 trillion in February 2024 and $3 trillion that June. By the autumn of 2026 the live quote is the thing that keeps it at the top of Trillion Insights. The chart is a scaled price path, not a filing of historical share counts.",
    ],
    milestones: [
      { when: "1993", text: "Founded in Santa Clara." },
      { when: "1999", text: "IPO, and the GeForce 256." },
      { when: "2006", text: "CUDA opens the GPU to general computing." },
      { when: "2020", text: "The planned Arm deal is later abandoned." },
      { when: "2023", text: "First close above $1 trillion, May 30." },
      { when: "2024", text: "Passes $2 trillion, then $3 trillion." },
    ],
  },
  AAPL: {
    symbol: "AAPL",
    name: "Apple",
    sector: "Consumer technology",
    founded: "1976",
    home: "Cupertino",
    crossed: "August 2, 2018",
    crossedShort: "Aug 2018",
    story: [
      "Steve Jobs and Steve Wozniak founded Apple on April 1, 1976. The Apple II and the 1980 IPO made it a public computer company; the 1984 Macintosh made the interface the product. After Jobs returned in 1997, the iMac, the iPod, and then the iPhone in 2007 rebuilt the firm around a few devices people replace on a cycle, with the App Store and services layered on top.",
      "Apple was the first US company to close above $1 trillion, on August 2, 2018. It passed $2 trillion in August 2020 and $3 trillion in January 2022. Years of buybacks mean the scaled chart understates how large the old share count was. The live market cap is what decides membership today.",
    ],
    milestones: [
      { when: "1976", text: "Founded in Los Altos." },
      { when: "1980", text: "IPO in December." },
      { when: "2007", text: "iPhone announced in January." },
      { when: "2018", text: "First $1 trillion close, August 2." },
      { when: "2020", text: "Passes $2 trillion in August." },
      { when: "2022", text: "Passes $3 trillion in January." },
    ],
  },
  GOOGL: {
    symbol: "GOOGL",
    name: "Alphabet",
    sector: "Internet platforms",
    founded: "1998",
    home: "Mountain View",
    crossed: "January 16, 2020",
    crossedShort: "Jan 2020",
    story: [
      "Larry Page and Sergey Brin founded Google in 1998. Search advertising became the economic engine; YouTube, Android, and later Google Cloud sat beside it. In 2015 the listed company reorganized as Alphabet, with Google as the largest subsidiary and a set of other bets, including Waymo, kept in a separate bucket.",
      "Trillion Insights counts the company once, on the Class A line GOOGL, and drops the Class C line so the same market cap is not shown twice. Alphabet first cleared $1 trillion on January 16, 2020. Search and YouTube still fund the company; cloud and the AI build-out are what the recent tape argues about.",
    ],
    milestones: [
      { when: "1998", text: "Google founded." },
      { when: "2004", text: "IPO in August." },
      { when: "2006", text: "YouTube acquired." },
      { when: "2015", text: "Alphabet becomes the listed parent." },
      { when: "2020", text: "First close above $1 trillion, January 16." },
    ],
  },
  MSFT: {
    symbol: "MSFT",
    name: "Microsoft",
    sector: "Software and cloud",
    founded: "1975",
    home: "Redmond",
    crossed: "April 25, 2019",
    crossedShort: "Apr 2019",
    story: [
      "Bill Gates and Paul Allen founded Microsoft in 1975. DOS, then Windows and Office, made it the default layer on corporate PCs. After a long plateau, Satya Nadella's turn toward Azure, and the company's partnership with OpenAI, re-rated the stock as cloud and AI infrastructure rather than as a Windows monopoly.",
      "Microsoft closed above $1 trillion on April 25, 2019. It has stayed in this club through the cloud build-out. The products that still throw off cash are Office, Azure, LinkedIn, GitHub, and Xbox; the argument in the tape is how much of the AI spend turns into Azure revenue.",
    ],
    milestones: [
      { when: "1975", text: "Founded in Albuquerque." },
      { when: "1986", text: "IPO in March." },
      { when: "2014", text: "Nadella becomes chief executive." },
      { when: "2019", text: "First close above $1 trillion, April 25." },
      { when: "2023", text: "The OpenAI partnership becomes the center of the story." },
    ],
  },
  AMZN: {
    symbol: "AMZN",
    name: "Amazon",
    sector: "Commerce and cloud",
    founded: "1994",
    home: "Seattle",
    crossed: "September 4, 2018",
    crossedShort: "Sep 2018",
    story: [
      "Jeff Bezos founded Amazon in 1994 as an online bookstore. The retail franchise expanded into a general store with a logistics network underneath it. Amazon Web Services, launched in 2006, became the profit engine: the same company sells socks and rents computers.",
      "Amazon first touched a $1 trillion market cap on September 4, 2018, slipped back, and later reclaimed the level for good. Andy Jassy, who built AWS, succeeded Bezos as chief executive in 2021. Membership here is still the live dollar market cap, not the 2018 print.",
    ],
    milestones: [
      { when: "1994", text: "Founded in Bellevue." },
      { when: "1997", text: "IPO in May." },
      { when: "2006", text: "AWS launched." },
      { when: "2018", text: "First touches $1 trillion, September 4." },
      { when: "2021", text: "Jassy succeeds Bezos." },
    ],
  },
  TSM: {
    symbol: "TSM",
    name: "TSMC",
    sector: "Foundry",
    founded: "1987",
    home: "Hsinchu",
    crossed: "2024",
    crossedShort: "2024",
    story: [
      "Morris Chang founded Taiwan Semiconductor Manufacturing Company in 1987 as a pure-play foundry: it would make chips designed by other firms and compete with none of its customers. That bargain is why Apple, NVIDIA, AMD, and Broadcom can all be customers at once. The most advanced process nodes are the scarce input in the current electronics cycle.",
      "Trillion Insights uses the US listing TSM. Yahoo's dollar market cap on that line matches the company figure other public rankings quote, so the Taipei line is not added beside it. TSMC's market cap moved through $1 trillion during 2024 as the AI foundry cycle re-rated the leading edge. The chart is the ADR price scaled to today's dollar cap.",
    ],
    milestones: [
      { when: "1987", text: "Founded in Hsinchu by Morris Chang." },
      { when: "1994", text: "Lists in Taiwan." },
      { when: "1997", text: "NYSE ADR begins trading." },
      { when: "2020", text: "Apple's leading-edge chips are on TSMC nodes." },
      { when: "2024", text: "Market cap moves through $1 trillion." },
    ],
  },
  SPCX: {
    symbol: "SPCX",
    name: "SpaceX",
    sector: "Launch and satellite",
    founded: "2002",
    home: "Hawthorne",
    crossed: "2026",
    crossedShort: "2026",
    story: [
      "Elon Musk founded Space Exploration Technologies in 2002 to cut the cost of reaching orbit. Falcon 1 failed three times before it flew. Falcon 9, first-stage landing, Dragon, and the crew flights for NASA turned reuse from a demo into the way the company launches. Starlink is the other half of the business: a satellite constellation that sells connectivity, and that also fills the launch manifest.",
      "Yahoo lists the company as Space Exploration Technologies under SPCX, and the live market cap is what puts it on Trillion Insights. Public roundups place the first trillion-dollar mark in 2026, after the listing. Starship is the next vehicle; it is not, by itself, the market cap. History before the listing will not appear as a long price series, because there was no public price.",
    ],
    milestones: [
      { when: "2002", text: "Founded in El Segundo, later Hawthorne." },
      { when: "2008", text: "Falcon 1 reaches orbit." },
      { when: "2015", text: "First Falcon 9 landing." },
      { when: "2020", text: "Crew Dragon flies astronauts." },
      { when: "2026", text: "Public trackers put the first $1 trillion mark here." },
    ],
  },
  META: {
    symbol: "META",
    name: "Meta",
    sector: "Social platforms",
    founded: "2004",
    home: "Menlo Park",
    crossed: "June 28, 2021",
    crossedShort: "Jun 2021",
    story: [
      "Mark Zuckerberg launched Facebook from a Harvard dorm room in 2004. The company went public in 2012, bought Instagram and WhatsApp, and built an advertising machine on top of the social graph. In 2021 it renamed itself Meta and pointed a large share of spending at virtual reality and, later, at generative AI inside the same apps.",
      "Meta first closed above $1 trillion on June 28, 2021, then lost that level in the 2022 ad slowdown and the Reality Labs spending debate. It reclaimed a trillion-dollar cap later, on the same family of apps. The live quote, not the 2021 print, is what keeps it on the list.",
    ],
    milestones: [
      { when: "2004", text: "Facebook launches." },
      { when: "2012", text: "IPO, and the Instagram deal." },
      { when: "2014", text: "WhatsApp acquired." },
      { when: "2021", text: "Renamed Meta. First $1 trillion close, June 28." },
      { when: "2023", text: "The ad business re-accelerates after the 2022 drawdown." },
    ],
  },
  AVGO: {
    symbol: "AVGO",
    name: "Broadcom",
    sector: "Semiconductors",
    founded: "1961",
    home: "Palo Alto",
    crossed: "December 2024",
    crossedShort: "Dec 2024",
    story: [
      "The listed company is the product of Avago, itself spun out of Hewlett-Packard's semiconductor business, buying the old Broadcom in 2016 and taking the name. Under Hock Tan it became a serial acquirer: networking silicon, custom ASICs, mainframe software, VMware. The AI cycle added a second story, custom accelerators and networking sold to the same hyperscalers that buy NVIDIA GPUs.",
      "Broadcom's market cap moved through $1 trillion in December 2024. The heritage of the chip business runs back to the 1961 founding of HP Associates, which is why the founded line is not 2016. The chart follows the public Avago and Broadcom price, scaled to today's dollar cap.",
    ],
    milestones: [
      { when: "1961", text: "HP Associates, the distant semiconductor root." },
      { when: "1991", text: "The original Broadcom is founded." },
      { when: "2016", text: "Avago buys Broadcom and keeps the name." },
      { when: "2023", text: "VMware deal closes." },
      { when: "2024", text: "Market cap moves through $1 trillion in December." },
    ],
  },
  "2222.SR": {
    symbol: "2222.SR",
    name: "Saudi Aramco",
    sector: "Oil",
    founded: "1933",
    home: "Dhahran",
    crossed: "December 11, 2019",
    crossedShort: "Dec 2019",
    story: [
      "The Arabian American Oil Company began as a 1933 concession. It became Aramco, then the Saudi state took full ownership by 1980. The reserves under that corporate shell are the reason the market cap was enormous on day one of public trading. The company produces, refines, and ships crude, and it sells natural gas into the kingdom's power and chemicals system.",
      "Aramco listed on the Tadawul on December 11, 2019, and opened already above $1 trillion, briefly the largest public company in the world. Trillion Insights converts the riyal market cap to dollars with Yahoo's SARUSD rate. There is no US share class in the count. DudeDiligence's options catalog does not list 2222.SR.",
    ],
    milestones: [
      { when: "1933", text: "The Saudi concession is signed." },
      { when: "1944", text: "The company is named Aramco." },
      { when: "1980", text: "The Saudi state completes nationalization." },
      { when: "2019", text: "Tadawul IPO on December 11, already above $1 trillion." },
    ],
  },
  TSLA: {
    symbol: "TSLA",
    name: "Tesla",
    sector: "Autos and energy",
    founded: "2003",
    home: "Austin",
    crossed: "October 25, 2021",
    crossedShort: "Oct 2021",
    story: [
      "Martin Eberhard and Marc Tarpenning founded Tesla in 2003; Elon Musk led the Series A and later became chief executive. The Roadster proved a battery car could be desirable. The Model S, Model 3, and Model Y made it a volume manufacturer, with a second business in storage and a long argument about autonomy and robots that the market sometimes prices and sometimes does not.",
      "Tesla first closed above $1 trillion on October 25, 2021, then spent long stretches below the line. It is on Trillion Insights only when the live market cap says so. The headquarters is now in Austin; the factory story runs through Fremont, Shanghai, Berlin, and Texas.",
    ],
    milestones: [
      { when: "2003", text: "Founded in San Carlos." },
      { when: "2010", text: "IPO in June." },
      { when: "2012", text: "Model S deliveries begin." },
      { when: "2021", text: "First close above $1 trillion, October 25." },
      { when: "2022", text: "The cap falls back under the line for a long stretch." },
    ],
  },
  "005930.KS": {
    symbol: "005930.KS",
    name: "Samsung Electronics",
    sector: "Semiconductors and devices",
    founded: "1969",
    home: "Suwon",
    crossed: "2026",
    crossedShort: "2026",
    story: [
      "Lee Byung-chul founded the Samsung trading company in 1938. Samsung Electronics, started in 1969, is the piece that matters for this list: memory chips, foundry, phones, displays, and appliances. It is the largest memory maker alongside SK hynix and Micron, and it is also a consumer brand in a way those two are not.",
      "The common share, 005930.KS, is the line Trillion Insights uses. The won market cap is converted at Yahoo's KRWUSD rate. The preferred line is not added. In 2026 the memory cycle lifted that dollar value through $1 trillion. This page does not pin a first session, because the public tape is noisier than Apple's 2018 close. DudeDiligence does not list a Seoul options board for it.",
    ],
    milestones: [
      { when: "1938", text: "Samsung trading company founded." },
      { when: "1969", text: "Samsung Electronics established." },
      { when: "1983", text: "The group commits to semiconductors." },
      { when: "2012", text: "The Galaxy phone cycle is at full scale." },
      { when: "2026", text: "The common stock's dollar cap is back through $1 trillion." },
    ],
  },
  "BRK-B": {
    symbol: "BRK-B",
    name: "Berkshire Hathaway",
    sector: "Conglomerate",
    founded: "1839",
    home: "Omaha",
    crossed: "August 2024",
    crossedShort: "Aug 2024",
    story: [
      "Berkshire Hathaway began as a New England textile company. Warren Buffett took control in 1965 and used it as a holder for insurance companies whose float could be invested, then for wholly owned businesses and a concentrated stock portfolio. The textile mill is long gone. The economic engine is insurance, the railroad, energy, manufacturing, and the equity book.",
      "The Class B share is the row on Trillion Insights. Class A is the same company and is dropped so the cap is not counted twice. Berkshire's market cap moved through $1 trillion in August 2024. DudeDiligence's options catalog does not list BRK-B, so the options section on this page says so instead of borrowing another name's chain.",
    ],
    milestones: [
      { when: "1839", text: "The textile predecessor is founded." },
      { when: "1965", text: "Buffett takes control." },
      { when: "1967", text: "National Indemnity begins the insurance era." },
      { when: "1996", text: "Class B shares are created." },
      { when: "2024", text: "Market cap moves through $1 trillion in August." },
    ],
  },
  MU: {
    symbol: "MU",
    name: "Micron",
    sector: "Memory",
    founded: "1978",
    home: "Boise",
    crossed: "2026",
    crossedShort: "2026",
    story: [
      "Micron was founded in Boise in 1978 by Ward Parkinson and a small group of engineers who wanted to make memory chips outside the existing Japanese and American incumbents. It survived repeated DRAM busts by being one of the last US memory makers left, then by adding NAND and, in this cycle, high-bandwidth memory for AI servers.",
      "The 2026 memory rally is what put the live market cap over $1 trillion. This page does not invent a first session for that crossing. Membership leaves as soon as the quote falls back under the line, which memory companies have always been capable of. The chart is a scaled price path through those older cycles.",
    ],
    milestones: [
      { when: "1978", text: "Founded in Boise." },
      { when: "1984", text: "IPO." },
      { when: "2016", text: "Buys Inotera and deepens DRAM scale." },
      { when: "2024", text: "High-bandwidth memory becomes the AI-server product." },
      { when: "2026", text: "The live quote moves through $1 trillion." },
    ],
  },
  LLY: {
    symbol: "LLY",
    name: "Eli Lilly",
    sector: "Pharmaceuticals",
    founded: "1876",
    home: "Indianapolis",
    crossed: "2025",
    crossedShort: "2025",
    story: [
      "Colonel Eli Lilly founded the company in Indianapolis in 1876. It spent the twentieth century as a broad pharmaceutical house: insulin in the 1920s, then antibiotics, Prozac, and a long diabetes franchise. The drug that re-rated the equity is tirzepatide, sold as Mounjaro for diabetes and Zepbound for weight loss.",
      "Lilly's market cap moved through $1 trillion during 2025 on that franchise and on the expectation that the same class of medicines would stay supply-constrained. It is the rare non-technology name on Trillion Insights. The chart scales the share price to today's dollar cap and does not try to reconstruct a century of splits by hand.",
    ],
    milestones: [
      { when: "1876", text: "Founded in Indianapolis." },
      { when: "1923", text: "Among the first commercial insulin makers." },
      { when: "1986", text: "Prozac is introduced." },
      { when: "2022", text: "Mounjaro approved in the United States." },
      { when: "2025", text: "Market cap moves through $1 trillion." },
    ],
  },
  "000660.KS": {
    symbol: "000660.KS",
    name: "SK hynix",
    sector: "Memory",
    founded: "1983",
    home: "Icheon",
    crossed: "Not on the live Seoul dollar cap",
    crossedShort: "See the quote",
    story: [
      "SK hynix traces to Hyundai Electronics in 1983 and became Hynix after the Asian financial crisis, then part of the SK group. It is a memory company: DRAM, NAND, and high-bandwidth memory sold into the same AI servers that re-rated Micron and Samsung.",
      "Trillion Insights uses the Seoul listing, 000660.KS, converted from won to dollars. Yahoo's US line SKHY reports a share count ten times the Seoul count, which inflates that dollar cap; counting both would also double the company. The Seoul figure is the one that has to clear $1 trillion. If it does, the name enters on its own. DudeDiligence lists SKHY, not the Seoul ticker, and the options section follows whatever symbol this page is actually showing.",
    ],
    milestones: [
      { when: "1983", text: "Hyundai Electronics founded." },
      { when: "2001", text: "The memory business becomes Hynix." },
      { when: "2012", text: "SK Group takes control." },
      { when: "2024", text: "High-bandwidth memory is the scarce AI part." },
    ],
  },
  AMD: {
    symbol: "AMD",
    name: "AMD",
    sector: "Semiconductors",
    founded: "1969",
    home: "Santa Clara",
    crossed: "Not while the live cap is under $1T",
    crossedShort: "Under the line",
    story: [
      "Jerry Sanders founded Advanced Micro Devices in 1969. For decades it was the second-source x86 company. Under Lisa Su it became a design house whose chips are built at TSMC: Ryzen in PCs, EPYC in servers, and Instinct GPUs aimed at the same AI budgets NVIDIA dominates.",
      "AMD sits in the monitored set because it trades just under the line often enough to cross it without a change in this code. The page stays up either way. The live dollar market cap is the only switch.",
    ],
    milestones: [
      { when: "1969", text: "Founded in Sunnyvale." },
      { when: "1972", text: "IPO." },
      { when: "2014", text: "Lisa Su becomes chief executive." },
      { when: "2017", text: "Ryzen and EPYC restart the CPU franchise." },
    ],
  },
  WMT: {
    symbol: "WMT",
    name: "Walmart",
    sector: "Retail",
    founded: "1962",
    home: "Bentonville",
    crossed: "Not while the live cap is under $1T",
    crossedShort: "Under the line",
    story: [
      "Sam Walton opened the first Walmart in Rogers, Arkansas, in 1962. Scale in grocery and general merchandise, then a late push into stores that also ship, is the whole story. It is in the monitored set so a move through $1 trillion would show up on the next refresh.",
    ],
    milestones: [
      { when: "1962", text: "First Walmart store." },
      { when: "1970", text: "IPO." },
      { when: "1991", text: "International stores begin." },
    ],
  },
  JPM: {
    symbol: "JPM",
    name: "JPMorgan Chase",
    sector: "Banking",
    founded: "1799",
    home: "New York",
    crossed: "Not while the live cap is under $1T",
    crossedShort: "Under the line",
    story: [
      "The bank is the merger of J.P. Morgan and Chase, with roots in the Bank of the Manhattan Company in 1799. It is the largest US bank by assets and by market cap, and it sits in the monitored set just under the trillion-dollar line.",
    ],
    milestones: [
      { when: "1799", text: "Bank of the Manhattan Company chartered." },
      { when: "2000", text: "J.P. Morgan and Chase merge." },
      { when: "2008", text: "Buys Bear Stearns and Washington Mutual." },
    ],
  },
  V: {
    symbol: "V",
    name: "Visa",
    sector: "Payments",
    founded: "1958",
    home: "San Francisco",
    crossed: "Not while the live cap is under $1T",
    crossedShort: "Under the line",
    story: [
      "Visa began as BankAmericard in 1958 and became a member-owned network before the 2008 IPO turned it into a public tollbooth on card payments. It is monitored because it is one of the largest US listings still under $1 trillion.",
    ],
    milestones: [
      { when: "1958", text: "BankAmericard launched." },
      { when: "1976", text: "The Visa name is adopted." },
      { when: "2008", text: "IPO." },
    ],
  },
  XOM: {
    symbol: "XOM",
    name: "ExxonMobil",
    sector: "Oil",
    founded: "1870",
    home: "Houston",
    crossed: "Not while the live cap is under $1T",
    crossedShort: "Under the line",
    story: [
      "Standard Oil of New Jersey, later Exxon, was John D. Rockefeller's largest heir. The 1999 merger with Mobil created the company on this page. It is monitored with the other names that can approach $1 trillion when oil and the multiple line up, and it is not a member unless the live dollar cap says so.",
    ],
    milestones: [
      { when: "1870", text: "Standard Oil founded." },
      { when: "1972", text: "The Exxon name is adopted." },
      { when: "1999", text: "Exxon and Mobil merge." },
    ],
  },
};

export function profileFor(symbol: string, legalName: string): Profile {
  const known = PROFILES[symbol];
  if (known) return known;
  return {
    symbol,
    name: legalName,
    sector: "Public company",
    founded: "—",
    home: "—",
    crossed: "Decided by the live quote",
    crossedShort: "Live quote",
    story: [
      `${legalName} entered the monitored set because its live dollar market cap can clear one trillion. A longer note, with founding, products, and the session it first crossed, is not written for this ticker yet.`,
      "The quote, the scaled chart, the headlines, and the options section still run from their sources. Membership is not stored. If the cap falls under $1 trillion, the name leaves the main list on the next refresh.",
    ],
    milestones: [],
  };
}

export function newsQueries(symbol: string, name: string): string[] {
  if (symbol === "BTC") return ["BTC-USD", "Bitcoin"];
  if (symbol === "2222.SR") return ["2222.SR", "Saudi Aramco"];
  if (symbol === "005930.KS") return ["005930.KS", "Samsung Electronics"];
  if (symbol === "000660.KS") return ["000660.KS", "SK hynix"];
  return [symbol, name];
}
