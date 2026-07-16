/**
 * 115學年度心創力．課程規劃簡報產生器（後端）
 *
 * 流程：
 *   1. 夥伴在網頁精靈依 7 頁簡報的順序填寫欄位（index.html）
 *   2. 草稿與產出紀錄存進 Google Sheet（SHEET_ID）
 *   3. 「產生簡報」→ 複製佔位符母版（TEMPLATE_ID）→ replaceAllText 套版
 *      → 產出與附件格式、顏色、頁面編排完全一致的 Google Slides（可再匯出 PPTX）
 *
 * 初次使用：先在編輯器執行一次 setup()（會建立輸出資料夾、紀錄表、母版），
 * 再部署為網頁應用程式。詳見 README.md。
 */

var PROPS = PropertiesService.getScriptProperties();

// ====== 方案課程額度（以「每學期」為單位；與學校概要網頁一致）======
var PLAN_COURSES = {
  'A': { title: '方案A・完整體驗', items: [
    { type: '學生多元課程（廣度）', n: 2 },
    { type: '學生探索課程（聚焦）', n: 1 },
    { type: '教育者賦能', n: 2 },
    { type: '師生共學工作坊', n: 1 }
  ]},
  'B': { title: '方案B・多元體驗', items: [
    { type: '學生多元課程（廣度）', n: 3 },
    { type: '教育者賦能', n: 3 }
  ]},
  'C': { title: '方案C・探索工作坊', items: [
    { type: '學生探索課程（聚焦）', n: 3 },
    { type: '教育者賦能', n: 3 }
  ]},
  '校訂': { title: '校訂課程（客製）', items: [
    { type: '校訂課程', n: 3 }
  ]},
  '校訂＋教支': { title: '校訂課程＋教師支持（客製）', items: [
    { type: '校訂課程', n: 3 },
    { type: '教師支持研習', n: 3 }
  ]},
  '教支': { title: '教師支持（客製）', items: [
    { type: '教師支持研習', n: 3 }
  ]}
};

// ====== 學校 / 單位資料（與「學校／單位概要」網頁同步；未來可改由 Sheet 讀取）======
var SCHOOLS = [
  { name: '峨眉國小', county: '新竹縣', plan: 'B', lead: '潔言', co: '知善',
    students: '全校 53 人（一 4、二 4、三 9、四 8、五 16、六 12）。性別比約 1:1；約 90% 為客家籍。過動 1 人（G2，已評估服藥）。',
    features: ['校本課程以客家文化為主軸，融入各學科（客語教學與認證、英語沉浸式客家文化）。', '社團課程多元：客家歌謠、美感手作烹飪社、桌球、二胡、木球等（約 3/4 學生參與）。', '美感手作烹飪社與土地社以客家文化、社區、土地連結為主軸，曾有採食、擂茶、果園參訪等校外行程。'],
    needs: ['優先安排「肢體表達與戲劇創作」——以身體說故事、用戲劇表達心情。', '希望孩子對情緒有更多認識，並擁有多元的表達管道。', '教師端期待戲劇／舞蹈治療專長講師，建構心理安全校園、提升團體動力，拉近師生關係。'],
    serve: '以 3–4 年級學生為主；師生共學排週二下午、教師共學排週三下午。' },
  { name: '明德國小', county: '苗栗縣', plan: 'B', lead: '亭君', co: '維傑',
    students: '全校 26 人（一 2、二 2、三 5、四 6、五 3、六 8）。隔代教養 6、單親 8、新住民子女 2；特殊個案：過動（二甲）、學習障礙（三/四/五甲）、智能障礙（六甲）。',
    features: ['位於明德水庫旁，自然生態豐富；校本特色以蜜蜂、茶、水資源為主。', '水資源環境教育、茶產業、養蜂（蜜源植物延伸香草植物），全校共同進行；五年級導師結合繪本與社區走讀。', '曾與亞洲劇團合作戲劇課（已結束）、與社區發展協會合作蜜蜂課（實地參觀蜂箱）。'],
    needs: ['學生：藝術創作與語文表達（手作）、肢體表達與戲劇創作——以多元表達打開肢體、增進表達並結合校本。', '教師：自我探索與生活應用、邏輯思維與科技應用、身心支持與放鬆（律動）。', '希望多一些不一樣的多元體驗，最好能與校本主題（蜂、茶、水資源）連結。'],
    serve: '全年級學生；學生週三下午 13:10–15:10，教師週三下午 13:30–15:30。' },
  { name: '西屯國小', county: '臺中市', plan: '校訂＋教支', lead: '維傑', co: '潔言',
    students: '校訂課程小組 6 位；教師支持研習場次約 100 位。',
    features: ['以「教師社群支持」為核心，結合校訂課程與教師增能。', '規劃 3 次校訂課程（6 位）＋ 3 次教師支持研習（約 100 位）。'],
    needs: ['透過教師社群陪伴與共學，深化校訂課程的設計與帶領能量。'],
    serve: '校訂課程小組與全校教師社群。' },
  { name: '水尾國小', county: '彰化縣', plan: 'B', lead: '亭君', co: '伶聿',
    students: '全校 36 人（一 2、二 8、三 8、四 2、五 8、六 8）。中低收入戶 17 人、單親 4 人、新住民子女 2 人；特殊個案 1 案。',
    features: ['以濁水溪為核心的在地探索；水尾三寶（紫黑米、蘿蔔、青蔥）食農教育與社區踏查。', '課程願景：生態永續、健康樂活、全球視野、創意展能。', '過往影像／藝術探索計畫：紀錄片《溪光拾夢》、遠鄉閃閃攝影。'],
    needs: ['學生：藝術創作與語文表達、肢體表達與戲劇創作——以「看見家鄉→看見自己」深化表達、同理與合作。', '教師：SDGs 永續融入跨領域教學的增能；以 SEL 為核心的自我覺察與情緒照顧；透過共備建立教師支持系統。'],
    serve: '動手實作能力強，惟情緒覺察與內在安定較需支持；可用場地：操場、活動中心、教室、圖書室、音樂教室。' },
  { name: '長福國小', county: '南投縣', plan: 'A', lead: '潔言', co: '知善',
    students: '全校 53 人（一 10、二 7、三 13、四 9、五 8、六 6）。特殊個案 2（五、六年級學習障礙各 1）；七成以上來自學區之外。',
    features: ['實驗教育學校，主軸為探索體驗教育＋自然生態與永續發展（海洋教育較薄弱）。', '多數學生對戶外學習及手作課程投入度高；疫情後書寫能力偏弱情形明顯。'],
    needs: ['希望計畫與校內課程深度融合，透過外部業師激盪共創，優化實驗教育課程。', '可著重海洋議題教育（如海邊探查）、強化文字表達力。', '教師工作坊盼提供心靈與知能成長——芳療、藝術療癒、內在探索類研習。'],
    serve: '以中年級為主、高年級為輔；師生課程皆排週三下午。' },
  { name: '南投社工據點', county: '南投縣', plan: '教支', lead: '伶聿', co: '亭君',
    students: '',
    features: ['以教師／工作者支持研習為主的社區據點。'],
    needs: ['研習形式採 TA（助教）協作模式；課程內容與方向待進一步討論確認。'],
    serve: '據點工作者與服務團隊。' },
  { name: '水里國小', county: '南投縣', plan: '校訂', lead: '亭君', co: '伶聿',
    students: '全校 335 人（一 47、二 58、三 54、四 66、五 57、六 53）；另設特教班 2 班。',
    features: ['校本課程「五行（金木水火土）」結合在地文化與閱讀：低年級繪本、中年級紙本刊物＋Pagamo、高年級議題文本＋素養品學堂。', '課程方向已具規模，惟同質性偏高，學生易感重複；教師偏向按表操課。'],
    needs: ['基於現有「金木水火土」主題進行課程再設計與優化，協助老師將想法落地。', '每學期 2–3 次課程，其中 1 次保留給學校老師發表調整後的課程內容並回饋。'],
    serve: '單次上課最多約 30 人；週三下午 13:30–16:00。' },
  { name: '瑞里國小', county: '嘉義縣', plan: 'A', lead: '知善', co: '亭君',
    students: '全校 17 人（一 1、二 1、三 1、四 5、五 6、六 3），混齡。四年級自閉症個案；皆為在地學生、同儕親密。',
    features: ['校本以「紫色山城」與「高山茶鄉」為核心：紫藤花季、螢火蟲復育、高山茶與咖啡產業體驗。', 'SDGs 融入、AI 工具與機器人應用、PBL 專案式學習。', '115 學年度為校本轉型期，適逢百週年校慶，致力梳理在地文史記憶。'],
    needs: ['學生：在地人文歷史＋生態科技整合（相機、無人機記錄家鄉故事）。', '教師：課程設計與素材轉化、在地文史工作坊——協助將歷史資料轉化為易懂教案。', '期待建立永續且具深度的校本課程模組，提升教師跨領域設計轉化能力。'],
    serve: '全校 1–6 年級；週一三五下午、週三隔週有咖啡課程。可校外工作坊場地：瑞里印象、活動中心。' },
  { name: '仁和國小', county: '嘉義縣', plan: 'B', lead: '知善', co: '維傑',
    students: '本校 7 人（全為女生）；分校 3 男 2 女。',
    features: ['校本課程「山林探索」四大主題（每週 3 節）＋科技人文、國際文化；分校為茶藝。', '「山水聯盟」：本校、分校、來吉國小組成，學生共學 7–8 次/學期。', '關鍵字：茶、紫藤花、咖啡、綠色療癒、生態。'],
    needs: ['希望課程能讓學生多思考、多思辨——進到物種互動、環境保護與生物保育意識。', '精進探究課程設計；安排放鬆類型課程紓解教師行政壓力。', '善用在地茶、咖啡、花卉等自然媒材，連接正念、情緒與自我照顧。'],
    serve: '全校 2–6 年級；週二下午 3 節，教師週三下午。可邀山水聯盟另兩校老師共同參與。' },
  { name: '璞育塾', county: '臺南市', plan: 'B', lead: '潔言', co: '維傑',
    students: '社區據點學童。',
    features: ['台南後壁的社區學習據點，過往合作含繪本與食農主題課程。'],
    needs: ['新學期課程活動由立賢夥伴規劃並擔任講師。', '以繪本創作、食農教育等主題，串連在地生活經驗。'],
    serve: '據點學童與陪伴老師。' },
  { name: '古風國小', county: '花蓮縣', plan: 'A', lead: '知善', co: '亭君',
    students: '全校 30 人（一 4、二 6、三 6、四 4、五 3、六 7）。皆為布農族；特殊個案 2（過動、輕度智能障礙）。',
    features: ['明年度校本結合布農族傳說故事（含大洪水等故事串聯）。', '結合師生共學：孩子進行深度工作坊，教師學習提升學習動機的引導方式。'],
    needs: ['布農族傳說故事與表達／戲劇結合，並期望連結品格教育。', '需求關鍵字：文化、提升學習動力、培養信心。', '教師端盼班級經營（學習動力、控場引導）、心理與團體支持課程。'],
    serve: '預計 3–6 年級（可拆分）；綜合課（一或四下午 14:00–16:00），教師研習週三下午。' },
  { name: '德武國小', county: '花蓮縣', plan: 'B', lead: '伶聿', co: '潔言',
    students: '全校 23 人（一 6、二 2、三 2、四 5、五 3、六 5）。二年級 1 位 ADHD。',
    features: ['校本以阿美族文化為主：部落歷史、遷移踏查、部落地圖、歌謠、歲時祭儀、傳統技能。', '創客科技類課程：無人機、自走車、雷雕、3D 列印；傳統射箭、烏克麗麗、排笛、舞蹈、田徑。'],
    needs: ['希望透過藝術創作類課程提升孩子的創造力與表達；共學與營隊可先嘗試戲劇形式。', '教師端以自在放鬆方式進行，練習自我覺察與照顧。', '排課盼以個人可完成的活動優先，小組合作少一些。'],
    serve: '全校 1–6 年級（可依年段拆分）；傾向週五三四節、教師週三下午。避開 12 月親子教育、5 月縣學力測驗等時段。' },
  { name: '台灣練習曲文教協會', county: '花蓮縣', plan: 'B', lead: '維傑', co: '伶聿',
    students: '共 44 位棒球隊成員（全男性，太魯閣＆阿美族為主），其中 20 位住宿生為主要對象；過動服藥 9 人。',
    features: ['由棒球隊轉型為實驗學校，運動之外導入多元教育。', '與慈濟基金會合作，每月 1–2 場學生與社區長者互動活動。'],
    needs: ['延伸課輔需求＋將球隊訓練能力遷移到其他領域，給孩子更多探索世界的熱情與機會。', '路徑：建立關係 → 團體到個人的體驗 → 練習抽象表達 → 自我探索。', '前期從能引起動機的主題切入（藝術創作、自然探索、戲劇遊戲）；需控場經驗佳、會玩的講師。'],
    serve: '住宿生 20 位為主；3 位教練＋課輔教師。課程避開練球時間。' },
  { name: '西口國小', county: '金門縣', plan: 'A', lead: '伶聿', co: '潔言',
    students: '全校 57 人（低 11、中 28、高 18）。中低年級有 1–2 位高關懷學生（狀況穩定）。',
    features: ['在地文化豐厚：閩南、華僑（星馬汶）、烈嶼宮廟、戰地文化。', '校訂課程多元：閱讀與自主學習、國際教育（汶萊主軸）、賞鳥、戰爭史。'],
    needs: ['肢體與藝術創作為主，期待有機會跨校連結（烈嶼三校從競爭轉向交流）。', '成長型思維、從孩子內在創意自信出發；盼鼓勵老師課程設計更創新大膽。'],
    serve: '以中年級（28 位）為主；教師共學與課程排週三下午。' },
  { name: '將軍國小', county: '澎湖縣', plan: 'B', lead: '維傑', co: '知善',
    students: '9 位（8 男 1 女），115 學年度預計新增新生 1 位；低 2、中 4、高 3。特殊狀況 2（自閉、學習障礙）。',
    features: ['校長推動四大主軸：海洋、科技（積木）、閱讀、結合地理文化特色。', '活化教學（積木、羽球）、國際教育（英語、國際學伴）、海洋外聘講師。'],
    needs: ['科學、戲劇、生物動態類，多一些手作、跟課本不一樣的體驗（一學期去兩次，小孩 6hr／老師 3hr）。', '學生偏好動手做、平常接觸不到的內容。', '教師端：釋放壓力、團隊動力、溝通與理解。'],
    serve: '小孩課＋教師研習（週三下午有機會共學）。' }
];

// ====== Web App 入口 ======
// 預設「即時模式」：每次載入直接抓 GitHub 上最新的 index.html 來顯示，
// 因此前端（index.html）改版只要推上 GitHub 即自動生效，不必貼檔或重新部署。
// 抓取失敗時自動退回專案內建的 index（最後一次貼上的版本）。
// 想關閉即時模式：指令碼屬性設定 LIVE_HTML = off（改用專案內建 index）。
// setFaviconUrl 需要「真實網址」且只吃點陣圖（PNG/ICO/GIF/JPG，不支援 SVG／data URI），
// 因此指向 repo 內的 favicon.png（GitHub raw 以 image/png 回應）。
function faviconUrl_() {
  var branch = PROPS.getProperty('SOURCE_BRANCH') || GH_DEFAULT_BRANCH;
  return 'https:/' + '/raw.githubusercontent.com/' + GH_REPO + '/' + branch + '/' + GH_DIR + 'favicon.png';
}

function doGet() {
  return buildPage_()
    .setTitle('心創力．課程規劃簡報產生器')
    .setFaviconUrl(faviconUrl_())
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function buildPage_() {
  if (PROPS.getProperty('LIVE_HTML') === 'off') {
    return HtmlService.createHtmlOutputFromFile('index');
  }
  var cache = CacheService.getScriptCache();
  var html = cache.get('LIVE_INDEX');
  if (!html) {
    try {
      html = ghFetch_('index.html', PROPS.getProperty('SOURCE_BRANCH') || GH_DEFAULT_BRANCH);
      try { cache.put('LIVE_INDEX', html, 90); } catch (e2) {} // 過大無法快取則略過
    } catch (e) {
      return HtmlService.createHtmlOutputFromFile('index'); // 取得失敗→退回內建版本
    }
  }
  return HtmlService.createHtmlOutput(html);
}

// 想讓最新的 index.html 立刻生效（不等 90 秒快取）時，在編輯器執行一次
function clearHtmlCache() {
  CacheService.getScriptCache().remove('LIVE_INDEX');
  return '已清除快取，下次載入將抓取最新 index.html';
}

function getUrl() {
  return ScriptApp.getService().getUrl();
}

// 前端初始化資料
function getInit() {
  return {
    ok: true,
    schools: SCHOOLS,
    planCourses: PLAN_COURSES,
    drafts: listDrafts_(),
    user: Session.getActiveUser().getEmail()
  };
}

// ====== 初始設定（在編輯器手動執行一次）======
function setup() {
  var folderId = PROPS.getProperty('FOLDER_ID');
  if (!folderId) {
    folderId = DriveApp.createFolder('心創力課程規劃簡報').getId();
    PROPS.setProperty('FOLDER_ID', folderId);
  }
  shareToDomain_(DriveApp.getFolderById(folderId)); // 整個資料夾對團隊（同網域）開放
  var sheetId = PROPS.getProperty('SHEET_ID');
  if (!sheetId) {
    var ss = SpreadsheetApp.create('心創力課程規劃．填寫紀錄');
    DriveApp.getFileById(ss.getId()).moveTo(DriveApp.getFolderById(folderId));
    sheetId = ss.getId();
    PROPS.setProperty('SHEET_ID', sheetId);
  }
  var templateId = PROPS.getProperty('TEMPLATE_ID');
  if (!templateId) {
    templateId = rebuildMaster_(TEMPLATE_B64);
  }
  Logger.log('FOLDER_ID=%s\nSHEET_ID=%s\nTEMPLATE_ID=%s', folderId, sheetId, templateId);
  return { folderId: folderId, sheetId: sheetId, templateId: templateId };
}

// 母版有更新（貼上新的 Template.gs 後）在編輯器執行一次：
// 以新內容重建母版並更新 TEMPLATE_ID，舊母版改名封存
function refreshTemplate() {
  return rebuildMaster_(TEMPLATE_B64);
}

// 以指定 base64（PPTX）重建 Google Slides 母版；需啟用 Drive 進階服務
function rebuildMaster_(b64) {
  var folderId = PROPS.getProperty('FOLDER_ID');
  if (!folderId) throw new Error('尚未完成初始設定，請先執行 setup()');
  var oldId = PROPS.getProperty('TEMPLATE_ID');
  if (oldId) {
    try {
      var old = DriveApp.getFileById(oldId);
      old.setName(old.getName() + '（舊版 ' +
        Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HHmm') + '）');
    } catch (e) {}
  }
  var blob = Utilities.newBlob(
    Utilities.base64Decode(b64),
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '心創力課程規劃簡報．母版.pptx');
  var file = Drive.Files.create({
    name: '心創力課程規劃簡報．母版（請勿改動 {{佔位符}}）',
    mimeType: 'application/vnd.google-apps.presentation',
    parents: [folderId]
  }, blob);
  PROPS.setProperty('TEMPLATE_ID', file.id);
  PROPS.setProperty('TEMPLATE_SHA', shaOf_(b64));
  return file.id;
}

function shaOf_(s) {
  return Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s));
}

// ====== 草稿（Google Sheet）======
var DRAFT_HEADER = ['key', 'school', 'semester', 'updatedAt', 'updatedBy', 'json'];

function draftSheet_() {
  var sheetId = PROPS.getProperty('SHEET_ID');
  if (!sheetId) throw new Error('尚未完成初始設定，請先在編輯器執行 setup()');
  var ss = SpreadsheetApp.openById(sheetId);
  var sh = ss.getSheetByName('drafts');
  if (!sh) {
    sh = ss.insertSheet('drafts');
    sh.appendRow(DRAFT_HEADER);
  }
  return sh;
}

function listDrafts_() {
  try {
    var sh = draftSheet_();
    var values = sh.getDataRange().getValues();
    var out = [];
    for (var i = 1; i < values.length; i++) {
      out.push({ key: values[i][0], school: values[i][1], semester: values[i][2],
                 updatedAt: String(values[i][3]), updatedBy: values[i][4] });
    }
    return out;
  } catch (e) {
    return [];
  }
}

function saveDraft(payload) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = draftSheet_();
    var key = payload.school + '｜' + payload.semester;
    var now = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
    var user = Session.getActiveUser().getEmail();
    var row = [key, payload.school, payload.semester, now, user, JSON.stringify(payload)];
    var values = sh.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      if (values[i][0] === key) {
        sh.getRange(i + 1, 1, 1, row.length).setValues([row]);
        return { ok: true, key: key, updatedAt: now, drafts: listDrafts_() };
      }
    }
    sh.appendRow(row);
    return { ok: true, key: key, updatedAt: now, drafts: listDrafts_() };
  } finally {
    lock.releaseLock();
  }
}

function getDraft(key) {
  var sh = draftSheet_();
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === key) {
      return { ok: true, data: JSON.parse(values[i][5]) };
    }
  }
  return { ok: false, error: '找不到草稿：' + key };
}

// ====== 產生簡報 ======
function generateDeck(data) {
  var templateId = PROPS.getProperty('TEMPLATE_ID');
  if (!templateId) throw new Error('尚未完成初始設定，請先在編輯器執行 setup()');
  var folderId = PROPS.getProperty('FOLDER_ID');
  var folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();

  var name = (data.school || '未命名學校') + '｜' + (data.semester || '') + ' 心創力課程規劃簡報';
  var copy = DriveApp.getFileById(templateId).makeCopy(name, folder);
  shareToDomain_(copy); // 讓同網域夥伴不必「要求存取權」即可開啟／編輯
  var pres = SlidesApp.openById(copy.getId());
  var slides = pres.getSlides();

  // 先移除未使用的表格列（列上的佔位符會一併消失）
  trimTableRows_(slides[3], (data.courses || []).length);
  trimTableRows_(slides[4], (data.teacherCourses || []).length);

  var R = function (tok, val) {
    pres.replaceAllText('{{' + tok + '}}', val == null ? '' : String(val));
  };

  // P1 封面
  R('academic', data.academic);
  R('school', data.school ? data.school + ' ' : ''); // 與範例一致：「峨眉國小 課程規劃簡報」
  R('tagline', data.tagline);
  R('partner', data.partner);
  R('semester', data.semester);
  highlightPlanChip_(slides[0], data.plan);

  // P2 學校速寫與需求
  R('s2_feature', data.s2_feature);
  R('s2_students', data.s2_students);
  R('s2_venue', data.s2_venue);
  R('s2_priority', data.s2_priority);
  R('s2_motivation', data.s2_motivation);

  // P3 概念透鏡與通則
  R('s3_main', data.s3_main);
  R('s3_respond', data.s3_respond);
  R('s3_lens', data.s3_lens);
  R('s3_concepts', data.s3_concepts);
  R('s3_principles', data.s3_principles);

  // P4 學生課程表
  (data.courses || []).forEach(function (c, idx) {
    var i = idx + 1;
    R('c' + i + '_type', c.type);
    R('c' + i + '_dir', c.dir);
    R('c' + i + '_topic', c.topic);
    R('c' + i + '_prin', c.prin);
    R('c' + i + '_cnt', c.cnt);
    R('c' + i + '_teach', c.teach);
  });
  blankRows_(R, 'c', ['type', 'dir', 'topic', 'prin', 'cnt', 'teach'], (data.courses || []).length);
  R('s4_note', data.s4_note);

  // P5 教師研習表
  (data.teacherCourses || []).forEach(function (t, idx) {
    var i = idx + 1;
    R('t' + i + '_type', t.type);
    R('t' + i + '_topic', t.topic);
    R('t' + i + '_goal', t.goal);
    R('t' + i + '_cnt', t.cnt);
    R('t' + i + '_teach', t.teach);
  });
  blankRows_(R, 't', ['type', 'topic', 'goal', 'cnt', 'teach'], (data.teacherCourses || []).length);
  R('s5_need', data.s5_need);
  R('s5_link', data.s5_link);

  // P6 時程與堂次
  R('n1', data.n1);
  R('n2', data.n2);
  R('n3', data.n3);
  R('n4', data.n4);
  R('s6_total', data.s6_total);
  R('s6_remind', data.s6_remind);

  // P7 預期成果
  R('s7_student', data.s7_student);
  R('s7_teacher', data.s7_teacher);
  R('s7_culture', data.s7_culture);
  R('s7_quant', data.s7_quant);
  R('s7_qual', data.s7_qual);

  pres.saveAndClose();
  logGenerated_(data, copy);

  var slidesUrl = copy.getUrl();
  var pptxUrl = 'https:/' + '/docs.google.com/presentation/d/' + copy.getId() + '/export/pptx';
  return { ok: true, url: slidesUrl, pptxUrl: pptxUrl, name: name };
}

// 手動把「心創力課程規劃簡報」資料夾（含既有產出）對團隊開放：在編輯器執行一次
function shareFolder() {
  var folderId = PROPS.getProperty('FOLDER_ID');
  if (!folderId) throw new Error('尚未完成初始設定，請先執行 setup()');
  var folder = DriveApp.getFolderById(folderId);
  shareToDomain_(folder);
  // 同時把資料夾內既有檔案設為同網域可編輯（過去產出、夥伴打不開的那些）
  var n = 0, files = folder.getFiles();
  while (files.hasNext()) { shareToDomain_(files.next()); n++; }
  var msg = '資料夾已對團隊開放，並更新 ' + n + ' 個既有檔案的分享權限';
  Logger.log(msg);
  return msg;
}

// 產出的簡報預設只有部署者可開；設為同網域（theshiner.org）可編輯，
// 夥伴點連結即可開啟／協作，不會被要求「要求存取權」。
// 網域分享失敗（如個人帳號）時，退回把目前使用者加為編輯者。
function shareToDomain_(file) {
  try {
    file.setSharing(DriveApp.Access.DOMAIN_WITH_LINK, DriveApp.Permission.EDIT);
  } catch (e) {
    try {
      var email = Session.getActiveUser().getEmail();
      if (email) file.addEditor(email);
    } catch (e2) {}
  }
}

// 表格列數不足 3 列時，把留在版面上的佔位符清成「—」
function blankRows_(R, prefix, fields, used) {
  for (var i = used + 1; i <= 3; i++) {
    fields.forEach(function (f) { R(prefix + i + '_' + f, '—'); });
  }
}

// 依實際填寫列數，從表格底部移除多餘的資料列（保留表頭）
function trimTableRows_(slide, usedRows) {
  var tables = slide.getTables();
  if (!tables.length) return;
  var table = tables[0];
  var dataRows = table.getNumRows() - 1; // 扣掉表頭
  var keep = Math.max(1, Math.min(usedRows, dataRows));
  for (var r = dataRows; r > keep; r--) {
    table.getRow(r).remove();
  }
}

// 封面方案標籤：選中者黃底（#F1C232）＋深色粗體，與範例簡報一致
function highlightPlanChip_(slide, plan) {
  var label = { 'A': '方案 A', 'B': '方案 B', 'C': '方案 C' }[plan];
  if (!label) return; // 校訂／教支等客製方案不標亮
  var shapes = slide.getShapes();
  var target = null;
  shapes.forEach(function (s) {
    try {
      if (s.getText().asString().indexOf(label) === 0) target = s;
    } catch (e) {}
  });
  if (!target) return;
  var L = target.getLeft(), T = target.getTop();
  shapes.forEach(function (s) {
    if (s === target) return;
    try {
      if (Math.abs(s.getLeft() - L) < 6 && Math.abs(s.getTop() - T) < 6 &&
          !s.getText().asString().trim()) {
        s.getFill().setSolidFill('#F1C232');
      }
    } catch (e) {}
  });
  target.getText().getTextStyle().setForegroundColor('#202020').setBold(true);
}

// 產出紀錄
function logGenerated_(data, file) {
  try {
    var ss = SpreadsheetApp.openById(PROPS.getProperty('SHEET_ID'));
    var sh = ss.getSheetByName('generated');
    if (!sh) {
      sh = ss.insertSheet('generated');
      sh.appendRow(['time', 'user', 'school', 'semester', 'plan', 'url', 'json']);
    }
    sh.appendRow([
      Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm'),
      Session.getActiveUser().getEmail(),
      data.school, data.semester, data.plan, file.getUrl(), JSON.stringify(data)
    ]);
  } catch (e) {
    // 紀錄失敗不影響產出
  }
}

// ====== 一鍵更新（selfUpdate）======
// 從 GitHub 抓最新程式碼 → 更新本專案 → 母版有變則重建 → 建立新版本 → 網頁部署切到新版本
// 一次性前置：
//   1) 到 script.google.com/home/usersettings 開啟「Google Apps Script API」
//   2) appsscript.json 需含 script.projects / script.deployments / script.external_request 權限
// 之後每次更新：在編輯器執行 selfUpdate() 即可。
// 想改抓取分支：指令碼屬性設定 SOURCE_BRANCH（例如 main）。
// repo 若改為私有：指令碼屬性設定 GITHUB_TOKEN（fine-grained PAT，Contents: Read）。
var GH_REPO = 'chenghua0216/timer';
var GH_DIR = 'curriculum-planner/';
var GH_DEFAULT_BRANCH = 'claude/curriculum-planning-interface-kft8eg';
var SYNC_FILES = [
  { repo: 'Code.gs', name: 'Code', type: 'SERVER_JS' },
  { repo: 'Template.gs', name: 'Template', type: 'SERVER_JS' },
  { repo: 'index.html', name: 'index', type: 'HTML' },
  { repo: 'appsscript.json', name: 'appsscript', type: 'JSON' }
];

function selfUpdate() {
  var branch = PROPS.getProperty('SOURCE_BRANCH') || GH_DEFAULT_BRANCH;
  var log = ['來源：' + GH_REPO + ' @ ' + branch];

  // 1) 下載最新檔案
  var fetched = SYNC_FILES.map(function (f) {
    return { name: f.name, type: f.type, source: ghFetch_(f.repo, branch) };
  });

  // 2) 母版內容有變更才重建（舊版自動封存）
  var tpl = fetched.filter(function (f) { return f.name === 'Template'; })[0];
  var b64 = extractB64_(tpl.source);
  if (shaOf_(b64) !== PROPS.getProperty('TEMPLATE_SHA')) {
    rebuildMaster_(b64);
    log.push('母版已重建（舊版已封存）');
  } else {
    log.push('母版無變更');
  }

  // 3) 更新專案程式碼（保留 SYNC 清單以外、使用者自行新增的檔案）
  var current = scriptApi_('get', '/content', null);
  var keep = (current.files || []).filter(function (f) {
    return !SYNC_FILES.some(function (s) { return s.name === f.name; });
  }).map(function (f) { return { name: f.name, type: f.type, source: f.source }; });
  scriptApi_('put', '/content', { files: fetched.concat(keep) });
  log.push('程式碼已更新（' + fetched.length + ' 檔）');

  // 4) 建立新版本，並把正式網頁部署切到新版本（@HEAD 測試部署不需要切）
  var ver = scriptApi_('post', '/versions', {
    description: 'selfUpdate ' + Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd HH:mm')
  });
  var deps = scriptApi_('get', '/deployments?pageSize=50', null);
  var updated = 0;
  (deps.deployments || []).forEach(function (d) {
    var cfg = d.deploymentConfig || {};
    var isWeb = (d.entryPoints || []).some(function (e) { return e.entryPointType === 'WEB_APP'; });
    if (!isWeb || cfg.versionNumber == null) return;
    scriptApi_('put', '/deployments/' + d.deploymentId, {
      deploymentConfig: {
        scriptId: ScriptApp.getScriptId(),
        versionNumber: ver.versionNumber,
        manifestFileName: 'appsscript',
        description: cfg.description || ''
      }
    });
    updated++;
  });
  log.push('已建立版本 ' + ver.versionNumber + '、更新 ' + updated + ' 個網頁部署');
  if (!updated) {
    log.push('（找不到正式網頁部署——若尚未部署過，請先手動「部署 → 新增部署」一次）');
  }
  var msg = log.join('\n');
  Logger.log(msg);
  return msg;
}

// 從 GitHub 下載單一檔案內容（公開 repo 免 token；私有 repo 讀 GITHUB_TOKEN 屬性）
function ghFetch_(path, branch) {
  var url = 'https:/' + '/api.github.com/repos/' + GH_REPO + '/contents/' +
    GH_DIR + path + '?ref=' + encodeURIComponent(branch);
  var headers = { Accept: 'application/vnd.github.raw+json' };
  var token = PROPS.getProperty('GITHUB_TOKEN');
  if (token) headers.Authorization = 'Bearer ' + token;
  var res = UrlFetchApp.fetch(url, { headers: headers, muteHttpExceptions: true });
  if (res.getResponseCode() !== 200) {
    throw new Error('下載 ' + path + ' 失敗：HTTP ' + res.getResponseCode() +
      '（repo 若為私有，請在指令碼屬性設定 GITHUB_TOKEN）');
  }
  return res.getContentText();
}

// 從 Template.gs 原始碼取出 base64（多段單引號字串相加的格式）
function extractB64_(source) {
  var m = source.match(/'[A-Za-z0-9+\/=]{50,}'/g);
  if (!m) throw new Error('Template.gs 內容異常：找不到 base64 區塊');
  return m.map(function (s) { return s.slice(1, -1); }).join('');
}

// 呼叫 Apps Script API 操作本專案（需啟用 Google Apps Script API）
function scriptApi_(method, path, payload) {
  var url = 'https:/' + '/script.googleapis.com/v1/projects/' + ScriptApp.getScriptId() + path;
  var opt = {
    method: method,
    headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() },
    muteHttpExceptions: true
  };
  if (payload) { opt.contentType = 'application/json'; opt.payload = JSON.stringify(payload); }
  var res = UrlFetchApp.fetch(url, opt);
  var code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Apps Script API 失敗（' + method + ' ' + path + '）：HTTP ' + code + ' ' +
      res.getContentText().slice(0, 300) +
      '。請確認已於 script.google.com/home/usersettings 啟用 Google Apps Script API。');
  }
  return JSON.parse(res.getContentText() || '{}');
}
