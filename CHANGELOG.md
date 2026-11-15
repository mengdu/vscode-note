# Changelog

## 0.1.0

Initial preview release of VS Note, a rich text and Markdown editor for Visual Studio Code.

### Note Editing and File Formats

- Open and visually edit `.note` and `.md` files directly in VS Code through the Note Editor.
- Store rich text notes as HTML fragments in `.note` files and Markdown notes as Markdown in `.md` files.
- Edit supported Markdown content through a visual interface, including headings, lists, task lists, block quotes, code blocks, links, images, and tables.
- Integrate changes with VS Code text documents so notes use the standard file-saving workflow.
- Synchronize external text-document changes back into the visual editor.
- Keep the editor's webview context when its tab is hidden.

### Document Structure and Text Formatting

- Create paragraphs and headings at all six levels, from H1 through H6.
- Insert hard line breaks within text blocks.
- Apply bold, italic, underline, strikethrough, and inline code formatting.
- Choose text colors from a palette of ten colors and restore the default text color.
- Highlight text with six translucent colors: Amber, Peach, Rose, Lavender, Sky, and Mint.
- Create and edit links through a link popover, with Command-click navigation to open destinations through VS Code.
- Align paragraphs and headings to the left, center, or right, or justify their text.
- Clear formatting from selected content and convert supported blocks back to paragraphs.
- Undo and redo edits with editor history and keyboard shortcuts.

### Lists and Block Quotes

- Create bulleted and numbered lists, including nested lists.
- Create interactive task lists with checked and unchecked items.
- Nest tasks to organize work into parent tasks and subtasks.
- Format quoted content with block quotes.

### Code Blocks

- Insert fenced code blocks with syntax highlighting powered by Lowlight.
- Select a code language from the block's language menu.
- Choose automatic language detection or explicit plain-text display.
- Copy a code block's text with its copy button and receive success or failure feedback.
- Preserve code indentation and line breaks during editing and HTML formatting.

### Tables

- Insert tables using a visual size picker with up to six rows and six columns at insertion.
- Start new tables with a header row.
- Insert rows above or below the current row and columns to the left or right of the current column.
- Append rows and columns using controls along the table edges.
- Select entire rows or columns through contextual table handles.
- Delete rows, columns, or an entire table.
- Merge selected cells and split merged cells.
- Toggle header rows and header columns.
- Resize table columns, with a minimum cell width of 64 pixels.
- Use pipe-table syntax for Markdown tables; keep advanced layouts such as merged cells in `.note` files when their structure needs to be preserved.

### Images and Local Assets

- Insert images through an upload control that accepts image files, with up to three files per upload selection.
- Paste images from the clipboard, including supported image data copied as HTML, and save them as local assets.
- Enforce a maximum upload size of 5 MiB per image.
- Save uploaded images to a configurable folder using `vsnote.imageUploadFolder`, which defaults to `/assets` relative to the workspace.
- Store uploaded image references as paths relative to the note's directory.
- Resolve relative image sources for webview display while retaining their original paths in the saved note.
- Resize images from their left or right edge while preserving the aspect ratio, with a minimum width of 80 pixels.
- Align image blocks to the left, center, or right.
- Preserve supported image dimensions and alignment in `.note` HTML; use standard image syntax in Markdown.

### Heading Navigation

- Toggle a table-of-contents sidebar generated from the note's headings.
- Navigate to a section by selecting its heading in the sidebar.
- Update the heading outline as the document changes.
- Highlight the active section as the note scrolls.
- Respect reduced-motion preferences when navigating to headings.

### Layout and Theme Integration

- Adapt the editor's appearance to VS Code light and dark themes.
- Keep formatting controls available in a toolbar at the top of the editor.
- Configure the editor's maximum width through `vsnote.editorMaxWidth`, using the default width, a custom pixel width, or `fullscreen`.
- Switch to full-width editing or restore the default size from the note menu.
- Place the editor on the left, in the center, or on the right through the note menu or `vsnote.editorAlignment`.

### Export

- Export the rendered note as a PNG image at 2× scale.
- Export the rendered note as an A4 PDF.
- Use the note's filename as the default export name.
- Apply the current VS Code editor background color to exports.

### AI-Assisted Authoring Guidance

- Include an English `AGENTS.md` guide describing all registered document nodes, supported inline marks, and compatible authoring examples.
- Document the differences between Markdown and HTML notes, local image handling, rich formatting, and unsupported syntax.
- Provide guidance that can be copied into the workspace containing a user's notes for AI-assisted writing.
