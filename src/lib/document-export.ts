export type DocumentExportFormat = "txt" | "html" | "docx" | "odt" | "rtf";

const textEncoder = new TextEncoder();

const sanitizeFileName = (value: string) =>
  value.replace(/[^a-z0-9-_]+/gi, "_").replace(/^_+|_+$/g, "") || "document";

const normalizeTitle = (value: string) => value.replace(/\s+/g, " ").trim();

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const triggerDownload = (filename: string, blob: Blob) => {
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
};

const createTxtContent = (title: string, content: string) =>
  `${title}\n${"=".repeat(title.length)}\n\n${content}\n`;

const getParagraphs = (content: string) =>
  content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

const createHtmlContent = (title: string, content: string) => {
  const paragraphs = getParagraphs(content);

  const renderedParagraphs =
    paragraphs.length > 0
      ? paragraphs
          .map(
            (paragraph) =>
              `<p>${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`
          )
          .join("\n")
      : "<p></p>";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; line-height: 1.7; margin: 2.5rem auto; max-width: 760px; color: #1f2937; padding: 0 1.5rem; }
    h1 { margin-bottom: 2rem; font-size: 2rem; line-height: 1.3; }
    p { margin: 0 0 1.2rem; font-size: 1.05rem; }
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${renderedParagraphs}
</body>
</html>`;
};

const escapeRtf = (value: string) => {
  let result = "";
  for (let index = 0; index < value.length; index += 1) {
    const codeUnit = value.charCodeAt(index);
    const char = value[index];

    if (codeUnit === 92 || codeUnit === 123 || codeUnit === 125) {
      result += `\\${char}`;
      continue;
    }

    if (codeUnit === 10) {
      result += "\\line ";
      continue;
    }

    if (codeUnit === 13) continue;

    if (codeUnit > 127) {
      const signedCodeUnit = codeUnit > 32767 ? codeUnit - 65536 : codeUnit;
      result += `\\u${signedCodeUnit}?`;
      continue;
    }

    result += char;
  }
  return result;
};

const createRtfContent = (title: string, content: string) => {
  const paragraphs = getParagraphs(content);
  const renderedBody =
    paragraphs.length > 0
      ? paragraphs.map((paragraph) => escapeRtf(paragraph)).join("\\par\\par ")
      : "";

  return `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
\\viewkind4\\uc1\\pard\\f0\\fs24
\\b ${escapeRtf(title)}\\b0\\par\\par
${renderedBody}
}`;
};

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let crc = index;
    for (let iteration = 0; iteration < 8; iteration += 1) {
      crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
    table[index] = crc >>> 0;
  }
  return table;
})();

const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (let index = 0; index < data.length; index += 1) {
    crc = crcTable[(crc ^ data[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const pushUint16LE = (bytes: number[], value: number) => {
  bytes.push(value & 0xff, (value >>> 8) & 0xff);
};

const pushUint32LE = (bytes: number[], value: number) => {
  bytes.push(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  );
};

const pushBytes = (bytes: number[], value: Uint8Array) => {
  for (let index = 0; index < value.length; index += 1) {
    bytes.push(value[index]);
  }
};

type ZipFile = {
  name: string;
  content: Uint8Array;
};

const createStoredZip = (files: ZipFile[]) => {
  const output: number[] = [];
  const centralDirectory: number[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const dataBytes = file.content;
    const checksum = crc32(dataBytes);
    const size = dataBytes.length;
    const localHeaderOffset = offset;

    pushUint32LE(output, 0x04034b50);
    pushUint16LE(output, 20);
    pushUint16LE(output, 0);
    pushUint16LE(output, 0);
    pushUint16LE(output, 0);
    pushUint16LE(output, 0);
    pushUint32LE(output, checksum);
    pushUint32LE(output, size);
    pushUint32LE(output, size);
    pushUint16LE(output, nameBytes.length);
    pushUint16LE(output, 0);
    pushBytes(output, nameBytes);
    pushBytes(output, dataBytes);

    offset += 30 + nameBytes.length + size;

    pushUint32LE(centralDirectory, 0x02014b50);
    pushUint16LE(centralDirectory, 20);
    pushUint16LE(centralDirectory, 20);
    pushUint16LE(centralDirectory, 0);
    pushUint16LE(centralDirectory, 0);
    pushUint16LE(centralDirectory, 0);
    pushUint16LE(centralDirectory, 0);
    pushUint32LE(centralDirectory, checksum);
    pushUint32LE(centralDirectory, size);
    pushUint32LE(centralDirectory, size);
    pushUint16LE(centralDirectory, nameBytes.length);
    pushUint16LE(centralDirectory, 0);
    pushUint16LE(centralDirectory, 0);
    pushUint16LE(centralDirectory, 0);
    pushUint16LE(centralDirectory, 0);
    pushUint32LE(centralDirectory, 0);
    pushUint32LE(centralDirectory, localHeaderOffset);
    pushBytes(centralDirectory, nameBytes);
  }

  const centralDirectoryOffset = offset;
  pushBytes(output, Uint8Array.from(centralDirectory));
  offset += centralDirectory.length;

  pushUint32LE(output, 0x06054b50);
  pushUint16LE(output, 0);
  pushUint16LE(output, 0);
  pushUint16LE(output, files.length);
  pushUint16LE(output, files.length);
  pushUint32LE(output, centralDirectory.length);
  pushUint32LE(output, centralDirectoryOffset);
  pushUint16LE(output, 0);

  return Uint8Array.from(output);
};

const toWordParagraphXml = (paragraph: string) => {
  const clean = paragraph.replace(/\r\n/g, "\n");
  if (!clean.trim()) return "<w:p/>";
  const segments = clean.split("\n");
  const runs = segments
    .map((segment, index) => {
      const safe = escapeXml(segment);
      const textRun = `<w:r><w:t xml:space="preserve">${safe || " "}</w:t></w:r>`;
      return index < segments.length - 1 ? `${textRun}<w:r><w:br/></w:r>` : textRun;
    })
    .join("");
  return `<w:p>${runs}</w:p>`;
};

const toOdtParagraphXml = (paragraph: string) => {
  const clean = paragraph.replace(/\r\n/g, "\n");
  if (!clean.trim()) return "<text:p/>";
  const segments = clean.split("\n");
  const body = segments
    .map((segment, index) => {
      const safe = escapeXml(segment);
      return index < segments.length - 1 ? `${safe}<text:line-break/>` : safe;
    })
    .join("");
  return `<text:p>${body}</text:p>`;
};

const createOdtContent = (title: string, content: string) => {
  const paragraphs = getParagraphs(content);
  const textBody = [title, ...paragraphs].map(toOdtParagraphXml).join("");

  const mimetype = "application/vnd.oasis.opendocument.text";

  const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  office:version="1.3">
  <office:scripts/>
  <office:automatic-styles/>
  <office:body>
    <office:text>
      ${textBody}
    </office:text>
  </office:body>
</office:document-content>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-styles
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  office:version="1.3">
  <office:styles/>
  <office:automatic-styles/>
  <office:master-styles/>
</office:document-styles>`;

  const metaXml = `<?xml version="1.0" encoding="UTF-8"?>
<office:document-meta
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:meta="urn:oasis:names:tc:opendocument:xmlns:meta:1.0"
  office:version="1.3">
  <office:meta>
    <meta:generator>StoryForge</meta:generator>
  </office:meta>
</office:document-meta>`;

  const manifestXml = `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:media-type="${mimetype}"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/>
  <manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`;

  return createStoredZip([
    { name: "mimetype", content: textEncoder.encode(mimetype) },
    { name: "content.xml", content: textEncoder.encode(contentXml) },
    { name: "styles.xml", content: textEncoder.encode(stylesXml) },
    { name: "meta.xml", content: textEncoder.encode(metaXml) },
    { name: "META-INF/manifest.xml", content: textEncoder.encode(manifestXml) },
  ]);
};

const createDocxContent = (title: string, content: string) => {
  const paragraphs = getParagraphs(content);

  const xmlParagraphs = [
    toWordParagraphXml(title),
    ...paragraphs.map(toWordParagraphXml),
  ].join("");

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relationshipsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${xmlParagraphs}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return createStoredZip([
    { name: "[Content_Types].xml", content: textEncoder.encode(contentTypesXml) },
    { name: "_rels/.rels", content: textEncoder.encode(relationshipsXml) },
    { name: "word/document.xml", content: textEncoder.encode(documentXml) },
  ]);
};

export const downloadDocument = (
  titleInput: string,
  content: string,
  format: DocumentExportFormat
) => {
  const title = normalizeTitle(titleInput) || "Untitled";
  const safeFileName = sanitizeFileName(title);

  if (format === "txt") {
    const blob = new Blob([createTxtContent(title, content)], {
      type: "text/plain;charset=utf-8",
    });
    triggerDownload(`${safeFileName}.txt`, blob);
    return;
  }

  if (format === "html") {
    const blob = new Blob([createHtmlContent(title, content)], {
      type: "text/html;charset=utf-8",
    });
    triggerDownload(`${safeFileName}.html`, blob);
    return;
  }

  if (format === "rtf") {
    const blob = new Blob([createRtfContent(title, content)], {
      type: "application/rtf;charset=utf-8",
    });
    triggerDownload(`${safeFileName}.rtf`, blob);
    return;
  }

  if (format === "odt") {
    const odtBytes = createOdtContent(title, content);
    const odtBlob = new Blob([odtBytes], {
      type: "application/vnd.oasis.opendocument.text",
    });
    triggerDownload(`${safeFileName}.odt`, odtBlob);
    return;
  }

  const docxBytes = createDocxContent(title, content);
  const docxBlob = new Blob([docxBytes], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
  triggerDownload(`${safeFileName}.docx`, docxBlob);
};
