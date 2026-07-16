#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每周抓取民俗学 / 人类学 / 遗产研究领域的新论文，并用 DeepSeek 做中文速读。
数据源：CrossRef API（免 key、免反爬，公共学术元数据库，全球期刊全覆盖）
      + 中国民俗学网（zh-CN 补充源）

运行方式（GitHub Actions 或本地）：
    SUPABASE_URL=https://xxx.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=eyJxxx... \
    DEEPSEEK_API_KEY=sk-xxx \
    python3 scripts/fetch_weekly.py

依赖：
    pip install requests feedparser
"""

import os
import sys
import hashlib
import json
import re
import time
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

import requests
import feedparser  # type: ignore

# ============================================================
# 期刊配置（按 ISSN 从 CrossRef 拉最新论文）
# ============================================================

JOURNALS: List[Dict[str, str]] = [
    # ---------- 民俗学核心 ----------
    {"issn": "0021-8715", "name": "Journal of American Folklore", "field": "民俗学"},
    {"issn": "0737-7037", "name": "Journal of Folklore Research", "field": "民俗学"},
    {"issn": "0043-373X", "name": "Western Folklore", "field": "民俗学"},
    # ---------- 人类学 ----------
    {"issn": "1548-1360", "name": "Cultural Anthropology", "field": "人类学"},
    {"issn": "1548-1425", "name": "American Ethnologist", "field": "人类学"},
    {"issn": "1467-9655", "name": "Journal of the Royal Anthropological Institute", "field": "人类学"},
    # ---------- 遗产研究 ----------
    {"issn": "1352-7258", "name": "International Journal of Heritage Studies", "field": "遗产研究"},
    {"issn": "1479-8360", "name": "Museum & Society", "field": "遗产研究"},
]

# 中文源（RSS）
# ⚠️ 注意：中国民俗学网从 GitHub Actions 服务器 (美国 IP) 访问会 468 被拒。
# 目前保留代码，遇到失败会自动降级不影响主流程。
# 未来的替代方案：（a）你告诉我一个稳定的中文源，我加进来；
#                （b）本地 cron 跑抓取（你自己电脑或云服务器在中国境内）
ZH_RSS_SOURCES: List[Dict[str, str]] = [
    {
        "name": "中国民俗学网",
        "url": "https://www.chinesefolklore.org.cn/web/index.php?NewsClass=all&format=rss",
        "field": "民俗学",
    },
]

# 每个期刊每次最多拉几条
PER_JOURNAL_LIMIT = 25

# 关键词打标（用于前端筛选，不做过滤）
KEYWORDS: List[str] = [
    "folklore", "folk narrative", "vernacular", "oral tradition",
    "cultural anthropology", "ethnography", "ritual", "kinship",
    "intangible heritage", "critical heritage", "museum studies",
    "民俗", "口头", "非遗", "仪式", "神话", "遗产",
]


# ============================================================
# 工具
# ============================================================

def log(msg: str) -> None:
    print(f"[{datetime.now(timezone.utc).isoformat()}] {msg}", flush=True)


def monday_of_this_week() -> str:
    """本周一的日期（Asia/Shanghai）"""
    now = datetime.now(timezone(timedelta(hours=8)))
    monday = now - timedelta(days=now.weekday())
    return monday.strftime("%Y-%m-%d")


def feed_id_of(link: str, title: str) -> str:
    seed = (link or title or "").strip()
    return "f_" + hashlib.md5(seed.encode("utf-8")).hexdigest()[:16]


def clean_text(s: Optional[str], max_len: int = 800) -> str:
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > max_len:
        s = s[:max_len] + "…"
    return s


def match_keyword(title: str, summary: str) -> Optional[str]:
    text = (title + " " + summary).lower()
    for kw in KEYWORDS:
        if kw.lower() in text:
            return kw
    return None


# ============================================================
# CrossRef 拉取
# ============================================================

def fetch_journal(j: Dict[str, str]) -> List[Dict[str, Any]]:
    """按 ISSN 拉某期刊最新论文"""
    issn = j["issn"]
    name = j["name"]
    url = f"https://api.crossref.org/journals/{issn}/works"
    params = {"rows": PER_JOURNAL_LIMIT, "sort": "published", "order": "desc"}
    log(f"→ {name} (ISSN {issn})")
    try:
        r = requests.get(
            url,
            params=params,
            timeout=25,
            headers={"User-Agent": "folklore-kb-bot/1.0 (mailto:liuyuyan3@xiaohongshu.com)"},
        )
        r.raise_for_status()
        items = r.json().get("message", {}).get("items", [])
        log(f"  ✓ {len(items)} items")
    except Exception as e:
        log(f"  ✗ failed: {e}")
        return []

    out: List[Dict[str, Any]] = []
    for it in items:
        title_list = it.get("title") or []
        if not title_list:
            continue
        title = clean_text(title_list[0], 500)
        link = it.get("URL", "") or (it.get("resource", {}).get("primary", {}).get("URL", ""))
        authors_list = it.get("author") or []
        authors = ", ".join([
            f"{a.get('given','')} {a.get('family','')}".strip()
            for a in authors_list if a.get("family")
        ])
        year = None
        for key in ["published-print", "published-online", "issued", "created"]:
            parts = it.get(key, {}).get("date-parts")
            if parts and parts[0]:
                year = parts[0][0]
                break
        abstract = clean_text(it.get("abstract", ""))
        out.append({
            "feed_id": feed_id_of(link, title),
            "title": title,
            "authors": authors[:200],
            "year": year or datetime.now().year,
            "source": name,
            "link": link[:500] if link else "",
            "abstract": abstract,
            "keyword": match_keyword(title, abstract),
            "week_of": monday_of_this_week(),
            "extra": {"lang": "en", "field": j.get("field"), "issn": issn},
        })
    return out


# ============================================================
# 中文 RSS 拉取
# ============================================================

def fetch_zh_rss(src: Dict[str, str]) -> List[Dict[str, Any]]:
    log(f"→ {src['name']}: {src['url']}")
    try:
        r = requests.get(
            src["url"],
            timeout=25,
            headers={
                "User-Agent": "Mozilla/5.0 (compatible; folklore-kb-bot/1.0)",
                "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
            },
        )
        r.raise_for_status()
        parsed = feedparser.parse(r.content)
        entries = parsed.get("entries", [])
        log(f"  ✓ {len(entries)} entries")
    except Exception as e:
        log(f"  ✗ failed: {e}")
        return []

    out: List[Dict[str, Any]] = []
    for e in entries[:PER_JOURNAL_LIMIT]:
        title = clean_text(getattr(e, "title", ""), 500)
        if not title:
            continue
        summary = clean_text(getattr(e, "summary", "") or getattr(e, "description", ""))
        link = (getattr(e, "link", "") or "").strip()
        year = None
        for key in ["published_parsed", "updated_parsed"]:
            t = getattr(e, key, None)
            if t:
                year = t.tm_year
                break
        out.append({
            "feed_id": feed_id_of(link, title),
            "title": title,
            "authors": clean_text(getattr(e, "author", ""), 200),
            "year": year or datetime.now().year,
            "source": src["name"],
            "link": link[:500],
            "abstract": summary,
            "keyword": match_keyword(title, summary),
            "week_of": monday_of_this_week(),
            "extra": {"lang": "zh", "field": src.get("field")},
        })
    return out


# ============================================================
# DeepSeek 中文速读
# ============================================================

DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

SYSTEM_PROMPT = """你是民俗学 / 人类学 / 遗产研究领域的论文速读助手。
基于英文标题和摘要，用简洁自然的中文输出四部分：
1. summary  —— 核心观点，1-2 句话
2. theory   —— 涉及的理论传统或分析框架（如"实践理论"、"物质文化"、"表演理论"）；如无明显理论倾向填"无明显理论指向"
3. innovation —— 相较既有研究的创新点或独特贡献；如摘要信息不足以判断，如实填"摘要信息不足以判断"
4. keywords —— 3-5 个中文关键词

严格规则：
- 全部用简洁书面中文
- 禁止编造摘要以外的内容
- 遇到摘要过短或无摘要，如实说"信息不足"
- 输出必须是 JSON 对象，不要 markdown，不要额外解释"""


def summarize_with_deepseek(title: str, abstract: str, api_key: str) -> Optional[Dict[str, Any]]:
    """调用 DeepSeek 生成中文速读；失败/无摘要返回 None"""
    if not abstract or len(abstract.strip()) < 30:
        return None  # 摘要太短就不概括，避免瞎编

    user_prompt = (
        f"标题: {title}\n"
        f"摘要: {abstract}\n\n"
        '请按此 JSON 格式返回：{"summary":"...","theory":"...","innovation":"...","keywords":["...","..."]}'
    )

    try:
        r = requests.post(
            DEEPSEEK_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            },
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                "response_format": {"type": "json_object"},
                "max_tokens": 600,
                "temperature": 0.3,
            },
            timeout=60,
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        data = json.loads(content)
        # 规范化输出
        return {
            "summary_zh": (data.get("summary") or "").strip()[:500],
            "theory": (data.get("theory") or "").strip()[:300],
            "innovation": (data.get("innovation") or "").strip()[:500],
            "keywords_zh": ", ".join(data.get("keywords") or [])[:200],
        }
    except Exception as e:
        log(f"    ⚠️  DeepSeek 失败: {e}")
        return None


def enrich_with_summary(rows: List[Dict[str, Any]], api_key: Optional[str]) -> List[Dict[str, Any]]:
    """给所有含摘要的 row 补上中文速读"""
    if not api_key:
        log("⚠️  未配置 DEEPSEEK_API_KEY，跳过中文速读")
        return rows
    total = len(rows)
    done = 0
    skipped = 0
    for i, row in enumerate(rows, 1):
        if not row.get("abstract"):
            skipped += 1
            continue
        summary = summarize_with_deepseek(row["title"], row["abstract"], api_key)
        if summary:
            row.update(summary)
            done += 1
        # 温和限速（DeepSeek 没有严格 rate limit，但礼貌一点）
        time.sleep(0.3)
        if i % 20 == 0:
            log(f"  progress: {i}/{total} done={done} skipped={skipped}")
    log(f"✅ 中文速读完成: 处理 {done} 条，跳过 {skipped} 条无摘要")
    return rows


# ============================================================
# 写库
# ============================================================

def upsert_to_supabase(rows: List[Dict[str, Any]]) -> int:
    if not rows:
        return 0
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    endpoint = f"{url}/rest/v1/weekly_feed?on_conflict=feed_id"

    # PostgREST 批量插入要求所有 dict 有相同的 keys
    # → 收集所有 keys 的并集，缺失字段补 None
    all_keys = set()
    for row in rows:
        all_keys.update(row.keys())
    normalized = []
    for row in rows:
        r = {k: row.get(k) for k in all_keys}
        normalized.append(r)
    rows = normalized

    batch_size = 50
    total = 0
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i + batch_size]
        r = requests.post(
            endpoint,
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            data=json.dumps(batch),
            timeout=30,
        )
        if r.status_code >= 300:
            log(f"  ✗ batch {i//batch_size} failed: HTTP {r.status_code} {r.text[:200]}")
            continue
        total += len(batch)
        log(f"  ✓ batch {i//batch_size}: {len(batch)} rows upserted")
    return total


# ============================================================
# 主入口
# ============================================================

def main() -> int:
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_SERVICE_ROLE_KEY"):
        print("❌ 缺少环境变量 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY", file=sys.stderr)
        return 2

    all_rows: List[Dict[str, Any]] = []

    log(f"===== fetching from CrossRef ({len(JOURNALS)} journals) =====")
    for j in JOURNALS:
        all_rows.extend(fetch_journal(j))
        time.sleep(1)

    log(f"===== fetching from ZH RSS ({len(ZH_RSS_SOURCES)} sources) =====")
    for src in ZH_RSS_SOURCES:
        all_rows.extend(fetch_zh_rss(src))
        time.sleep(1)

    log(f"total fetched: {len(all_rows)} rows (before dedup)")

    seen = set()
    dedup: List[Dict[str, Any]] = []
    for row in all_rows:
        if row["feed_id"] in seen:
            continue
        seen.add(row["feed_id"])
        dedup.append(row)
    log(f"after dedup: {len(dedup)} rows")

    # 加中文速读（有摘要的才处理）
    log(f"===== enriching with DeepSeek Chinese summary =====")
    dedup = enrich_with_summary(dedup, os.environ.get("DEEPSEEK_API_KEY"))

    n = upsert_to_supabase(dedup)
    log(f"✅ done. upserted (or skipped as duplicate): {n} rows for week {monday_of_this_week()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
