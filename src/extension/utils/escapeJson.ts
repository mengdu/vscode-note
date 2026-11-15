export function escapeJson(text: string) {
  return text.replace(/[<>\u2028\u2029]/g, e => {
    return  {
        '<': '\\u003C',
        '>': '\\u003E',
        '\u2028': '\\u2028',
        '\u2029': '\\u2029'
    }[e] || e
  })
}
