# 民俗学知识库 · Folklore Knowledge Base

个人研究向的民俗学 / 人类学 / 遗产研究文献知识库。

- 📚 分类浏览、主题综述、文献关系图
- 📝 匿名读书笔记 + 讨论区
- ⚡ 每周一自动抓取 8 大欧美期刊的新论文

**在线预览**：https://luy89012-netizen.github.io/folklore-kb/  （部署完就有）

---

## 📖 目录

- [第一次部署](#第一次部署)
- [日常使用](#日常使用)
- [如何加论文 / 改分类](#如何加论文--改分类)
- [每周抓取如何工作](#每周抓取如何工作)
- [排错](#排错)

---

## 🚀 第一次部署（约 10 分钟）

### 第 1 步：把这个仓库上传到你的 GitHub

**方式 A：用 GitHub Desktop（推荐，没接触过 git 的人）**

1. 装 GitHub Desktop：https://desktop.github.com/
2. 打开 → 用你的 GitHub 账号（`luy89012-netizen`）登录
3. `File` → `New repository...`
   - Name: `folklore-kb`
   - Local path: 选一个你放代码的目录（比如桌面）
   - **不要**勾"Initialize this repository with a README"
   - 点 Create
4. 把这个 zip 里的所有文件 **解压到刚刚 GitHub Desktop 创建的文件夹**（覆盖已有的），注意：**别忘了隐藏文件 `.github/`**
5. 回到 GitHub Desktop，你会看到左侧列出很多"Changed files"
6. 左下角填 commit summary（如 `initial`），点 **Commit to main**
7. 上方点 **Publish repository**（发布到 GitHub）
   - **⚠️ 不要**勾 "Keep this code private"，取消勾选（GitHub Pages 免费版只支持 public repo）
   - 点 **Publish Repository**

**方式 B：用命令行 git**（如果你会）

```bash
cd folklore-kb
git init
git add .
git commit -m "initial"
git branch -M main
git remote add origin https://github.com/luy89012-netizen/folklore-kb.git
git push -u origin main
```

### 第 2 步：在 GitHub 网页上配置 Secrets（存 Supabase 密钥）

1. 打开你的 repo：https://github.com/luy89012-netizen/folklore-kb
2. 点 **Settings**（不是账号的 Settings，是这个 repo 的）
3. 左侧 **Secrets and variables** → **Actions**
4. 右上角点 **New repository secret**，依次加 3 个：

   | Name | Secret |
   |---|---|
   | `SUPABASE_URL` | `https://fnwvglqsotblzuxbmfdk.supabase.co` |
   | `SUPABASE_ANON_KEY` | 你的 anon key（前端用） |
   | `SUPABASE_SERVICE_ROLE_KEY` | 你的 service_role key（抓取用） |

   （key 值你自己知道；也可以问我要，我这里保存了一份）

### 第 3 步：开启 GitHub Pages

1. 还在 repo Settings，左侧 **Pages**
2. **Source**：选 `GitHub Actions`（不要选 "Deploy from a branch"）
3. 保存

### 第 4 步：触发第一次部署

有两种方式：

**方式 A**：直接等——你第一次 push 代码时（第 1 步已经 push 了）Actions 会自动跑。

**方式 B**：手动触发
1. repo 顶部 **Actions** tab
2. 左侧点 **Deploy to GitHub Pages** workflow
3. 右侧 **Run workflow** → 绿色按钮

### 第 5 步：等 2 分钟，打开你的公网链接

**https://luy89012-netizen.github.io/folklore-kb/**

如果打不开：
- 去 Actions tab 看 workflow 是否成功（绿勾）
- Settings → Pages 里看是否显示"Your site is live at..."

---

## 📝 日常使用

- **看文献**：打开链接就能看，无需登录
- **写笔记**：进文献详情页 → 右上角"改昵称"填个笔名 → 点"写/编辑我的笔记"
- **评论**：详情页底部直接写
- **看每周新品**：左侧菜单"每周新品"
- **改身份**：清浏览器 localStorage 就会重新分配 uid

---

## ➕ 如何加论文 / 改分类

有两种方式：

**方式 1（最简）：跟我说**
你在 DIBP 上告诉我"加一篇 xxx"，我改完自动 push。

**方式 2：自己在 Supabase Dashboard 手动加**
1. 打开 https://supabase.com/dashboard/project/fnwvglqsotblzuxbmfdk/editor
2. 左侧点 `papers` 表
3. 点 `Insert row`，填字段
   - paper_id：唯一标识，格式 `p20_xxx_yyy`
   - title / author / year / publication：书目信息
   - category：`classic` / `frontier` / `textbook` / `related` / `reference`
   - themes：从 t1~t6 里挑，用逗号分隔（如 `t2,t5`）
   - abstract / key_arguments / key_concepts / dialogues：摘要与你的批注
   - lang：`zh` / `en`
4. 保存后**刷新 App 页面**就能看到新论文（前端每次都实时查 Supabase）

---

## ⚡ 每周抓取如何工作

- **时机**：每周一北京时间 09:00（= UTC 01:00）
- **源**：8 个欧美核心期刊（通过 CrossRef API 拉取，稳定不吃反爬）
  - Journal of American Folklore
  - Journal of Folklore Research
  - Western Folklore
  - Cultural Anthropology
  - American Ethnologist
  - Journal of the Royal Anthropological Institute
  - International Journal of Heritage Studies
  - Museum & Society
- **量级**：每个期刊最多 25 条，一周约 200 条（大部分和上周重合会被去重）
- **写入表**：`weekly_feed`
- **中文源**：中国民俗学网因反爬暂时失败，等找到能用的源再加

### 手动触发一次

1. GitHub repo → Actions → **Weekly Fetch Folklore Papers** → Run workflow
2. 30 秒左右完成，去 App 的"每周新品"页刷新

### 关掉每周抓取

编辑 `.github/workflows/weekly.yml`，把 `schedule:` 那两行删掉。

---

## 🐞 排错

### 部署失败 / GitHub Pages 404

- Settings → Pages 的 Source 必须选 `GitHub Actions`（不是 `Deploy from branch`）
- Repo 必须是 Public（免费版限制）
- 看 Actions tab 里最新一次 `Deploy to GitHub Pages` 日志

### App 打开是白屏

- F12 打开浏览器控制台，看错误
- 大概率是 Supabase 密钥没配对
- 检查 Secrets 里 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 是不是正确的
- 改完 secrets 需要**重新跑 Deploy workflow**（手动 Run workflow）

### 每周抓取失败

- Actions tab 里点最新一次 `Weekly Fetch` 看日志
- 常见原因：CrossRef 短暂不可用 → 下周会自然恢复
- 中国民俗学网 468：正常，暂时无解

### 想改文案 / UI

改完 `webapp/src/` 里的代码，`git push`，2 分钟自动重新部署。

---

## 📂 项目结构

```
folklore-kb/
├── webapp/                  # 前端 React 应用
│   ├── src/
│   │   ├── api/             # Supabase 客户端 + 各表的 CRUD
│   │   ├── data/            # 主题综述 + 关系图数据（硬编码）
│   │   ├── pages/           # 6 个页面
│   │   ├── App.tsx / main.tsx
│   ├── vite.config.standalone.ts
│   ├── package.json
│   └── index.html
├── scripts/
│   └── fetch_weekly.py      # 每周抓取脚本
└── .github/workflows/
    ├── deploy.yml           # 部署到 GitHub Pages
    └── weekly.yml           # 每周一抓取
```

---

Made with ☕ and 📚 for 刘雨妍 · 2026-07-16
