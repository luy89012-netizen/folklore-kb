// 引用导出工具：GB/T 7714 / APA / BibTeX 三种格式
import type { Paper } from '../api/papers'

function cleanAuthor(author?: string): string[] {
  if (!author) return []
  return author.split(/[;；,，/]| and /).map((s) => s.trim()).filter(Boolean)
}

/** GB/T 7714-2015 格式（中文文献常用） */
export function toGBT7714(p: Paper): string {
  const authors = cleanAuthor(p.author).slice(0, 3).join(', ')
  const etal = cleanAuthor(p.author).length > 3 ? ', 等' : ''
  const title = p.title
  const pub = p.publication || ''
  const year = p.year || ''
  const doi = (p.extra as any)?.doi
  if (pub) {
    // 期刊文章 [J]
    return `${authors}${etal}. ${title}[J]. ${pub}, ${year}.${doi ? ` DOI:${doi}.` : ''}`
  }
  // 专著 [M]
  return `${authors}${etal}. ${title}[M]. ${year}.`
}

/** APA 7th */
export function toAPA(p: Paper): string {
  const authors = cleanAuthor(p.author).join(', ')
  const year = p.year ? `(${p.year})` : ''
  const title = p.title_en || p.title
  const pub = p.publication ? ` ${p.publication}.` : ''
  const doi = (p.extra as any)?.doi
  return `${authors} ${year}. ${title}.${pub}${doi ? ` https://doi.org/${doi}` : ''}`
}

/** BibTeX */
export function toBibTeX(p: Paper): string {
  const key = p.paper_id.replace(/[^a-zA-Z0-9_]/g, '_')
  const authors = cleanAuthor(p.author).join(' and ')
  const title = p.title_en || p.title
  const doi = (p.extra as any)?.doi
  const isArticle = !!p.publication
  const type = isArticle ? 'article' : 'book'
  const lines = [
    `@${type}{${key},`,
    `  author = {${authors}},`,
    `  title = {${title}},`,
    p.publication ? `  journal = {${p.publication}},` : '',
    p.year ? `  year = {${p.year}},` : '',
    doi ? `  doi = {${doi}},` : '',
    `}`,
  ].filter(Boolean)
  return lines.join('\n')
}

export const CITE_FORMATS = [
  { key: 'gbt', label: 'GB/T 7714', fn: toGBT7714 },
  { key: 'apa', label: 'APA', fn: toAPA },
  { key: 'bibtex', label: 'BibTeX', fn: toBibTeX },
] as const
