# 中国瑜伽网 · 康养联盟平台

以书为媒，传承中医、身心灵、道家与食疗智慧；线上共读好书、学习「小动作大作用」养生功法，线下相约深圳梧桐山慈禅甘露堂，福慧双修。

本仓库是一个**纯静态网站**（HTML + CSS + JS，无构建依赖），由缘起文稿整理搭建。

## 站点结构

```
chinayoga/
├── index.html          # 首页：缘起 / 核心定位 / 四大板块 / 基地 / 联盟 / 公益 / 愿景
├── books.html          # 好书共读（中医·身心灵·佛学·道家·食疗·功法 分类）
├── courses.html        # 小动作大作用（八卦步、拍打涌泉太溪等教学视频）
├── products.html       # 食疗产品（五谷杂粮 / 黄精）
├── base.html           # 线下基地：梧桐山·慈禅甘露堂 + 如是心东方食养
├── charity.html        # 公益善行（日行一善 / 尼泊尔 / 普陀寺义诊）
├── alliance.html       # 康养联盟（入驻对象 / 收费模式 / 申请 / 合规边界）
├── essays.html         # 文化随笔（动态渲染）
├── cases.html          # 学员案例（动态渲染）
├── charity.html        # 公益善行（公益足迹动态渲染）
├── booking.html        # 线下预约表单
├── admin.html          # 内容发布后台（管理页面，需环境变量）
├── content/            # 动态内容数据源（JSON，由后台发布写入）
│   ├── essays.json     #   文化随笔
│   ├── cases.json      #   学员案例
│   ├── charity.json    #   公益善行
│   └── news.json       #   首页最新动态
├── api/
│   └── content.js      # Vercel 无服务器函数：鉴权后把内容写回 GitHub 仓库
├── assets/
│   ├── css/style.css   # 共享设计系统（宣纸米白 / 苔玉绿 / 赭金）
│   ├── js/main.js      # 导航与页脚注入、移动端菜单、滚动动画、表单演示
│   ├── js/content.js   # 动态内容加载与渲染
│   └── img/wutong.svg  # 梧桐山·慈禅甘露堂意境图
└── vercel.json         # Vercel 纯静态部署配置
```

## 内容递进逻辑

对标「内容引流、逐步扩品类」：先以书籍吸引同频人群 → 再延伸教学视频 → 稳定后上架食疗产品；并以梧桐山线下基地形成独有的线上线下联动。网站同时开放「康养联盟」入驻席位（固定广告位年费 / 佣金分成二选一）。

## 本地预览

```bash
cd chinayoga
python3 -m http.server 8123 --bind 127.0.0.1
# 浏览器打开 http://127.0.0.1:8123/index.html
```

## 部署

### GitHub Pages（已启用）
项目站点地址：https://mnmhouse.github.io/chinayoga/
发布源：仓库 `master` 分支根目录。推送 `master` 即自动更新。

### Vercel
仓库已含 `vercel.json`（明确纯静态、不跑构建）。可：
- 在 Vercel 导入本 GitHub 仓库（`mnmhouse/chinayoga`），自动识别为静态站；或
- 本地执行 `vercel deploy --prod`。

#### 内容管理后台（动态发布）
站点内容（文化随笔 / 学员案例 / 公益善行 / 最新动态）由 `content/*.json` 驱动，页面运行时渲染；`admin.html` 是发布后台。发布流程：后台 → Vercel 无服务器函数 `api/content.js` → 写回 GitHub 仓库 → 自动重新部署生效。

**部署后需在 Vercel 项目设置里配置两个环境变量**（Settings → Environment Variables）：
- `ADMIN_KEY`：管理后台登录密码（自定义，例如 `你的强密码`）。
- `GITHUB_TOKEN`：具备本仓库 `contents: read & write` 权限的 GitHub 个人访问令牌（fine-grained token 勾选该仓库 Contents 读写，或 classic token 勾 `repo`）。

配置完成后：
1. 访问 `https://你的域名/admin.html`（如 https://chinayoga.com/admin.html）。
2. 输入 `ADMIN_KEY` 进入，选择栏目 → 新建 / 编辑 / 删除。
3. 保存后约 1–2 分钟站点更新。

**图片上传（无需额外配置）**：后台各栏目表单含「图片」字段。选择本地图片后，浏览器会先压缩（最长边 ≤1280px、JPEG 质量 0.82，压到 1MB 内），再以 base64 提交到 Vercel 无服务器函数 `api/upload.js`，由函数写入 GitHub 仓库 `assets/uploads/` 并触发重新部署；图片随站点发布到同域 `/assets/uploads/...`，**不依赖 Vercel Blob 或任何外部对象存储**。也可在字段中直接粘贴外部图片网址。

- 该流程仅需上面已配置的 `ADMIN_KEY` 与 `GITHUB_TOKEN`，**无需创建 Blob 存储、无需 `BLOB_READ_WRITE_TOKEN`**。
- **视频**：后台各栏目提供「视频网址」纯文本字段（不存储文件）。粘贴外部链接即可：直链视频（.mp4 等）前台用播放器播放；YouTube / Bilibili 链接自动转为嵌入播放器；其他链接显示为可点击外链。

> 说明：本地预览（`python3 -m http.server`）也能看到动态内容，但「保存发布 / 媒体上传」依赖 Vercel 函数与上面环境变量，仅在部署后可用。

## 合规说明

- 食疗产品、养生功法、学员案例等页面均标注「仅供日常养生 / 文化学习参考，不构成医疗诊断或治疗建议」。
- 风水类内容仅作传统文化典籍赏析，不做算命、改运类服务。
- 广告与入驻须遵守相关资质要求（食品经营许可证等），平台仅提供展示与资源对接。

## 业务要点

- 线下基地：慈禅甘露堂中医馆（深圳梧桐山坑背村129-1）+ 如是心东方食养。
- 竖匾「中国瑜伽协会」对应香港注册的「中国瑜伽（香港）协会有限公司」。
- 域名：www.chinayoga.com（待解析 / 备案）。

> 书中、课程与产品目前为示例占位内容，后续可替换为真实商品与资质信息。
