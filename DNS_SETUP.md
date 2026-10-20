# 自定义域名接入说明（chinayoga.com → Vercel）

本文件说明如何将已托管在 **阿里云** 的域名 `chinayoga.com` 解析到本项目的 Vercel 部署。

## 一、已完成的部分（Vercel 侧，已自动配置）

通过 Vercel API 已将以下域名加入项目 `chinayoga`（projectId: `prj_yGmxDa1X9b4VJVFm3VpPS7dTjjzN`）并校验通过：

| 域名 | 状态 | 说明 |
| --- | --- | --- |
| `chinayoga.com` | verified ✅ | 主域名，直接对外服务 |
| `www.chinayoga.com` | verified ✅ | 已设为 **301/308 跳转到 `chinayoga.com`** |
| `chinayoga.vercel.app` | verified ✅ | Vercel 默认域名，备用 |

> 你只需在 **阿里云 DNS** 把解析指向 Vercel，无需在 Vercel 后台再做任何操作。

## 二、在阿里云配置 DNS（核心步骤）

1. 登录 [阿里云控制台](https://home.console.aliyun.com/) → **云解析 DNS** → **域名解析** → 找到 `chinayoga.com` → 点击 **解析设置**。
2. 按下面两张记录修改/新增（其余无关记录可保留）：

### 记录 1：主域名 A 记录（必须）
| 字段 | 值 |
| --- | --- |
| 主机记录 | `@` |
| 记录类型 | `A` |
| 线路类型 | 默认 |
| 记录值 | `76.76.21.21` |
| TTL | 600（或默认） |

> 若已存在指向 `198.18.0.145` 的 `@` A 记录，**修改为上面的值或删除后新建**。

### 记录 2：www 别名（必须）
| 字段 | 值 |
| --- | --- |
| 主机记录 | `www` |
| 记录类型 | `CNAME` |
| 线路类型 | 默认 |
| 记录值 | `cname.vercel-dns.com` |
| TTL | 600（或默认） |

> 若已存在指向 `web2825.weplus.hk.` 的 `www` CNAME，**修改为上面的值或删除后新建**。

## 三、验证是否生效

DNS 改动后通常 5–30 分钟生效（最长数小时）。在本地终端执行：

```bash
dig +short chinayoga.com A          # 应返回 76.76.21.21
dig +short www.chinayoga.com CNAME  # 应返回 cname.vercel-dns.com
```

生效后直接访问：

- https://chinayoga.com
- https://www.chinayoga.com （会自动跳转到主域名）

Vercel 会在 DNS 解析生效后的几分钟内 **自动签发并续期 SSL 证书**，无需手动申请。

## 四、合规提醒（中国大陆访问）

- **ICP 备案**：`chinayoga.com` 若此前已在阿里云或国内服务商完成 ICP 备案，请保持备案主体有效；若从未备案且主要面向中国大陆用户访问，建议尽快备案，否则可能被运营商拦截。Vercel 服务器位于境外，不强制要求备案即可解析，但国内访问速度与稳定性不如境内节点。
- **内容合规**：站点含食疗/养生/身心灵内容，上线后请继续遵守此前文档中标注的「非医疗诊疗、不宣传疗效、宗教仅作文化分享」等红线。

## 五、可选：把 DNS 整体托管给 Vercel（更省心）

若你不想在阿里云维护解析，可在阿里云把 `chinayoga.com` 的 **NS 记录** 改为 Vercel 的 nameserver：

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

之后所有解析由 Vercel 自动管理（自动 A/CNAME/证书）。代价是 DNS 不再由阿里云控制台管理。

---

> 本说明由自动化脚本依据 Vercel API 返回生成；阿里云侧操作需你本人在控制台完成（当前环境无阿里云凭据）。
