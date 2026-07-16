#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
每周抓取民俗学 / 人类学 / 遗产研究领域的新论文。
数据源：CrossRef API（免 key、免反爬，公共学术元数据库，全球期刊全覆盖）
      + 中国民俗学网（zh-CN 补充源）

运行方式（GitHub Actions 或本地）：
    SUPABASE_URL=https://xxx.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=eyJxxx... \
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
# 写库
# ============================================================

def upsert_to_supabase(rows: List[Dict[str, Any]]) -> int:
    if not rows:
        return 0
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    endpoint = f"{url}/rest/v1/weekly_feed?on_conflict=feed_id"

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

    n = upsert_to_supabase(dedup)
    log(f"✅ done. upserted (or skipped as duplicate): {n} rows for week {monday_of_this_week()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
