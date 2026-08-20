export type AiContentBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'table'; rows: string[][] }

const cleanInline = (value: string) => value
  .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
  .replace(/\*\*([^*]+)\*\*/g, '$1')
  .replace(/__([^_]+)__/g, '$1')
  .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1')
  .replace(/(?<!_)_([^_]+)_(?!_)/g, '$1')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/~~([^~]+)~~/g, '$1')
  .replace(/\\([#*_`|])/g, '$1')
  .trim()

const isTableLine = (line: string) => /^\s*\|.*\|\s*$/.test(line)
const isTableSeparator = (line: string) => /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)

export function parseAiContent(raw: string): AiContentBlock[] {
  const lines = String(raw || '').replace(/\r\n?/g, '\n').split('\n')
  const blocks: AiContentBlock[] = []
  let paragraph: string[] = []

  const flushParagraph = () => {
    const text = cleanInline(paragraph.join(' ').replace(/\s+/g, ' '))
    if (text) blocks.push({ kind: 'paragraph', text })
    paragraph = []
  }

  for (let index = 0; index < lines.length; index += 1) {
    const original = lines[index]
    const line = original.trim()

    if (!line) {
      flushParagraph()
      continue
    }

    const heading = line.match(/^#{1,6}\s+(.+)$/)
    if (heading) {
      flushParagraph()
      const text = cleanInline(heading[1])
      if (text) blocks.push({ kind: 'heading', text })
      continue
    }

    if (isTableLine(line)) {
      flushParagraph()
      const rows: string[][] = []
      while (index < lines.length && (isTableLine(lines[index].trim()) || isTableSeparator(lines[index].trim()))) {
        const candidate = lines[index].trim()
        if (!isTableSeparator(candidate)) {
          const cells = candidate.slice(1, -1).split('|').map(cell => cleanInline(cell)).filter(Boolean)
          if (cells.length) rows.push(cells)
        }
        index += 1
      }
      index -= 1
      if (rows.length) blocks.push({ kind: 'table', rows })
      continue
    }

    const bullet = line.match(/^[-*•]\s+(.+)$/)
    if (bullet) {
      flushParagraph()
      const text = cleanInline(bullet[1])
      if (text) blocks.push({ kind: 'bullet', text })
      continue
    }

    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/)
    if (numbered) {
      flushParagraph()
      const text = cleanInline(`${numbered[1]}. ${numbered[2]}`)
      if (text) blocks.push({ kind: 'bullet', text })
      continue
    }

    paragraph.push(line.replace(/^#{1,6}\s*/, ''))
  }

  flushParagraph()
  return blocks
}

export function aiContentToPlainText(raw: string) {
  return parseAiContent(raw).map(block => {
    if (block.kind === 'heading') return block.text
    if (block.kind === 'bullet') return `• ${block.text}`
    if (block.kind === 'table') return block.rows.map(row => row.join(' — ')).join('\n')
    return block.text
  }).join('\n\n')
}
