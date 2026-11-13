# 臭凝會考讀書島

保留 `pub12.tsx` 原生 WebGL／SVG 島嶼、角色活動、橋與應援插圖，移植成 Next.js + React + TypeScript PWA。**主要 AI 服務為 Gemini API**，金鑰只在伺服器端使用。未設定服務時不會宣稱登入、同步或 AI 成功。

## 本機啟動

建議 Node.js 24 與 pnpm。於專案目錄執行：

```powershell
pnpm install
Copy-Item .env.example .env.local
pnpm dev
```

開啟 [本機預覽](http://127.0.0.1:3000)。未設定 Supabase 時，開發環境提供「本機示範」，沒有真實帳號或跨裝置同步。第一次進入先確認名字與學校進度，再從每週安排填可用時間。示範題僅提供一元一次／二次方程式，需自行勾選，與 Gemini 題目清楚區分。

示範的伺服器資料保存在忽略上傳的 `.local/demo.json`；裝置快取、草稿與 outbox 使用 IndexedDB。示範不是正式登入，正式 `pnpm build`／`pnpm start` 不開放示範身份。

## 免帳號家庭連結（目前正式流程）

不需要註冊、Email 或密碼。公開首頁直接顯示原風格島嶼，個人紀錄只在家庭專屬連結載入。

1. 依序執行 `supabase/migrations/001_island.sql`、`002_reports.sql`、`003_ai_settings.sql`、`004_family_links.sql`，然後執行教材 seed。第四份 migration 保留學習紀錄，將學生／家長改為內部識別資料，不建立登入帳號；若舊資料已有多個學生，會停止要求明確選擇。
2. 伺服器設定 `NEXT_PUBLIC_SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY`。後者可填 Supabase 現有 Secret key，只能存伺服器環境，不需前端 anon key。
3. 設定 `STUDENT_ACCESS_KEY`、`PARENT_ACCESS_KEY`：兩個不同、至少 32 字元的密碼學隨機值，建議使用 32 bytes base64url。不可放 NEXT_PUBLIC、Git、日誌或公開文件。
4. 女兒開啟 `/island/<STUDENT_ACCESS_KEY>`，家長開啟 `/island/<PARENT_ACCESS_KEY>`。裝置會以簽署的 HttpOnly / Secure cookie 記住權限。家長連結的直接 API 寫入也會被拒絕。
5. 各自把專屬連結加入主畫面。專屬 manifest 會保留入口，即使 iOS PWA 與 Safari 的儲存隔離，也能重新辨識裝置；實體 Safari 仍需補驗。
6. 女兒可從收藏／設定複製家長只讀連結。這些連結具存取權，請私下保存；更換伺服器兩個連結值會使舊連結及裝置憑證失效。

所有資料表仍啟用 RLS；瀏覽器不直接寫 Supabase，所有學習寫入均經伺服器驗證。解答表不對瀏覽器開放，家長只讀只限已連結的家庭。這版服務單一家庭，並非公開多家庭註冊系統。

## Gemini 設定

伺服器環境填入：

```dotenv
GEMINI_API_KEY=
GEMINI_MODEL=
AI_ALLOWED_MODELS=
AI_DAILY_REQUEST_LIMIT=30
```

`GEMINI_MODEL` 請填帳號實際可用、支援 JSON Schema 結構化輸出的模型名稱。此版本使用官方 `v1beta/models/{model}:generateContent` REST 介面，透過 `x-goog-api-key` 標頭送出金鑰，以 `generationConfig.responseMimeType`／`responseJsonSchema` 約束輸出，再由 Zod 與業務規則驗證。沒有替你選定或購買模型，也沒有實際呼叫付費 API。

`AI_ALLOWED_MODELS` 可用逗號列出家長可選的模型，未填時只允許 `GEMINI_MODEL`。家長每日次數不得高於伺服器限制；多位已配對家長採啟用者最低次數，模型依家長 ID 穩定排序選取。正式環境配額由 PostgreSQL 鎖定與持久化記錄處理；本機無雲端時的限流只保存在程序記憶體。

出題、單元匹配、週排程、未完成任務改期為獨立請求。出題數學驗證失敗最多重新產生一次；每次都計入請求額度。請求逾時 45 秒；限流、拒絕、不完整內容、非法 ID、超量排程都會拒絕套用。`ai_usage` 保存模型、請求 ID、狀態與 token 用量，不存金鑰、完整私人備註或角色聊天。

**每日次數限制不是 Gemini 平台費用硬上限。** 請另在供應商管理介面設定適合自己的配額與預算告警。

參考：[Gemini generateContent](https://ai.google.dev/api/generate-content)、[Gemini 結構化輸出](https://ai.google.dev/gemini-api/docs/generate-content/structured-output)。

## 產品行為

- 家庭連結開啟後直接回到島，學校進度可於設定調整。可切換 3D／2D、動畫，操作角色與活動動態、查看應援卡、抽複習、查看各科小鎮與跨科關聯。
- 熟悉程度為尚未評估／不太會／大致會／很熟；自評決定單元建築。投入分鐘、任務狀態、練習結果與裝飾各自獨立，AI 不會降低自評。
- 今日任務可記部分投入，也可明確完成這次任務；讀過不等於讀完整個單元。改期保留紀錄並檢查任務版本與已確認可用時間。
- 平日額外複習預設 0，週末各預填 180 分鐘，請每週改成實際可用時間。每日三題數學約 15 分鐘另列，不占用作業的一小時。超量一般複習不能套用。
- AI 或本機規則草稿不會直接成為任務；可改日期／分鐘／移除後確認。既有任務保留。可只確認新一週可用時間，再手動改期，或確認 Gemini 的改期建議。
- 數學每個不同原題的首次有效提交計入當日練習，答錯也算；相同題目重送、同日重練或重複生成不灌水。到期錯題獨立列出，由學生保留原範圍重練或延後。
- 答案／步驟於提交前不下發。受限解析器支援數值、負數、分數、根式、指數、合理等價形式、多解與部分 LaTeX 輸入，不使用 `eval`。一元一次、一元二次與純數值計算可做確定驗證；其他題型保留待確認，不計入確定錯題或答對率。答案格式待確認時可重新輸入，同原題仍只計一次。
- 題目回報會撤銷同原題判定、移除相關錯題並修正練習統計；不會改自評。錯題預設 1／3／7 天，間隔可設定。
- 番茄鐘以時間戳與暫停累積秒數計算，回前景校正。轉成讀書紀錄時以 focus ID 去重；不宣稱 iOS 背景常駐。
- 原 11 種貼紙收藏均保留或以清楚的新條件調整，另加四件努力裝飾。降低熟悉程度不收回努力成果。

## 離線、同步與登出

正式 build 註冊 Service Worker，快取公開外殼與載入的靜態資產，預抓首頁所需腳本／CSS；API 與帶 Authorization 的請求不進 Cache Storage。已透過家庭連結且曾載入的裝置能從 IndexedDB 看任務、保存手填／計時紀錄與作答草稿。AI 出題、批改、配對需網路。

開啟、恢復網路、回到前景或按同步狀態時同步。事件 UUID 去重；伺服器交易檢查整體 revision，任務檢查版本。衝突不靜默覆蓋，原提案保留於收藏／設定，可核對後從任務或週計畫重新操作。未同步不能宣稱已上傳。家長摘要顯示最後雲端同步時間。

「清除此裝置資料」會清除該身份的 IndexedDB 快取與裝置提示；Service Worker 只保留公開外殼，不保留學生 API。瀏覽器儲存可能被系統清除，重要資料仍應連線同步，亦可匯出裝置 JSON 備份；目前匯出檔供檢視與人工復原，沒有一鍵匯入介面。

## PWA 安裝與部署

```powershell
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

使用支援 Node.js 的 Next.js 主機，自行設定相同環境變數、正式 HTTPS 網址與 `SITE_ORIGIN`。此專案包含動態 API，**不能直接部署成 GitHub Pages 靜態網站**。不要把 `.env.local`、`.local` 或私密金鑰放入 GitHub。GitHub 建議先用私人 repository；本次沒有推送或公開部署。

部署並設定家庭連結後，在 iPad Safari 用 HTTPS 網址開啟，分享 → 加入主畫面。首次連線待外殼與資料載入後再測離線。Manifest 有橫式偏好，但不假設瀏覽器可鎖定方向。手機直式亦有可捲動版面；輸入時使用 visualViewport 避讓鍵盤。

參考：[Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps)、[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)。

## 專案結構與驗證

| 路徑 | 用途 |
| --- | --- |
| `source/pub12.original.tsx`、`source/provenance.json` | 原檔與 SHA-256 來源追蹤，不參與編譯 |
| `src/island/data.ts` | 沿用原單元 ID、九島、色盤與跨科關聯 |
| `src/island/art.tsx` | 原 SVG、人物、內嵌應援插圖與 2D 世界 |
| `src/island/engine.ts`、`worlds.tsx` | 原生 WebGL 引擎與 React 世界／小鎮元件 |
| `src/components/StudyIsland.tsx` | 島主畫面與功能面板 |
| `src/lib/domain.ts`、`math.ts` | 事件、版本、排程驗證、時間與受限數學解析 |
| `src/lib/server.ts`、`ai.ts`、`questions.ts` | 身份、同步、Gemini、題目與解答隔離 |
| `supabase/migrations/`、`scripts/seed.ts` | 資料表、RLS、交易、配對與教材 seed |
| `tests/`、`scripts/api-smoke.mjs` | 核心／PostgreSQL／SW 測試與本機 API 煙霧測試 |

`pnpm test:api` 需先執行未設定雲端與 AI 的開發伺服器。此腳本建立本機測試題並回報撤銷，不使用真實 Gemini。

實際驗證結果、驗收對照與尚需補驗項目請看 [docs/VALIDATION.md](docs/VALIDATION.md)。正式教材版次／目錄、考試日期、部署帳號、Gemini 模型與費用預算、實體裝置型號仍需設定或提供。
