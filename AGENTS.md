# VS Note Authoring Instructions

## Scope and Source of Truth

These instructions apply to AI agents creating or editing `.md` and `.note` notes in this workspace. They describe the content that VS Note can parse, edit, and save. When modifying the extension source code, follow the actual implementation rather than treating this document as a replacement for the code.

If you use VS Note in another project, copy or adapt these instructions into that project's `AGENTS.md`.

The active extension list in `src/webview/NoteEditor/NoteEditor.tsx` is the source of truth for supported nodes, marks, and editor extensions. A dependency in `package.json`, an icon, a reusable component, or an unused extension file does not establish that a feature is enabled.

## File Formats and Saving

| File extension | Stored content | Authoring rule |
| --- | --- | --- |
| `.md` | Markdown | Prefer ordinary Markdown with explicit block structure. |
| `.note` | An HTML fragment | Use semantic HTML supported by the registered editor schema. |

- Never write Markdown as the document format of a `.note` file.
- Never save Tiptap JSON, application state, or a complete HTML page as a `.note` file.
- A `.note` file must not contain a doctype, document-level HTML wrapper, head section, stylesheet, or script.
- HTML examples in this document are fenced code examples for authoring `.note` files. They are not permission to insert raw HTML into Markdown notes.
- Markdown updates are serialized with `editor.getMarkdown()`. HTML updates are serialized with `formatHTML(editor.getHTML())`.
- Editing may normalize whitespace, indentation, list markers, attribute order, tags, and mark nesting. Preserve meaning and supported structure; do not promise byte-for-byte preservation.
- Unknown tags, unregistered node types, arbitrary classes, private attributes, and custom CSS are not reliable storage mechanisms. Content or formatting may be removed or transformed during editing.
- Prefer `.md` for portable textual notes. When a new note requires supported rich formatting such as color or image alignment, prefer `.note` if the user has not specified a format.
- Do not rename or convert an existing note to another format without a user request.

## General Authoring Rules

1. Read an existing note before editing it. Preserve its language, substantive content, heading hierarchy, task states, links, and supported formatting unless the request requires changes.
2. Use the simplest supported structure that expresses the requested content.
3. Separate Markdown blocks with blank lines. Use consistent indentation for nested lists and fenced blocks.
4. Escape literal Markdown punctuation when it would otherwise create formatting.
5. In `.note` text and attributes, escape special characters as appropriate, including `&amp;`, `&lt;`, `&gt;`, and `&quot;`.
6. Treat text inside code blocks as literal content. Do not apply prose cleanup or inline formatting to it.
7. Check local image files before referencing them. Do not invent filenames, paths, assets, or URLs.
8. Do not add unsupported syntax because another Markdown renderer or Tiptap installation supports it.
9. When a requested feature is unsupported or its preservation is uncertain, use a compatible alternative and explain the substitution in your reply.

## Supported Document Nodes

The following sections cover all currently registered document node types, including nodes supplied by the list and table extensions. Node names are implementation identifiers, not a JSON format to write into note files.

### 1. Document Root — `doc`

The root contains the note's block content. It is supplied by the `Document` extension and is not an HTML element to author.

- In `.md`, write the note directly, starting with a heading, paragraph, or another supported block.
- In `.note`, write adjacent HTML blocks directly. Do not wrap them in a complete HTML document or an invented root element.
- Do not add JSON fields such as `type`, `content`, or `attrs` around a note.

Example `.note` fragment:

```html
<h1>Project Notes</h1>
<p>Current status and next steps.</p>
```

### 2. Text — `text`

Text is the inline content of paragraphs, headings, and other text-containing nodes.

- Write ordinary Unicode text, including non-English text, directly.
- In Markdown, escape syntax characters when they are intended literally.
- In HTML, encode literal angle brackets and ampersands when needed.
- Do not wrap every word or sentence in a span. Use inline elements only for supported marks.
- Do not depend on repeated spaces or source indentation for visual layout.

```html
<p>Use &lt;name&gt; as a placeholder. Research &amp; development.</p>
```

### 3. Paragraph — `paragraph`

Paragraphs are the default prose blocks and contain inline content.

- `.md`: separate paragraphs with a blank line.
- `.note`: use a separate paragraph element for each paragraph.
- Use paragraphs for prose rather than repeated line breaks or layout containers.
- Paragraph alignment is supported in `.note`; see the alignment rules below.

```markdown
First paragraph.

Second paragraph with **important text**.
```

```html
<p>First paragraph.</p>
<p>Second paragraph with <strong>important text</strong>.</p>
```

### 4. Hard Line Break — `hardBreak`

A hard break starts a new line inside the same text block.

- `.md`: use a standard Markdown hard break, such as two trailing spaces followed by a newline. Confirm that editing tools preserve those spaces.
- `.note`: use a break element inside a paragraph or another compatible inline-content block.
- Prefer separate paragraphs when the content represents separate ideas.
- Do not assume that an ordinary newline in Markdown or HTML creates a hard break.
- Do not use repeated breaks to simulate margins, indentation, or page layout.

```html
<p>First line<br>Second line</p>
```

### 5. Heading — `heading`

Heading levels 1 through 6 are enabled.

- `.md`: use one through six hash characters followed by a space.
- `.note`: use the matching heading element.
- Use headings to describe the document hierarchy. Prefer a coherent progression and meaningful, nonempty labels.
- Do not use bold paragraphs as a substitute when a real section heading is intended.
- Do not add fabricated heading IDs or expect generated table-of-contents IDs to be permanent link targets.
- Alignment is supported for headings in `.note`.

```markdown
# Document Title

## Section

### Subsection
```

```html
<h1>Document Title</h1>
<h2>Section</h2>
<h3>Subsection</h3>
```

### 6. Block Quote — `blockquote`

A block quote contains supported blocks, normally paragraphs.

- `.md`: prefix quoted lines with `>`.
- `.note`: wrap paragraph or other supported block content in a blockquote.
- Preserve paragraph boundaries inside a multi-paragraph quotation.
- A block quote is not a callout component. Warning, note, and tip directives have no dedicated rendering contract.

```markdown
> Quoted statement.
>
> A second quoted paragraph.
```

```html
<blockquote>
  <p>Quoted statement.</p>
  <p>A second quoted paragraph.</p>
</blockquote>
```

### 7. Code Block — `codeBlock`

Code blocks contain literal text. VS Note uses a customized `CodeBlockLowlight` node with syntax highlighting, a language selector, and a copy button.

- `.md`: use fenced code blocks and an appropriate language identifier when known.
- `.note`: use a preformatted block containing a code element. A language class on the code element identifies the language.
- Use `plaintext` when explicit plain-text treatment is appropriate; omit the language when unknown.
- Preserve meaningful indentation and newlines inside the code.
- Escape HTML-sensitive code characters in `.note` source.
- Do not author the language selector, copy button, React wrappers, or syntax-highlighting spans. These belong to the editor's node view.
- A language label does not enable execution, diagram rendering, or mathematical typesetting.

```typescript
const message = 'Hello, VS Note'
console.log(message)
```

```html
<pre><code class="language-typescript">const message = 'Hello, VS Note'
console.log(message)</code></pre>
```

### 8. Bullet List — `bulletList`

A bullet list contains regular list-item nodes.

- `.md`: prefer `-` as the bullet marker.
- `.note`: use an unordered list containing list items.
- Indent nested Markdown lists consistently beneath their parent item.
- In HTML, place a nested list inside its parent list item.
- Do not simulate bullets with decorative characters in paragraphs.

```markdown
- First item
- Second item
  - Nested item
```

```html
<ul>
  <li><p>First item</p></li>
  <li>
    <p>Second item</p>
    <ul>
      <li><p>Nested item</p></li>
    </ul>
  </li>
</ul>
```

### 9. Ordered List — `orderedList`

An ordered list contains regular list-item nodes and carries its starting number.

- `.md`: use numeric markers such as `1.` and `2.`.
- `.note`: use an ordered list. Use its `start` attribute when a nondefault starting number matters.
- Preserve the intended order and starting number when editing existing instructions.
- Marker spelling and subsequent source numbers may be normalized on save. Do not rely on manually assigned numbers for individual items surviving serialization.
- Do not invent alphabetical, Roman-numeral, or custom-counter formatting.

```markdown
1. Prepare the input.
2. Review the output.
```

```html
<ol start="3">
  <li><p>Continue with the third step.</p></li>
  <li><p>Finish the process.</p></li>
</ol>
```

### 10. Regular List Item — `listItem`

Regular list items belong inside bullet or ordered lists.

- `.md`: author them through ordinary list syntax.
- `.note`: use a list item containing a paragraph, followed by any additional supported blocks.
- Keep nested lists within the relevant parent item.
- Do not place standalone list-item elements at the document root.
- Do not use regular list items as a substitute for task items with completion state.

```html
<li>
  <p>Parent item.</p>
  <p>Additional explanation for this item.</p>
</li>
```

This fragment must be placed inside an appropriate list.

### 11. Task List — `taskList`

Task lists contain task items with explicit checked state. Nested tasks are enabled.

- `.md`: use `- [ ]` for incomplete tasks and `- [x]` for completed tasks.
- `.note`: use an unordered list with `data-type="taskList"` and the task-item structure described next.
- Preserve completion state and nesting when editing.
- A plain unordered list with a checkbox character is not an equivalent task list.

```markdown
- [ ] Review the proposal
  - [x] Read the requirements
  - [ ] Check the examples
- [x] Create the initial draft
```

### 12. Task Item — `taskItem`

Task items have checked state and structured block content. For `.note`, use this editor-compatible structure:

```html
<ul data-type="taskList">
  <li data-type="taskItem" data-checked="false">
    <label><input type="checkbox"><span></span></label>
    <div><p>Review the proposal</p></div>
  </li>
  <li data-type="taskItem" data-checked="true">
    <label><input type="checkbox" checked="checked"><span></span></label>
    <div><p>Create the initial draft</p></div>
  </li>
</ul>
```

- `data-type="taskItem"` identifies the node.
- `data-checked="false"` or `data-checked="true"` stores its completion state.
- Keep the checkbox's checked attribute consistent with the stored state when authoring HTML.
- Put task content inside the content division as supported blocks.
- Put a nested task list inside its parent task's content division, after the parent paragraph.
- Do not add application event handlers or custom checkbox widgets.

### 13. Image — `image`

The registered `AlignedImage` extension extends Tiptap's image node. Images are block nodes, with source, alternative text, optional title, dimensions, and alignment attributes.

- `.md`: use standard image syntax. Do not depend on Markdown image size or alignment extensions.
- `.note`: use an image element with a valid source and useful alternative text. Include a title only when it adds information.
- Verify local files before adding references. Resolve relative paths from the note's directory.
- Preserve the saved source path. Do not write temporary webview resource URLs or editor resize wrappers into a note.
- Base64 image sources are accepted by the configured parser, but prefer existing local assets for normal authoring. Do not generate large inline payloads without a user need.
- Image alignment supports `left`, `center`, and `right`, with `left` as the default. See the rich-formatting examples below.
- Width and height attributes are available. When changing dimensions, preserve the aspect ratio rather than distorting the image.
- The editor provides left/right resize handles with a minimum width of 80 pixels and preserved aspect ratio. Do not serialize those handles.
- Do not nest an image in a paragraph when a standalone image block is intended.

Use an actual verified path in place of the illustrative path in these examples:

```markdown
![Architecture overview](assets/architecture.png)
```

```html
<img src="assets/architecture.png" alt="Architecture overview" title="System architecture">
```

### 14. Image Upload Placeholder — `imageUpload`

This is a registered, atomic block node for the editor's image-upload interface. It is not a completed image or a general-purpose HTML container.

- Its recognized HTML element is a division with `data-type="image-upload"`.
- Its configurable attributes include `accept`, `limit`, and `maxSize`.
- The current editor configuration accepts `image/*`, allows up to three files through the upload node, and sets a per-file maximum of 5 MiB (5,242,880 bytes).
- Normal authoring should reference an existing image or let the user upload one. Do not insert an empty upload placeholder as a replacement for missing content.
- Preserve an existing intentional placeholder unless the requested edit requires replacing or removing it.
- Do not invent Markdown syntax for an upload widget or promise it will survive Markdown serialization.
- Upload controls, progress indicators, errors, and file-picker UI are editor behavior, not note content to hand-author.

### 15. Table — `table`

Tables are registered through `TableKit`; column resizing is enabled with a minimum cell width of 64 pixels.

- `.md`: use a pipe table with a header separator row.
- `.note`: use a semantic table containing rows and header/data cells.
- Prefer simple rectangular tables. Use consistent column counts unless preserving an existing supported merged-cell layout.
- Keep Markdown cells short and inline. Do not depend on multiline blocks, nested tables, row spans, column spans, or stored column widths in Markdown.
- Do not add interactive table controls, resize handles, or node-view wrappers to the saved source.
- Preserve existing recognized HTML cell spans and column-width metadata when editing unrelated content. Prefer editor-generated samples before creating advanced table layouts.

```markdown
| Item | Status |
| --- | --- |
| Draft | Ready |
| Review | Pending |
```

```html
<table>
  <tbody>
    <tr>
      <th><p>Item</p></th>
      <th><p>Status</p></th>
    </tr>
    <tr>
      <td><p>Draft</p></td>
      <td><p>Ready</p></td>
    </tr>
    <tr>
      <td><p>Review</p></td>
      <td><p>Pending</p></td>
    </tr>
  </tbody>
</table>
```

### 16. Table Row — `tableRow`

Rows group table header and data cells.

- `.md`: each pipe-table row corresponds to a table row; the separator line defines header syntax rather than a data row.
- `.note`: use a table-row element inside a table's row structure.
- A row must contain cells, not loose paragraph elements or text directly.
- Preserve row order and the association between each cell and its column.
- HTML parsers may normalize table section wrappers such as the table body. Do not rely on their exact source spelling for additional semantics.

### 17. Table Header Cell — `tableHeader`

Header cells identify column or row headings.

- `.md`: use the first row above the pipe table's separator as the header.
- `.note`: use a header-cell element containing a paragraph or other supported block content.
- Use descriptive labels. Do not replace structural header cells with bold text in ordinary cells when editing an existing HTML table.
- Existing recognized cell attributes may include `colspan`, `rowspan`, and `colwidth`; preserve them where relevant rather than inventing CSS layout rules.

```html
<th><p>Status</p></th>
```

### 18. Table Data Cell — `tableCell`

Data cells hold the body content of a table.

- `.md`: use ordinary pipe-delimited cells and escape literal pipe characters where necessary.
- `.note`: use a data-cell element containing supported block content, normally a paragraph.
- Keep numeric values, dates, and units consistent within each column.
- Preserve intentional empty cells and existing spans when editing.
- Do not put a cell directly at the document root or outside a table row.

```html
<td><p>Pending review</p></td>
```

## Supported Inline Marks

Marks format inline content; they are not standalone blocks. Prefer common Markdown forms in `.md`, and semantic HTML forms in `.note`.

### Bold — `bold`

- `.md`: use `**important text**`.
- `.note`: use a strong element.
- Apply emphasis to meaningful phrases rather than entire sections of ordinary prose.

```html
<p>This is <strong>important text</strong>.</p>
```

### Italic — `italic`

- `.md`: use `*emphasized text*`.
- `.note`: use an emphasis element.
- Avoid ambiguous runs of underscore characters next to identifiers; use inline code for identifiers instead.

```html
<p>This is <em>emphasized text</em>.</p>
```

### Strikethrough — `strike`

- `.md`: use `~~obsolete text~~`.
- `.note`: prefer an s element.
- Preserve the underlying text unless the user requests its deletion.

```html
<p><s>Obsolete text</s> Updated text.</p>
```

### Underline — `underline`

- `.note`: use a u element.
- For new `.md` content, prefer bold or italic when emphasis is the goal. Do not introduce raw HTML or a custom underline convention.
- Do not assume underscores mean underline; ordinary Markdown uses them for emphasis.
- Preserve an existing recognized representation where possible, but do not promise portable underline formatting in Markdown.

```html
<p>This is <u>underlined text</u>.</p>
```

### Inline Code — `code`

- `.md`: surround a short literal with backticks. Use a longer delimiter if the literal itself contains backticks.
- `.note`: use a code element inside a text block.
- Use inline code for identifiers, filenames, command names, and short literal values.
- Use a code block for multiline examples.
- Do not depend on combining inline code with other marks; code is intended as literal text.

```html
<p>Run <code>npm run build</code> after changing the implementation.</p>
```

### Link — `link`

- `.md`: prefer explicit inline links such as `[Project documentation](https://example.com/docs)`.
- `.note`: use an anchor element with an href attribute and meaningful link text.
- Check local destinations when applicable. Preserve existing query parameters and fragments unless changing them is requested.
- Use ordinary, appropriate destinations. Do not author executable URLs or event-handler attributes.
- Do not rely on custom anchor classes, IDs, or styling being preserved.
- Clicking and link selection are editor behavior. The current editor uses Command or Ctrl plus left click to allow VS Code to open a link; this is not syntax to store in a note.

```html
<p>Read the <a href="https://example.com/docs">project documentation</a>.</p>
```

### Text Style — `textStyle`

`TextStyle` supplies the inline span used by registered styling extensions. In this editor, `Color` adds text color to that mark.

- `.note`: use a span with the supported inline color style when color is requested.
- `.md`: use words, emphasis, or status labels instead of depending on text color.
- `TextStyle` registration does not enable arbitrary font families, font sizes, line heights, or every extension in `TextStyleKit`.
- Do not use arbitrary span attributes as hidden metadata.

```html
<p><span style="color: #d45d5d">Needs attention</span></p>
```

### Highlight — `highlight`

Multicolor highlighting is enabled.

- `.note`: use a mark element. When specifying a color, mirror the editor's `data-color` and inline background-color output.
- `.md`: prefer bold text or an explicit label for new notes. Do not introduce a custom highlighting convention or raw HTML to guarantee color.
- A recognized editing shortcut or parser extension is not a guarantee of cross-renderer Markdown compatibility.
- Preserve an existing supported highlight when editing `.note` content.
- Highlight is inline text formatting. It does not establish support for arbitrary block or table-cell background colors.

```html
<p><mark data-color="rgba(250, 204, 21, 0.25)" style="background-color: rgba(250, 204, 21, 0.25); color: inherit">Review this point</mark></p>
```

## Rich Formatting and Attributes

### Paragraph and Heading Alignment

`TextAlign` is enabled for paragraphs and headings only. Supported alignment values are `left`, `center`, `right`, and `justify`.

- Use a text-align style on the relevant paragraph or heading in `.note`.
- In `.md`, express hierarchy through headings and structure rather than custom alignment syntax.
- Do not apply this rule to lists, tables, or arbitrary containers and assume equivalent support.

```html
<h2 style="text-align: center">Quarterly Review</h2>
<p style="text-align: right">Prepared by the project team.</p>
```

### Image Alignment and Dimensions

Image alignment uses the custom image `align` attribute, serialized as `data-align` with inline display and margin styles.

```html
<img src="assets/architecture.png" alt="Architecture overview" width="640" data-align="center" style="display: block; margin-left: auto; margin-right: auto">
```

- The path in this example is illustrative and must be checked or replaced before use in a real note.
- Left alignment uses left margin `0` and right margin `auto`.
- Center alignment uses `auto` for both margins.
- Right alignment uses left margin `auto` and right margin `0`.
- The custom parser accepts a recognized `data-align`, with an inline text-align fallback. Prefer the editor's data-align form when authoring.
- Do not substitute floating layouts, positioning, arbitrary wrappers, or image justification.
- Markdown image syntax does not reliably retain these attributes. Use `.note` when they are required and the format is not already fixed by the user.

### Text and Highlight Colors

- Prefer existing editor-generated colors and serialization when extending a styled `.note`.
- Text color is applied through `Color` and `TextStyle`; highlight color is applied through `Highlight`.
- Browser serialization can change a color's textual representation, such as converting hex to RGB. Do not treat equivalent color spellings as content changes requiring repair.
- Do not assume an unused background-color extension is active. The repository's `NodeBackground` extension is not registered in the current editor.
- When meaning depends on a color, also state it in text, such as “Pending review” or “Approved.”

## Images and Local Assets

- Resolve a relative image source from the directory containing the note, not automatically from the workspace root.
- Verify the file exists before adding a local image reference. Preserve valid existing references when moving or editing nearby text.
- The illustrative asset paths in this document are examples, not claims that those files exist.
- The `vsnote.imageUploadFolder` setting controls uploads. Its default is `/assets`; a leading slash is interpreted relative to the workspace for upload-folder configuration. A relative setting is resolved from the note's directory.
- Outside a workspace, a saved note's directory is the upload root. Untitled notes must be saved before uploading. Upload paths outside the root are rejected. Uploaded filenames use a random UUID while retaining the extension.
- That configuration rule does not redefine a leading slash in a saved image source as a portable workspace-relative URL. Prefer note-relative sources generated by the upload flow.
- The upload implementation returns a path relative to the note's directory. The webview resolves that source for display without replacing it in saved content.
- Pasted images are uploaded to files by the editor before an image node is inserted. Do not emulate the temporary clipboard state in a note.
- Do not silently overwrite an existing image or create a placeholder asset merely to make an invented reference appear valid.

## Editor Features That Are Not Note Syntax

- The table of contents is a generated sidebar based on heading nodes. Do not insert `[TOC]`, a custom TOC node, or a serialized sidebar into a note.
- Generated TOC identifiers depend on document positions and are not authored heading IDs.
- Placeholder text, undo/redo history, drop cursors, gap cursors, and selection decorations are editor behavior, not stored note content.
- Code-block copy buttons and language selectors, image resize handles, upload controls, and table controls are node-view UI. Do not copy their rendered DOM into note files.
- Editor width, fullscreen mode, and editor placement are VS Code settings. They are distinct from paragraph and image alignment and must not be simulated through note markup.
- PNG and PDF are export operations available from the editor menu. They are not editable note formats or directives to embed in a note.

## Unsupported or Unverified Features

Do not author the following with an expectation that VS Note will render them as specialized content or preserve them through editing:

| Feature | Compatible alternative |
| --- | --- |
| Mermaid or PlantUML diagrams | Explain the structure with headings, lists, a table, or literal code; use a real existing image if available. |
| LaTeX or math nodes | Write the expression as ordinary text or literal code. |
| Footnotes and dedicated citation nodes | Use inline links and an ordinary References section. |
| Callouts or admonition directives | Use a heading, paragraph, or ordinary block quote with an explicit label. |
| Embedded pages, iframes, video, or interactive widgets | Use a normal link and descriptive text. |
| YAML front matter or custom Markdown directives | Express metadata as ordinary paragraphs, a list, or a table. |
| Raw HTML in `.md` | Use ordinary Markdown, or author supported HTML in `.note` when the format is appropriate. |
| Horizontal rules | Use headings or paragraph spacing; no `horizontalRule` node is currently registered. |
| Subscript or superscript | Use plain text or code; these marks are not currently registered. |
| Arbitrary font family, font size, or line-height control | Use headings, paragraphs, and supported emphasis. |
| Arbitrary block backgrounds or custom CSS layouts | Use ordinary structure and the explicitly supported rich attributes. |
| Manual table-of-contents directives or permanent generated heading anchors | Use actual headings and the generated sidebar. |

- Do not infer support from a dependency, a toolbar helper, or an HTML tag appearing in the HTML formatter's list of block tags.
- `InvisibleCharacters` and `FindAndReplace` are not active registrations in the current editor. Do not describe commented imports as enabled features.
- Diagram or formula source may be included as literal code when the user needs the source itself, but explicitly describe it as code rather than a rendered diagram or equation.
- Do not introduce unsupported syntax into an existing note merely to preserve how it looks in a different renderer. Explain any necessary fallback.

## Editing and Validation Checklist

Before completing a note-writing task:

1. Confirm the target file and its extension. Preserve the existing storage format.
2. Confirm that the note contains only the requested content changes and compatible structure.
3. Check heading levels, list nesting, task states, table shape, and code-block boundaries.
4. For `.md`, check that there is no raw HTML, front matter, invented directive, or unsupported rendering-dependent syntax outside literal examples.
5. For `.note`, check that the file is an HTML fragment, text is escaped correctly, and lists, tasks, and tables have the required nesting.
6. Verify newly referenced local images and other local destinations. Keep saved image sources independent of webview URLs.
7. Preserve recognized existing formatting and attributes when unrelated content is edited. Do not promise preservation of unknown markup.
8. Review the final diff. Do not claim an editor round-trip or export test unless it was actually performed.
9. Briefly report any compatible substitutions or remaining limitations relevant to the user's request.

Documentation-only changes normally require a content and diff review rather than an application build. If the editor implementation changes, re-check these instructions against the active schema and use the project's applicable build or validation commands.

## Implementation References

Use these files when verifying or updating the rules:

- `src/webview/NoteEditor/NoteEditor.tsx`: active extensions, parser setup, clipboard images, and save serialization.
- `src/webview/NoteEditor/extensions/aligned-image.ts`: saved image alignment and display-only source resolution.
- `src/webview/NoteEditor/extensions/code-block.tsx`: code-block node view, syntax highlighting, and code tools.
- `src/webview/NoteEditor/extensions/table-of-contents.ts`: generated heading navigation and sidebar state.
- `src/webview/NoteEditor/formatHTML.ts`: HTML output formatting, not the supported-node registry.
- `src/webview/components/tiptap-node/image-upload-node/image-upload-node-extension.ts`: upload placeholder schema and attributes.
- `src/webview/NoteEditor/MenuBar.tsx`: visible authoring controls, highlight palette, and export actions.
- `src/webview/components/text-color-popover/index.tsx`: text-color controls and palette.
- `src/webview/App.tsx`: image upload validation and relative image-source display resolution.
- `src/extension/NoteEditor.ts`: file format selection, note updates, settings, and asset saving.
- `src/extension/utils/resolveFolder.ts`: upload-folder resolution.
- `package.json`: editor file associations and configuration defaults; dependencies alone do not establish feature support.
