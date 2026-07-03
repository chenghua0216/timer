# 心創力．課程規劃簡報產生器

給立賢夥伴用的引導式填寫網頁：依「課程規劃簡報」7 頁的敘事順序填欄位，
一鍵產出與附件模板**同格式、同配色、同頁面編排、同順序**的 Google Slides（可再匯出 PPTX）。

## 運作方式

```
index.html（7 步驟精靈＋即時預覽＋檢核）
   │  google.script.run
   ▼
Code.gs ──草稿/紀錄──▶ Google Sheet「心創力課程規劃．填寫紀錄」
   │
   └─產生簡報──▶ 複製佔位符母版（Google Slides）→ replaceAllText 套版
                  → 輸出到 Drive「心創力課程規劃簡報」資料夾
```

- **母版**：`template/心創力課程規劃簡報_模板.pptx` 由原始模板簡報製成，
  所有可填欄位換成 `{{token}}` 佔位符（共 62 個），格式、顏色、版面完全未動。
  封面已嵌入立賢完整 logo（取代右側色塊插畫與基金會名稱文字列）、
  內頁標題列嵌入立賢圖標；所有矩形統一為圓角（半徑約 0.09in）。
  同一份內容以 base64 內嵌在 `Template.gs`，`setup()` 會自動解碼並轉成 Google Slides。
- **母版更新**：之後若 `Template.gs` 有新版，貼上後在編輯器執行一次 `refreshTemplate()`，
  會以新內容重建母版並自動封存舊版。
- **封面方案標籤**：產出時自動把選中的方案標成黃底（`#F1C232`）粗體，與範例一致。
- **表格**：P4／P5 各支援 1–3 列，未用的列自動刪除。
- **檢核**：學生課／教師端堂次自動加總，對齊方案額度（A：廣度2＋聚焦1＋賦能2＋共學1；
  B：廣度3＋賦能3；C：聚焦3＋賦能3；校訂／教支為客製），P6 堂次分配自動帶入。
- **預覽**：填寫時為全寬表單，最後一步（產出）一次預覽 7 頁的模擬畫面。
- **介面風格**：立賢綠（與概要網頁、內部工具家族一致），黃色作為強調；
  簡報預覽區維持簡報本身的藍灰配色。
- **自動儲存**：停止輸入 30 秒後自動存草稿，頁首顯示儲存狀態；
  有未儲存變更時關閉頁面會提醒。內容未變不會誤標為未儲存。
- **學校資料**：`Code.gs` 內建 15 個合作學校／單位的概要（與「學校／單位概要」網頁同步），
  選擇學校即可帶入縣市、負責夥伴、方案，P2 各欄提供「一鍵帶入」建議。

## 安裝（一次性，約 5 分鐘）

1. 到 [script.google.com](https://script.google.com) 用 theshiner.org 帳號建立新專案，
   命名如「心創力課程規劃簡報產生器」。
2. 建立三個檔案並貼上內容：
   - `Code.gs`（覆蓋預設的 Code.gs）
   - `Template.gs`（新增指令碼檔案）
   - `index.html`（新增 HTML 檔案）
3. 專案設定 → 勾選「在編輯器中顯示 appsscript.json」，貼上本資料夾的 `appsscript.json`
   （重點：啟用 Drive 進階服務、時區 Asia/Taipei、網頁權限 DOMAIN）。
4. 在編輯器選 `setup` 函式執行一次並授權。它會自動建立：
   - Drive 資料夾「心創力課程規劃簡報」（輸出位置）
   - Google Sheet「心創力課程規劃．填寫紀錄」（drafts／generated 兩個分頁）
   - Google Slides 母版（從內嵌 base64 轉檔；**請勿改動母版上的 `{{佔位符}}`**）
5. 部署 → 新增部署 → 網頁應用程式：
   - 執行身分：**我**；存取權：**theshiner.org 網域內所有人**
6. 把網址發給夥伴即可。

> 想改用自己調整過的母版：把 `template/心創力課程規劃簡報_模板.pptx` 上傳 Drive、
> 以 Google 簡報開啟另存，然後在「專案設定 → 指令碼屬性」把 `TEMPLATE_ID`
> 換成新簡報的 ID（佔位符要保留）。

## 佔位符對照

| 頁 | Token | 內容 |
|---|---|---|
| P1 | `academic` `school` `tagline` `partner` `semester` | 學年計畫行（含縣市）、學校、一句話定位、夥伴、學期 |
| P2 | `s2_feature` `s2_students` `s2_venue` `s2_priority` `s2_motivation` | 五張卡 |
| P3 | `s3_main` `s3_respond` `s3_lens` `s3_concepts` `s3_principles` | 主通則＋三卡 |
| P4 | `c1..c3_{type,dir,topic,prin,cnt,teach}`、`s4_note` | 學生課程表（3 列）＋註解 |
| P5 | `t1..t3_{type,topic,goal,cnt,teach}`、`s5_need` `s5_link` | 教師研習表＋兩卡 |
| P6 | `n1..n4` `s6_total` `s6_remind` | 堂次分配、協作提醒 |
| P7 | `s7_student` `s7_teacher` `s7_culture` `s7_quant` `s7_qual` | 三卡＋評估方式 |

## 本機預覽

直接用瀏覽器開 `index.html` 可看精靈與即時預覽（草稿存 localStorage、無法產出簡報，
儲存與產出功能需部署在 Apps Script 上才會生效）。

## 檔案

| 檔案 | 說明 |
|---|---|
| `Code.gs` | 後端：初始設定、草稿、套版產出、學校資料 |
| `Template.gs` | 佔位符母版 PPTX（base64 內嵌） |
| `index.html` | 前端精靈（引導、即時預覽、檢核、草稿） |
| `appsscript.json` | 專案資訊清單 |
| `template/心創力課程規劃簡報_模板.pptx` | 佔位符母版原始檔（備份／手動上傳用） |
