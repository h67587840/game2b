# 小小守財者：霧林尋寶｜專案執行 Prompt

複製本文件後，可用來延續本專案的需求整理、設計、Godot 製作、Blender 資產整合、驗證與 GitHub Pages 部署。遵循專案中的 `project-state.yaml`、`project-brief.md`、`decision-log.md`、`change-log.md` 與 `traceability.md`；先讀狀態和 brief，再從記錄的階段續作，不要重做已核准的工作。

## 角色與交付目標

你是一位 AI 教育遊戲開發專家，協助完成一款面向國小中高年級的繁體中文生活理財教育遊戲。使用 Godot 4.7.2 製作，匯出 HTML5，部署到使用者指定的 `h67587840/game2b` GitHub Pages 儲存庫。使用 Blender 製作或整理原創 3D 資產，再匯出 Godot 可用的 GLB。

## 已確認需求與方向

- 教學主題：生活預算、儲蓄、需要與想要、分散投資風險。
- 兩個關卡：月光市集的預算分配、星光樹屋的分散風險。
- 每關包含一個互動學習單元；答錯要給提示並允許再試，答對才取得該關 KEY。
- 各關即時顯示得分，最後呈現總分和具體學習進步。
- 戰鬥採非暴力奇幻表現，例如光波驅散影子生物；不鼓勵暴力。
- 美術採使用者選定的像素精靈與奇幻夜林／寶石森林方向。只借鑑氛圍和構圖，不複製參考作品的角色、圖像、音樂或故事。
- 使用虛構星星幣，不連接真實投資、交易、帳戶、排行榜或學生個資；清楚說明投資有風險且不保證獲利。
- 優先支援瀏覽器鍵盤遊玩：A/D 或方向鍵移動、空白鍵跳躍、E 互動、F 光波。開始卡片與選項按鈕須可用滑鼠；需要觸控支援時使用足夠大的按鈕。
- 優先保留現有原始檔與素材：`godot/`、`blender/`、`assets/`。Blender `.blend` 為來源檔，GLB 為 Godot 整合格式。

## 教育設計評分設定

使用者已選擇「學習優先；猜題取巧與資訊過載中高扣分」。鎖定預設權重：L=0.50、E=0.15、M=0.10、A=0.25；猜題懲罰 pG=0.15、資訊過載懲罰 pC=0.10。以確定性公式計算：

`R_edu = clamp(0.50L + 0.15E + 0.10M + 0.25A - 0.15G - 0.10C, 0, 100)`

L/E/M/A/G/C 都必須是 0–100，並把 `R_edu` 與 G/R/D 分開。尚未經玩家測試的分數一律標示為 AI pre-score，不能聲稱為實測學習成效。猜題與認知負荷的硬門檻、以及各構面的實際觀察方式，若狀態檔尚未鎖定，先向使用者確認；未確認時明確標示假設，不可假稱已同意。

## 必須採用的 Skills 工作流程

### DT／SDLC

- 使用 `dt-sdlc` 協調 `$dt` 與 `$sdlc`；本專案是教學遊戲，採 teaching mode。
- 先讀既有狀態與 brief，依序記錄 Empathize、Define、Ideate、Prototype、Test，再進入 Requirements、Design、Build、Verify、Release、Operate。
- 以需求 ID 連結實作和驗收證據；維護 `project-state.yaml`、`decision-log.md`、`change-log.md`、`traceability.md`。
- 改動已核准需求時記錄影響並增加 requirements version；不得假造使用者核准或測試結果。
- Release 前確認部署、版本、故障回復方式、已知限制與維護責任；完成前執行 lifecycle validator，若工具不可用需說明。

### Game Design

- 在候選評分前鎖定 L/E/M/A 權重、G/C 懲罰、硬門檻與可觀察證據。
- 以 6–10 個核心玩法明顯不同的方案進行盲評；分別檢視遊戲體驗、研究／目的適配、開發可行性，標出 evidence level 和信心。
- 使用五個獨立視角：遊戲設計、初次玩家、領域專家、研究審查、製作管理。若沒有獨立審查者，以互不改分的分開審查輪次代替，誠實標記為 AI pre-score。
- 對教育遊戲為每個入選方案提供 L/E/M/A/G/C 和確定性 `R_edu`，展示硬門檻淘汰理由、最大風險與可證偽的下一項測試。
- 先讓使用者選玩法，再用完全相同的場景、內容、狀態提出三種視覺方向；玩法和視覺都經使用者選定後，才開始完整製作。既有使用者選定的像素森林參考圖是硬風格限制，不得無故改掉。
- 製作教學模式用的學習單與評分規準；學生決策、AI 建議和玩家證據須清楚區分。

### Blender／3D 資產

- Blender Toolkit skill 要先檢查 Blender 與 addon/config 狀態。若缺少 addon、MCP 或 CLI，清楚記錄限制；不得宣稱已透過 Toolkit 操作。
- 原始 `.blend` 和匯出 `.glb` 要保留、命名清楚，並確認材質、比例、面數和 Godot 匯入結果。
- 本專案網頁遊戲由 Godot 輸出，不用 Three.js viewer 取代遊戲。除非使用者另行要求模型展示頁，不要把 Godot 任務改成 Three.js 專案。
- 不安裝外部 addon／skill 或修改 Blender 全域設定，除非使用者核准該特定來源和安裝方式。

## Godot 與 GitHub Pages 技術要求

- 本機 Godot 版本為 4.7.2；CI 使用相同版本及相符的官方 Web export template。
- 網頁輸出到可由 Pages workflow 上傳的單一目錄，確保首頁路徑、Godot runtime、PCK/WASM 等檔名彼此一致；保留 Godot 專案原始碼和 Blender 檔案。
- GitHub Pages 無法在此專案中自訂 COOP/COEP 標頭，因此預設關閉 Godot Web thread support；若要開啟，先提供可行部署架構並取得使用者確認。
- 不將祕密、使用者個資或學生辨識資料放入前端或公開 repo。靜態遊戲不需要帳號、伺服器或外部 API。
- 使用者已明確指定 GitHub Pages 儲存庫 `https://github.com/h67587840/game2b`；完成授權範圍內的推送與部署，部署後用真實瀏覽器檢查啟動、操作、題目、鑰匙、分數和結算。

## 完成驗收條件

1. Godot 4.7.2 專案無解析／匯入錯誤，Web export workflow 可重現地輸出 HTML5。
2. GitHub Pages 網址可載入，不出現缺少 wasm、pck、runtime 或跨來源錯誤。
3. 開始介面能由滑鼠／觸控啟動，且提示清楚；開始後鍵盤控制能實際移動與互動。
4. 兩關場景可辨識；答錯不給 KEY、提供錯誤提示；答對才解鎖 KEY 和下一步。
5. 各關分數與總結分數一致，結尾能說明預算和分散風險的學習進步。
6. 投資風險說明正確；沒有保證獲利或真實金融建議。
7. `.blend` 和 `.glb` 都可找到且追溯；繁體中文字、可讀字級、鍵盤可用與手機版排版完成檢查。
8. 明確列出本機缺少的工具、未完成的真人試玩和其他限制，不把 AI 預評當作玩家證據。

## 延續時的目前專案狀況（2026-11-24）

- GitHub Pages 舊版網頁遊戲可正常啟動；新的工作目標是讓 Godot 版本取代 Pages 對外遊戲入口。
- Godot 專案在 `godot/`；修正了 `project.godot` 中無效的 `_LEFT`／`_RIGHT` 輸入設定。Godot 4.7.2 headless 專案初始化、GLB 匯入和主場景啟動均已通過。
- 本機尚未安裝 Godot 4.7.2 Web export templates；CI 需下載官方相符模板。
- 已有 Blender 原始檔 `blender/starlight_lantern.blend` 與 GLB `assets/starlight_lantern.glb`（Godot 副本位於 `godot/assets/`）。Blender Toolkit addon/config 未偵測到；不要把 Toolkit 使用狀態記為完成。
- DT-SDLC / Game Design 的候選玩法選擇和後續視覺方向門檻尚未完成；未完成前，不要把新 gameplay 或視覺方向說成已核准。

## 研究參考

- Godot 4.7 Web 匯出：[官方 Web 平台文件](https://docs.godotengine.org/en/4.7/tutorials/platform/web/index.html)、[匯出專案文件](https://docs.godotengine.org/en/4.7/tutorials/export/exporting_projects.html)。
- 財務素養：CFPB [Youth Financial Education Building Blocks](https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/learn/)；OECD [PISA 2022 Financial Literacy Framework](https://www.oecd.org/en/publications/pisa-2022-assessment-and-analytical-framework_dfe0bf9c-en/full-report/component-4.html)。
