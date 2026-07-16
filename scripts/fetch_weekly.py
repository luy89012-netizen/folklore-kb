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
基于英文标题和摘要，用简洁自然的中文输出七部分：

【速读部分】
1. summary  —— 核心观点，1-2 句话
2. theory   —— 涉及的理论传统或分析框架（如"实践理论"、"物质文化"、"表演理论"）；如无明显理论倾向填"无明显理论指向"
3. innovation —— 相较既有研究的创新点或独特贡献；如摘要信息不足以判断，如实填"摘要信息不足以判断"
4. keywords —— 3-5 个中文关键词

【分类部分】（每项必须从给定选项中单选一个英文值）
5. field —— 学科领域，只能是以下之一：
   - "folklore"（民俗学：口头传统、节日、民间信仰、传说、仪式）
   - "anthropology"（人类学：社会/文化/政治/经济人类学）
   - "heritage"（遗产研究：非遗、博物馆学、文化遗产政策）
   - "religion"（宗教研究：民间宗教、灵性、宗教社会学）
   - "interdisciplinary"（明显跨界的跨学科研究）

6. method —— 研究方法，只能是以下之一：
   - "ethnography"（民族志：田野、参与观察、深度访谈）
   - "archival"（档案/文本/历史文献研究）
   - "theoretical"（纯理论、纯概念思辨，无经验材料）
   - "mixed"（混合方法：民族志+档案 或 质+量）
   - "review"（综述、评论、书评类文本分析）
   - "digital"（数字方法：语料库、爬虫、算法、网络分析）

7. paper_type —— 论文性质，只能是以下之一：
   - "empirical"（经验研究：有具体田野/案例/数据）
   - "theory_building"（理论建构：明确提出新概念/新框架）
   - "theory_review"（理论回顾：梳理某个理论传统的演变）
   - "disciplinary_history"（学科史、思潮史、人物史）
   - "book_review"（书评）
   - "editorial"（发刊词、编辑按语、导读）
   - "essay"（随笔、短评、评论性文章）

严格规则：
- 前 4 项用简洁书面中文；后 3 项必须是给定英文枚举值之一
- 禁止编造摘要以外的内容
- 输出必须是 JSON 对象，不要 markdown，不要额外解释"""


def summarize_with_deepseek(title: str, abstract: str, api_key: str) -> Optional[Dict[str, Any]]:
    """调用 DeepSeek 生成中文速读；失败/无摘要返回 None"""
    if not abstract or len(abstract.strip()) < 30:
        return None  # 摘要太短就不概括，避免瞎编

    user_prompt = (
        f"标题: {title}\n"
        f"摘要: {abstract}\n\n"
        '请按此 JSON 格式返回：'
        '{"summary":"...","theory":"...","innovation":"...","keywords":["...","..."],'
        '"field":"folklore|anthropology|heritage|religion|interdisciplinary",'
        '"method":"ethnography|archival|theoretical|mixed|review|digital",'
        '"paper_type":"empirical|theory_building|theory_review|disciplinary_history|book_review|editorial|essay"}'
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
                "max_tokens": 800,
                "temperature": 0.3,
            },
            timeout=60,
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        data = json.loads(content)

        # 枚举白名单校验
        VALID_FIELDS = {"folklore", "anthropology", "heritage", "religion", "interdisciplinary"}
        VALID_METHODS = {"ethnography", "archival", "theoretical", "mixed", "review", "digital"}
        VALID_TYPES = {"empirical", "theory_building", "theory_review",
                       "disciplinary_history", "book_review", "editorial", "essay"}

        field = (data.get("field") or "").strip().lower()
        method = (data.get("method") or "").strip().lower()
        ptype = (data.get("paper_type") or "").strip().lower()

        return {
            "summary_zh": (data.get("summary") or "").strip()[:500],
            "theory": (data.get("theory") or "").strip()[:300],
            "innovation": (data.get("innovation") or "").strip()[:500],
            "keywords_zh": ", ".join(data.get("keywords") or [])[:200],
            "field": field if field in VALID_FIELDS else None,
            "method": method if method in VALID_METHODS else None,
            "paper_type": ptype if ptype in VALID_TYPES else None,
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

    # ★ 过滤：只保留有摘要且摘要 ≥30 字符的（无摘要无法生成中文速读，无价值入库）
    before = len(dedup)
    dedup = [r for r in dedup if r.get("abstract") and len(r["abstract"].strip()) >= 30]
    log(f"after abstract filter: {len(dedup)} rows (filtered out {before - len(dedup)} without abstract)")

    # 加中文速读（此时全部都有摘要）
    log(f"===== enriching with DeepSeek Chinese summary + classification =====")
    dedup = enrich_with_summary(dedup, os.environ.get("DEEPSEEK_API_KEY"))

    n = upsert_to_supabase(dedup)
    log(f"✅ done. upserted (or skipped as duplicate): {n} rows for week {monday_of_this_week()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
