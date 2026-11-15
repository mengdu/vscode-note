export function formatHTML(html: string): string {
  const template = document.createElement('template')
  template.innerHTML = html

  const blockTags = new Set([
    'DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE',
    'UL', 'OL', 'LI', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
    'COLGROUP', 'COL', 'PRE', 'HR',
  ])
  const containerTags = new Set([
    'DIV', 'BLOCKQUOTE', 'UL', 'OL', 'LI', 'TABLE',
    'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD', 'COLGROUP',
  ])

  function formatElement(element: Element, depth: number): string {
    const indent = '  '.repeat(depth)
    const children = Array.from(element.children)
    // 只在块级结构之间插入空白，保留行内文本间距和 pre 内的代码。
    const canIndent = containerTags.has(element.tagName)
      && children.length > 0
      && Array.from(element.childNodes).every(node =>
        node.nodeType === Node.ELEMENT_NODE
        || (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim()))
      && children.every(child => blockTags.has(child.tagName)
        || (element.matches('li[data-type="taskItem"]') && child.tagName === 'LABEL'))

    if (!canIndent) return indent + element.outerHTML

    // 从空壳元素获取标签，避免属性中的 > 干扰标签边界判断。
    const shell = element.cloneNode(false) as Element
    const openingTag = shell.outerHTML.slice(0, -(`</${element.localName}>`.length))
    const content = children.map(child => formatElement(child, depth + 1)).join('\n')
    return `${indent}${openingTag}\n${content}\n${indent}</${element.localName}>`
  }

  return Array.from(template.content.children)
    .map(element => formatElement(element, 0))
    .join('\n')
}
