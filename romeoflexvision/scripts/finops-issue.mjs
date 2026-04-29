import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const metricsPath = process.env.METRICS_PATH || "finops/request-metrics.json"

// `Number(env)` returns NaN for non-numeric values, and any comparison with NaN
// is false — which would silently fire alerts on every run. Reject NaN explicitly
// so that an invalid env var falls back to the documented default.
function envNumber(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === "") return fallback
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) {
    console.warn(`Invalid ${name}=${raw}; using default ${fallback}.`)
    return fallback
  }
  return parsed
}

const limit = envNumber("FINOPS_COST_ALERT_USD", 0.25)
const cacheFloor = envNumber("FINOPS_CACHE_HIT_FLOOR", 0.8)

const fullPath = path.join(root, metricsPath)
if (!fs.existsSync(fullPath)) {
  console.log(`No metrics file at ${metricsPath}; skipping issue creation.`)
  process.exit(0)
}

const payload = JSON.parse(fs.readFileSync(fullPath, "utf8"))
const costUsd = Number(payload.costUsd ?? 0)
const cacheHitRate = Number(payload.cacheHitRate ?? 0)
const tokenCount = Number(payload.tokenCount ?? 0)

if (costUsd <= limit && cacheHitRate >= cacheFloor) {
  console.log("FinOps metrics are within configured limits.")
  process.exit(0)
}

const title = `[FinOps] Expensive request detected: $${costUsd.toFixed(3)}`
const body = [
  "## FinOps alert",
  "",
  `- Cost USD: \`${costUsd.toFixed(3)}\``,
  `- Cache hit rate: \`${cacheHitRate.toFixed(2)}\``,
  `- Token count: \`${tokenCount}\``,
  `- Limit USD: \`${limit.toFixed(2)}\``,
  `- Cache floor: \`${cacheFloor.toFixed(2)}\``,
  "",
  "### Raw payload",
  "```json",
  JSON.stringify(payload, null, 2),
  "```",
].join("\n")

const repo = process.env.GITHUB_REPOSITORY
const token = process.env.GITHUB_TOKEN

if (!repo || !token) {
  console.log(body)
  process.exit(0)
}

const response = await fetch(`https://api.github.com/repos/${repo}/issues`, {
  method: "POST",
  headers: {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title,
    body,
    labels: ["finops", "cost-alert"],
  }),
})

if (!response.ok) {
  const text = await response.text()
  throw new Error(`Failed to create GitHub issue: ${response.status} ${text}`)
}

console.log(`Opened FinOps issue for ${title}`)
