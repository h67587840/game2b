# 小小守財者：霧林尋寶

給國小學生的雙關 3D 理財冒險。玩家先分配模擬零用錢，再認識分散投資如何降低單一標的風險。回答本關問題才能取得星鑰匙。

## 開始遊玩

最簡單的方式是用 VS Code 安裝 Live Server，從專案根目錄開啟 `index.html`。也可在根目錄執行：

```powershell
py -m http.server 8000
```

接著瀏覽 `http://localhost:8000`。遊戲用 Three.js ES modules 和 GLB 模型，需透過本機 HTTP 伺服器開啟，不要直接雙擊 HTML。

### 操作方式

- `A` / `D` 或方向鍵：移動
- `空白鍵`、`W` 或向上鍵：跳躍
- `E`：靠近知識石碑時互動；拿到第一把鑰匙後，靠近拱門前往第二關
- `F`：以星光驅散影子飛蛾
- 手機和平板可使用畫面上的觸控按鈕

## 部署到 GitHub Pages

專案已附 `.github/workflows/pages.yml`。將專案推送到 GitHub 儲存庫的 `main` 分支後：

1. 開啟儲存庫 **Settings → Pages**。
2. 在 **Build and deployment → Source** 選擇 **GitHub Actions**。
3. 推送至 `main` 後，Actions 會自動部署；完成後 Pages 會顯示遊戲網址。

## 內容

- `index.html`, `styles.css`, `game.js`：可直接部署的靜態網頁遊戲
- `assets/starlight_lantern.glb`：由 Blender 製作並在遊戲場景中使用的模型
- `blender/create_starlight_lantern.py`：Blender 模型製作腳本
- `blender/starlight_lantern.blend`：可繼續編輯的 Blender 專案
- `godot/`：同一題材的 Godot 4.7 專案雛型

## 理財學習提醒

遊戲使用虛構星星幣，沒有真實金錢交易或投資建議。分散投資能降低單一標的的影響，但不能保證獲利，也不會消除所有風險。
