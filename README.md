# Xinruisha — Photo

心瑞莎影像作品集 + 极简后台。Cloudflare Pages + Functions + KV + R2。

**总图片配额 200 张**（撞顶后 admin 上传会拒绝并提示先删旧图）。所有上传图片
浏览器端先压缩到长边 ≤2400px / JPEG q=0.85，访问时再走 `cdn-cgi/image` 按需 resize。

## 本地开发

```bash
npm install
npm run dev
```

打开 http://localhost:8788/  看前台、http://localhost:8788/admin.html 进后台。

设置环境变量（`.dev.vars` 文件，与 wrangler.toml 同级）：

```
ADMIN_PASSWORD=随便一个长一点的密码
SESSION_SECRET=随便一串长字符串当签名密钥
```

后台默认账号：只有密码，无用户名。

## 上线

1. 去 Cloudflare 控制台
   - **KV**：新建 namespace（建议名 `xinruisha-data`），把生成的 id 填进 `wrangler.toml` 的 `id =`
   - **R2**：用现有的 `ggjj-assets` 桶（与 tanyang/vidverian 共享，前缀 `xinruisha/` 自动隔离）
2. `npm run deploy` — wrangler 会自动建 Pages project 并上传
3. 在 Cloudflare Pages → Settings → Environment Variables 配 `ADMIN_PASSWORD` + `SESSION_SECRET`（生产值，不要和 dev 一样）
4. 同页 → Functions → Bindings 检查 `DATA` (KV) + `IMAGES` (R2) 已绑

## 灌种子数据

第一次部署后跑：

```bash
npm run seed              # 灌远端 KV
npm run seed -- --local   # 灌本地 dev KV
```

## 后台能干什么

- 改站点名 / 品牌中英文
- 改封面（issue / kind / 标语三行 / byline / cover photo）
- 改 about（头像、lede、bio、联系方式）
- 项目（14 个）：编号、年份、中英文名、媒介、介绍、视频开关、图片
  - 图片支持批量上传 + 拖拽排序 + 删除
  - 上传时浏览器自动探测原图宽高，存进 KV
  - 前台据此用 `aspect-ratio` 渲染，**0 裁切 0 抖动**

## 数据结构

KV key = `data`，value 是一个对象：

```jsonc
{
  "site":   { "brandCn": "...", "brandEn": "..." },
  "cover":  { "photo": { "key": "...", "w": 1, "h": 1 }, ... },
  "projects": [
    {
      "id": "...", "no": "01", "year": "2024",
      "nameEn": "...", "nameCn": "...",
      "medium": { "en": "...", "cn": "..." },
      "en": "...", "cn": "...",
      "isVideo": false,
      "images": [ { "key": "xinruisha/xxx.jpg", "w": 1200, "h": 1600 } ]
    }
  ],
  "about":  { ... }
}
```

不强校验 schema，因为 admin 改 schema 比改前端代码频繁。
