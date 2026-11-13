type Status = "未讀" | "讀過" | "複習過" | "考過";
export interface Island {
  id: string;
  name: string;
  group: string;
  priority: boolean;
  x: number;
  y: number;
  note: string;
}
export interface Unit {
  id: string;
  island: string;
  book: number;
  name: string;
}
export interface Link2 {
  a: string;
  b: string;
  why: string;
}
export interface Cele {
  key: number;
  title: string;
  line: string;
  idol: string;
  idolLine: string;
  big: boolean;
  friend: string;
  friendLine: string;
}
export interface Bubble {
  id: string;
  text: string;
  key: number;
}

export const STATUSES: Status[] = ["未讀", "讀過", "複習過", "考過"];
export const WEIGHT: Record<Status, number> = {
  未讀: 0,
  讀過: 1 / 3,
  複習過: 2 / 3,
  考過: 1,
};
export const LEVEL: Record<Status, number> = {
  未讀: 0,
  讀過: 1,
  複習過: 2,
  考過: 3,
};

// 配色：取樣自 HEART 政策島截圖（海、島面、赤陶島緣、柔和綠樹、奶油色介面、橘色強調）
export const SEA = "#60A8B0";
export const SEA_DEEP = "#5AA0A8";
export const SHALLOW = "#86BFC1";
export const FOAM = "#E9E7DE";
export const SAGE = "#CACFAE";
export const PAVE = "#DCD2BC";
export const CREAM = "#FAF9F5";
export const SIDE_L = "#D3BC9E";
export const SIDE_F = "#C29C7F";
export const SIDE_R = "#AE8F70";
export const ORANGE = "#DB6A41";
export const LEAF_D = "#879575";
export const LEAF_L = "#A2B497";
export const LEAF_Y = "#B6BE8F";
export const PINE = "#699B8A";
export const TRUNK = "#895E43";
export const WALL = "#F2EEE4";
export const WALL_S = "#D9D1C1";
export const WIN = "#A5BCBB";
export const LIT = "#FFD98A";
export const LIGHT = "#FFE6A3";
export const INK = "#33342D";
export const OL = "#4A3B33";
export const UI_BG = "#FEF7F2";
export const UI_LINE = "#EADFD3";
export const ACC: Record<string, string> = {
  math: "#E0874A",
  phy: "#5E9FB5",
  bio: "#8FAE6A",
  earth: "#8C88B8",
  his: "#C46A4E",
  geo: "#DB6A41",
  civ: "#D4A84A",
  eng: "#E07A6A",
  chi: "#A8789E",
};

// 島嶼：位置與標記。改名只要改 name。
export const ISLANDS: Island[] = [
  {
    id: "chi",
    name: "國文島",
    group: "語文",
    priority: false,
    x: 180,
    y: 200,
    note: "穩定科目，維持即可",
  },
  {
    id: "eng",
    name: "英文島",
    group: "語文",
    priority: false,
    x: 440,
    y: 165,
    note: "穩定科目，維持即可",
  },
  {
    id: "math",
    name: "數學島",
    group: "數學",
    priority: true,
    x: 690,
    y: 335,
    note: "優先：聽得懂、考試不會",
  },
  {
    id: "bio",
    name: "生物島",
    group: "自然",
    priority: true,
    x: 210,
    y: 480,
    note: "優先：自然（冊1–2）",
  },
  {
    id: "phy",
    name: "理化島",
    group: "自然",
    priority: true,
    x: 470,
    y: 545,
    note: "優先：自然（冊3–6）",
  },
  {
    id: "earth",
    name: "地科島",
    group: "自然",
    priority: false,
    x: 830,
    y: 555,
    note: "優先：自然（冊5–6，本學期起）",
  },
  {
    id: "his",
    name: "歷史島",
    group: "社會",
    priority: false,
    x: 905,
    y: 165,
    note: "社會",
  },
  {
    id: "geo",
    name: "地理島",
    group: "社會",
    priority: false,
    x: 1085,
    y: 405,
    note: "社會",
  },
  {
    id: "civ",
    name: "公民島",
    group: "社會",
    priority: false,
    x: 1150,
    y: 170,
    note: "社會",
  },
];

export const FACILITY: Record<string, string> = {
  math: "鐘樓",
  phy: "實驗室",
  bio: "溫室",
  earth: "天文台",
  his: "城堡",
  geo: "燈塔",
  civ: "市政廳",
  eng: "咖啡館",
  chi: "涼亭",
};

// 建築＝單元。依 108 課綱常見學習內容；冊別為多數版本的安排，版本確認後再改。book 0 ＝跨冊主題。
export const U = (
  id: string,
  island: string,
  book: number,
  name: string,
): Unit => ({ id, island, book, name });
export const UNITS: Unit[] = [
  U("m1a", "math", 1, "整數、數線與四則運算"),
  U("m1b", "math", 1, "指數記法與科學記號"),
  U("m1c", "math", 1, "因數倍數與分數運算"),
  U("m1d", "math", 1, "一元一次方程式"),
  U("m2a", "math", 2, "二元一次聯立方程式"),
  U("m2b", "math", 2, "直角坐標與方程式圖形"),
  U("m2c", "math", 2, "比與比例"),
  U("m2d", "math", 2, "一元一次不等式"),
  U("m2e", "math", 2, "統計圖表"),
  U("m2f", "math", 2, "線對稱與三視圖"),
  U("m3a", "math", 3, "乘法公式與多項式"),
  U("m3b", "math", 3, "平方根與畢氏定理"),
  U("m3c", "math", 3, "因式分解"),
  U("m3d", "math", 3, "一元二次方程式"),
  U("m4a", "math", 4, "數列與級數"),
  U("m4b", "math", 4, "線型函數及其圖形"),
  U("m4c", "math", 4, "三角形基本性質"),
  U("m4d", "math", 4, "平行與四邊形"),
  U("m5a", "math", 5, "比例線段與相似形"),
  U("m5b", "math", 5, "圓的性質"),
  U("m5c", "math", 5, "幾何與證明（三心）"),
  U("m6a", "math", 6, "二次函數"),
  U("m6b", "math", 6, "統計與機率"),
  U("m6c", "math", 6, "立體圖形"),

  U("b1a", "bio", 1, "生命世界與科學方法"),
  U("b1b", "bio", 1, "細胞與生物體構造"),
  U("b1c", "bio", 1, "養分（光合作用、酵素、消化）"),
  U("b1d", "bio", 1, "運輸作用"),
  U("b1e", "bio", 1, "協調作用（神經、內分泌）"),
  U("b1f", "bio", 1, "恆定性（呼吸、排泄、體溫）"),
  U("b2a", "bio", 2, "生殖"),
  U("b2b", "bio", 2, "遺傳"),
  U("b2c", "bio", 2, "演化與化石"),
  U("b2d", "bio", 2, "生物分類"),
  U("b2e", "bio", 2, "生態系（能量流動、物質循環）"),
  U("b2f", "bio", 2, "人類與環境"),

  U("p3a", "phy", 3, "基本測量與密度"),
  U("p3b", "phy", 3, "物質、水溶液與濃度、空氣"),
  U("p3c", "phy", 3, "波動與聲音"),
  U("p3d", "phy", 3, "光（反射、折射、透鏡）"),
  U("p3e", "phy", 3, "溫度與熱（比熱）"),
  U("p3f", "phy", 3, "元素、原子與週期表"),
  U("p4a", "phy", 4, "化學反應與計量（質量守恆、莫耳）"),
  U("p4b", "phy", 4, "電解質與酸鹼鹽"),
  U("p4c", "phy", 4, "氧化與還原"),
  U("p4d", "phy", 4, "反應速率與平衡"),
  U("p4e", "phy", 4, "有機化合物"),
  U("p4f", "phy", 4, "力、壓力與浮力"),
  U("p5a", "phy", 5, "直線運動（速度、加速度）"),
  U("p5b", "phy", 5, "力與運動（牛頓運動定律）"),
  U("p5c", "phy", 5, "功與能、槓桿與簡單機械"),
  U("p5d", "phy", 5, "基本電路與歐姆定律"),
  U("p6a", "phy", 6, "電流熱效應、電池與電解"),
  U("p6b", "phy", 6, "電與磁（電流磁效應、電磁感應）"),

  U("s5a", "earth", 5, "水與陸地（岩石、地貌）"),
  U("s5b", "earth", 5, "板塊運動與地球歷史"),
  U("s5c", "earth", 5, "天體運動（晝夜、四季、月相、潮汐）"),
  U("s6a", "earth", 6, "天氣（氣團、鋒面、颱風）"),
  U("s6b", "earth", 6, "全球變遷與永續發展"),

  U("h1a", "his", 1, "史前文化、原住民與大航海時代"),
  U("h1b", "his", 1, "清帝國時期的臺灣"),
  U("h2a", "his", 2, "日治時期的臺灣"),
  U("h2b", "his", 2, "戰後臺灣的政治、經濟與社會"),
  U("h3a", "his", 3, "商周至隋唐的國家與社會"),
  U("h3b", "his", 3, "宋元明清與西力衝擊"),
  U("h4a", "his", 4, "中華民國建立與新思潮"),
  U("h4b", "his", 4, "共黨政權與當代東亞"),
  U("h5a", "his", 5, "古文明、希臘羅馬與宗教"),
  U("h5b", "his", 5, "近代歐洲的興起與變革"),
  U("h6a", "his", 6, "革命年代、民族與帝國主義"),
  U("h6b", "his", 6, "兩次世界大戰與戰後局勢"),

  U("g1a", "geo", 1, "世界眼中的臺灣（位置、經緯度、地圖）"),
  U("g1b", "geo", 1, "臺灣的地形與海域"),
  U("g1c", "geo", 1, "臺灣的氣候與水文"),
  U("g2a", "geo", 2, "臺灣的人口"),
  U("g2b", "geo", 2, "臺灣的產業"),
  U("g2c", "geo", 2, "臺灣的區域"),
  U("g3a", "geo", 3, "中國的自然環境與人口"),
  U("g3b", "geo", 3, "中國的產業與經濟"),
  U("g3c", "geo", 3, "大洋洲與兩極地區"),
  U("g4a", "geo", 4, "東亞"),
  U("g4b", "geo", 4, "東南亞與南亞"),
  U("g5a", "geo", 5, "西亞、北非與漠南非洲"),
  U("g5b", "geo", 5, "歐洲與俄羅斯"),
  U("g6a", "geo", 6, "美洲與全球議題"),

  U("c1a", "civ", 1, "自我、家庭與性別"),
  U("c1b", "civ", 1, "學校與社區生活"),
  U("c2a", "civ", 2, "社會文化與規範"),
  U("c2b", "civ", 2, "社會團體與社會福利"),
  U("c3a", "civ", 3, "國家、民主政治與憲法"),
  U("c3b", "civ", 3, "中央與地方政府、政治參與"),
  U("c4a", "civ", 4, "民法與生活"),
  U("c4b", "civ", 4, "刑法、行政法與權利救濟"),
  U("c5a", "civ", 5, "選擇、消費與生產"),
  U("c5b", "civ", 5, "市場、貨幣、分工與貿易"),
  U("c6a", "civ", 6, "科技倫理與全球化"),

  U("n1", "chi", 0, "白話文選讀（各冊課文）"),
  U("n2", "chi", 0, "文言文選讀（各冊課文）"),
  U("n3", "chi", 0, "字音字形與成語"),
  U("n4", "chi", 0, "修辭與句型"),
  U("n5", "chi", 0, "國學常識（文體、詩詞）"),
  U("n6", "chi", 0, "閱讀測驗（長文、圖表）"),
  U("n7", "chi", 0, "寫作測驗"),

  U("e1", "eng", 0, "基礎句型：be 動詞、現在式、進行式"),
  U("e2", "eng", 0, "過去式與未來式"),
  U("e3", "eng", 0, "助動詞、比較級與最高級"),
  U("e4", "eng", 0, "不定詞與動名詞"),
  U("e5", "eng", 0, "現在完成式"),
  U("e6", "eng", 0, "連接詞與子句"),
  U("e7", "eng", 0, "被動語態"),
  U("e8", "eng", 0, "關係代名詞與分詞"),
  U("e9", "eng", 0, "單字（基本 1200 字詞）"),
  U("e10", "eng", 0, "英語聽力"),
  U("e11", "eng", 0, "閱讀測驗"),
];

export const LINKS: Link2[] = [
  { a: "m2c", b: "p3a", why: "密度＝質量÷體積，就是比與比例" },
  { a: "m2c", b: "p5d", why: "歐姆定律 V＝IR：電壓與電流成正比" },
  { a: "m4b", b: "p5a", why: "等速運動的位置－時間圖是線型函數" },
  { a: "m6a", b: "p5a", why: "等加速度運動的位移－時間關係是二次函數" },
  { a: "m1b", b: "p4a", why: "莫耳、原子量用到科學記號與指數" },
  { a: "m5a", b: "p3d", why: "針孔與透鏡成像用相似三角形算大小" },
  { a: "m2e", b: "g2a", why: "人口金字塔與人口統計圖判讀" },
  { a: "m2e", b: "c5b", why: "價格、供需變化圖表判讀" },
  { a: "m6b", b: "b2b", why: "遺傳的子代比例就是機率" },
  { a: "b1c", b: "p4d", why: "酵素是生物體內的催化劑，影響反應速率" },
  { a: "b1f", b: "p4c", why: "呼吸作用是養分的氧化反應" },
  { a: "b2e", b: "s6b", why: "碳循環與溫室效應、全球暖化" },
  { a: "p3e", b: "s6a", why: "海陸比熱差異形成海陸風與季風" },
  { a: "s6a", b: "g1c", why: "季風、梅雨、颱風與臺灣氣候" },
  { a: "s5b", b: "g1b", why: "板塊擠壓造就臺灣的山脈與地形" },
  { a: "s5c", b: "g1a", why: "經緯度、晝夜與四季" },
  { a: "h2b", b: "c3a", why: "戰後民主化與憲政體制" },
  { a: "h6a", b: "g5a", why: "帝國主義殖民與非洲國界、發展" },
];

export const publisher = (id: string) =>
  ["bio", "phy", "earth"].includes(id) ? "康軒" : "翰林";
