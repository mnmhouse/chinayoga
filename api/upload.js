// Vercel 无服务器函数：后台「图片」上传
// 流程：浏览器端压缩图片 → 以 base64 提交到本函数 → 写入 GitHub 仓库 assets/uploads/ → 返回站点同域相对地址
//   Vercel 重新部署后，图片随仓库一起发布到站点同域（/assets/uploads/...），无需任何外部存储（Blob / OSS）。
// 鉴权：请求头 x-admin-key 必须等于环境变量 ADMIN_KEY（避免公开上传）
// 依赖：仅 Node.js 内置能力，无需第三方包（可删除同目录 package.json）

const REPO = "mnmhouse/chinayoga";
const BRANCH = "master";
const GH_API = "https://api.github.com";
const UPLOAD_DIR = "assets/uploads";
const MAX_BYTES = 1024 * 1024; // GitHub Contents API 单文件上限 ~1MB（解码后）

function json(res, code, obj) {
  res.statusCode = code;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(obj));
}

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

async function gh(method, path, body, token) {
  const res = await fetch(GH_API + path, {
    method,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "User-Agent": "chinayoga-admin",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) {}
  return { status: res.status, data };
}

async function putUpload(token, path, contentB64) {
  const r = await gh("PUT", `/repos/${REPO}/contents/${path}`, {
    message: "upload: " + path,
    content: contentB64,
    branch: BRANCH,
  }, token);
  if (r.status !== 200 && r.status !== 201) {
    throw new Error("上传到仓库失败(" + r.status + (r.data && r.data.message ? ": " + r.data.message : "") + ")");
  }
  return r.data;
}

module.exports = async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;
  const adminKey = process.env.ADMIN_KEY;

  if (!token || !adminKey) {
    return json(res, 500, { error: "服务端未配置 GITHUB_TOKEN / ADMIN_KEY 环境变量" });
  }

  const provided = req.headers["x-admin-key"] || "";
  if (provided !== adminKey) {
    return json(res, 401, { error: "管理密码错误" });
  }

  if (req.method !== "POST") {
    return json(res, 405, { error: "仅支持 POST" });
  }

  try {
    const body = await readBody(req);
    const b64 = (body && body.content) || "";
    if (!b64) throw new Error("缺少图片内容");

    // base64 解码校验尺寸（GitHub Contents API 限制 ~1MB 解码后）
    const buf = Buffer.from(b64, "base64");
    if (buf.length === 0) throw new Error("图片内容无效");
    if (buf.length > MAX_BYTES) throw new Error("图片过大，请上传 1MB 以内的图片");

    // 客户端已压缩为 JPEG；统一以 .jpg 存储，避免扩展名与内容不符
    const finalName = Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8) + ".jpg";
    const path = UPLOAD_DIR + "/" + finalName;

    await putUpload(token, path, buf.toString("base64").replace(/\n/g, ""));

    // 返回站点同域相对地址（在 Vercel 域名与 chinayoga.com 均可用）
    return json(res, 200, { url: "/" + path });
  } catch (e) {
    return json(res, 400, { error: e && e.message ? e.message : "上传失败" });
  }
};
