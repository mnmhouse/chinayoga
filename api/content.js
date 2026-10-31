// Vercel 无服务器函数：内容发布接口
// 鉴权：请求头 x-admin-key 必须等于环境变量 ADMIN_KEY
// 存储：把改动写入 GitHub 仓库 mnmhouse/chinayoga 的 content/{type}.json，触发 Vercel 重新部署
// 仅需 Node.js 内置能力（fetch 为 Node 18+ 全局 API），无第三方依赖。

const REPO = "mnmhouse/chinayoga";
const BRANCH = "master";
const ALLOWED = ["essays", "cases", "charity", "news"];
const GH_API = "https://api.github.com";

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
  const headers = {
    Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json",
    "User-Agent": "chinayoga-admin",
    "Content-Type": "application/json",
  };
  const res = await fetch(GH_API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch (e) {}
  return { status: res.status, data };
}

async function getFile(token, type) {
  const path = `/repos/${REPO}/contents/content/${type}.json`;
  const r = await gh("GET", path, null, token);
  if (r.status === 404) return { sha: null, items: [] };
  if (r.status !== 200 || !r.data.content) throw new Error("读取仓库文件失败(" + r.status + ")");
  const items = JSON.parse(Buffer.from(r.data.content, "base64").toString("utf8"));
  return { sha: r.data.sha, items: Array.isArray(items) ? items : [] };
}

async function putFile(token, type, items, sha) {
  const path = `/repos/${REPO}/contents/content/${type}.json`;
  const content = Buffer.from(JSON.stringify(items, null, 2), "utf8").toString("base64").replace(/\n/g, "");
  const body = {
    message: `content: update ${type}.json via admin`,
    content,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;
  const r = await gh("PUT", path, body, token);
  if (r.status !== 200 && r.status !== 201) {
    throw new Error("写入仓库失败(" + r.status + (r.data.message ? ": " + r.data.message : "") + ")");
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

  const url = new URL(req.url, "http://localhost");
  const type = url.searchParams.get("type");
  if (!type || ALLOWED.indexOf(type) < 0) {
    return json(res, 400, { error: "无效的 type，仅支持: " + ALLOWED.join(", ") });
  }

  try {
    if (req.method === "GET") {
      const f = await getFile(token, type);
      return json(res, 200, { items: f.items });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const { item } = await readBody(req);
      if (!item || !item.id) return json(res, 400, { error: "缺少 item 或 item.id" });
      const f = await getFile(token, type);
      const idx = f.items.findIndex((x) => x.id === item.id);
      if (idx >= 0) f.items[idx] = item;
      else f.items.unshift(item);
      await putFile(token, type, f.items, f.sha);
      return json(res, 200, { ok: true, item });
    }

    if (req.method === "DELETE") {
      const { id } = await readBody(req);
      if (!id) return json(res, 400, { error: "缺少 id" });
      const f = await getFile(token, type);
      const next = f.items.filter((x) => x.id !== id);
      if (next.length === f.items.length) return json(res, 404, { error: "未找到该内容" });
      await putFile(token, type, next, f.sha);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "不支持的方法" });
  } catch (e) {
    return json(res, 500, { error: e.message || "服务器错误" });
  }
};
