// Vercel 无服务器函数：为后台的图片/视频上传签发「客户端直传令牌」
// 文件不经过本函数，由浏览器直接上传到 Vercel Blob（绕过 4.5MB 函数请求体限制，可传大视频）。
// 依赖：@vercel/blob（见同目录 package.json，Vercel 会自动安装）
// 鉴权：请求头 x-admin-key 必须等于环境变量 ADMIN_KEY（避免公开上传）
// 前置：项目需创建 Vercel Blob 存储（自动添加 BLOB_READ_WRITE_TOKEN 环境变量，且存储设为 Public）

const ADMIN_KEY = () => process.env.ADMIN_KEY;
const ALLOWED = ["essays", "cases", "charity", "news"];

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error("请求体不是合法 JSON")); }
    });
    req.on("error", reject);
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // 1) 鉴权
  const adminKey = ADMIN_KEY();
  if (!adminKey) {
    res.statusCode = 500;
    return res.end(JSON.stringify({ error: "服务端未配置 ADMIN_KEY 环境变量" }));
  }
  const provided = req.headers["x-admin-key"] || "";
  if (provided !== adminKey) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ error: "管理密码错误" }));
  }

  // 2) Blob 存储是否就绪
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.statusCode = 500;
    return res.end(JSON.stringify({
      error: "服务端未配置 BLOB_READ_WRITE_TOKEN：请在 Vercel 创建 Blob 存储（Public），它会自动写入该变量，然后重新部署。"
    }));
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: "仅支持 POST" }));
  }

  try {
    // @vercel/blob 可能为 ESM 包，用动态 import 兼容 CommonJS 运行时
    const { handleUpload } = await import("@vercel/blob/client");

    const body = await readBody(req);

    const jsonResponse = await handleUpload({
      body,
      request: req, // Node IncomingMessage，handleUpload 据此判断动作与回调地址
      onBeforeGenerateToken: async function (pathname) {
        // 此处已通过上面的管理密码校验，仅允许本站后台上传
        return {
          allowedContentTypes: [
            "image/jpeg", "image/png", "image/webp", "image/gif",
            "video/mp4", "video/webm", "video/ogg", "video/quicktime"
          ],
          maximumSizeInBytes: 200 * 1024 * 1024, // 单文件上限 200MB（由 Blob 侧强制）
          addRandomSuffix: true
        };
      },
      onUploadCompleted: async function () {
        // 上传完成回调（生产环境由 Vercel Blob 调用）。无需写库，直接放行。
        return;
      }
    });

    return res.end(JSON.stringify(jsonResponse));
  } catch (e) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: e && e.message ? e.message : "上传令牌签发失败" }));
  }
};
