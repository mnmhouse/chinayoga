// Vercel 无服务器函数：线下预约登记接口
// 写入：公开 POST（无需管理密码），把预约写入 GitHub 仓库 content/bookings.json
// 读取/删除：需 x-admin-key 鉴权（管理员在后台「预约登记」查看/处理）
// 存储：GitHub 仓库 mnmhouse/chinayoga 的 content/bookings.json，随 Vercel 重新部署发布
// 依赖：仅 Node.js 内置能力（fetch 为 Node 18+ 全局 API），无第三方包

const REPO = "mnmhouse/chinayoga";
const BRANCH = "master";
const FILE = "content/bookings.json";
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
    "User-Agent": "chinayoga-booking",
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

async function getFile(token) {
  const r = await gh("GET", `/repos/${REPO}/contents/${FILE}`, null, token);
  if (r.status === 404) return { sha: null, items: [] };
  if (r.status !== 200 || !r.data.content) throw new Error("读取仓库文件失败(" + r.status + ")");
  const items = JSON.parse(Buffer.from(r.data.content, "base64").toString("utf8"));
  return { sha: r.data.sha, items: Array.isArray(items) ? items : [] };
}

async function putFile(token, items, sha) {
  const content = Buffer.from(JSON.stringify(items, null, 2), "utf8").toString("base64").replace(/\n/g, "");
  const body = { message: "booking: update bookings.json", content, branch: BRANCH };
  if (sha) body.sha = sha;
  const r = await gh("PUT", `/repos/${REPO}/contents/${FILE}`, body, token);
  if (r.status !== 200 && r.status !== 201) {
    throw new Error("写入仓库失败(" + r.status + (r.data && r.data.message ? ": " + r.data.message : "") + ")");
  }
  return r.data;
}

function str(v) { return typeof v === "string" ? v.trim() : ""; }

module.exports = async function handler(req, res) {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return json(res, 500, { error: "服务端未配置 GITHUB_TOKEN 环境变量" });
  }

  const url = new URL(req.url, "http://localhost");

  try {
    // 公开提交预约
    if (req.method === "POST") {
      const b = await readBody(req);

      // 蜜罐：机器人常填的隐藏字段，若被填则静默丢弃（不报错，假装成功）
      if (str(b.company)) return json(res, 200, { ok: true, ignored: true });

      const name = str(b.name);
      const contact = str(b.contact);
      if (!name || !contact) {
        return json(res, 400, { error: "请填写称呼与手机/微信" });
      }

      const item = {
        id: "bk-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
        name: name.slice(0, 40),
        contact: contact.slice(0, 80),
        project: str(b.project).slice(0, 40),
        date: str(b.date).slice(0, 20),
        note: str(b.note).slice(0, 500),
        createdAt: new Date().toISOString(),
      };

      const f = await getFile(token);
      f.items.unshift(item);
      await putFile(token, f.items, f.sha);

      // 不直接触发 Vercel 部署（预约数据仅存于 GitHub，无需重新构建；后台读取走 API）
      return json(res, 200, { ok: true, id: item.id });
    }

    // 以下操作均需管理员密码
    const adminKey = process.env.ADMIN_KEY;
    const provided = req.headers["x-admin-key"] || "";
    if (!adminKey || provided !== adminKey) {
      return json(res, 401, { error: "管理密码错误" });
    }

    if (req.method === "GET") {
      const f = await getFile(token);
      return json(res, 200, { items: f.items });
    }

    if (req.method === "DELETE") {
      const b = await readBody(req);
      const id = b.id || url.searchParams.get("id") || "";
      if (!id) return json(res, 400, { error: "缺少 id" });
      const f = await getFile(token);
      const next = f.items.filter((x) => x.id !== id);
      if (next.length === f.items.length) return json(res, 404, { error: "未找到该预约" });
      await putFile(token, next, f.sha);
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "不支持的方法" });
  } catch (e) {
    return json(res, 500, { error: e && e.message ? e.message : "服务器错误" });
  }
};
