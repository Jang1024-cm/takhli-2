/**
 * Print helper utility for A4 documents
 * Handles printing reliably both inside iFrames (AI Studio preview) and in standalone browsers
 */

export function printA4Document(elementId: string, title: string = 'เอกสารใบแจ้งยอด A4'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[printA4Document] Element #${elementId} not found in DOM.`);
    window.print();
    return;
  }

  // Extract all existing style and link[rel="stylesheet"] tags from current document
  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  try {
    let printFrame = document.getElementById('a4-print-hidden-iframe') as HTMLIFrameElement | null;
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'a4-print-hidden-iframe';
      // CRITICAL: Dimensions must NOT be 0x0 or opacity: 0, which causes browsers to render blank pages
      printFrame.style.position = 'fixed';
      printFrame.style.left = '-9999px';
      printFrame.style.top = '0';
      printFrame.style.width = '210mm';
      printFrame.style.minHeight = '297mm';
      printFrame.style.border = '0';
      printFrame.style.zIndex = '-9999';
      printFrame.style.visibility = 'visible';
      document.body.appendChild(printFrame);
    }

    const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html lang="th">
          <head>
            <meta charset="utf-8" />
            <title>${title}</title>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
            ${headStyles}
            <style>
              * {
                box-sizing: border-box !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                font-family: 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                color: #0f172a !important;
                background-color: #ffffff !important;
                font-size: 12px;
                line-height: 1.45;
                text-align: left !important;
                width: 100% !important;
              }
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              .print-container {
                width: 100%;
                max-width: 210mm;
                margin: 0 auto;
                background: #ffffff;
                text-align: left !important;
              }
              /* Flexbox rules */
              .flex { display: flex !important; }
              .inline-flex { display: inline-flex !important; }
              .flex-col { flex-direction: column !important; }
              .flex-row { flex-direction: row !important; }
              .items-start { align-items: flex-start !important; }
              .items-center { align-items: center !important; }
              .items-end { align-items: flex-end !important; }
              .justify-start { justify-content: flex-start !important; }
              .justify-center { justify-content: center !important; }
              .justify-between { justify-content: space-between !important; }
              .shrink-0 { flex-shrink: 0 !important; }
              .grow { flex-grow: 1 !important; }
              
              /* Grid rules */
              .grid { display: grid !important; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)) !important; }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
              .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
              .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
              .gap-1 { gap: 4px !important; }
              .gap-2 { gap: 8px !important; }
              .gap-2\\.5 { gap: 10px !important; }
              .gap-3 { gap: 12px !important; }
              .gap-4 { gap: 16px !important; }
              .gap-5 { gap: 20px !important; }
              .gap-6 { gap: 24px !important; }

              /* Text alignment */
              .text-left { text-align: left !important; }
              .text-right { text-align: right !important; }
              .text-center { text-align: center !important; }

              /* Table styling guarantees */
              table {
                width: 100% !important;
                border-collapse: collapse !important;
                text-align: left !important;
              }
              th, td {
                border: 1px solid #cbd5e1 !important;
                padding: 6px 10px !important;
                font-size: 11px !important;
                text-align: left !important;
                vertical-align: middle !important;
              }
              th {
                background-color: #f1f5f9 !important;
                font-weight: 700 !important;
                color: #334155 !important;
              }
              th.text-right, td.text-right { text-align: right !important; }
              th.text-center, td.text-center { text-align: center !important; }
              th.text-left, td.text-left { text-align: left !important; }

              /* Typography and Color Helpers */
              .font-bold { font-weight: 700 !important; }
              .font-semibold { font-weight: 600 !important; }
              .font-medium { font-weight: 500 !important; }
              .font-extrabold { font-weight: 800 !important; }
              .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
              
              .text-xs { font-size: 12px !important; }
              .text-sm { font-size: 14px !important; }
              .text-base { font-size: 16px !important; }
              .text-lg { font-size: 18px !important; }
              .text-xl { font-size: 20px !important; }
              .text-2xl { font-size: 24px !important; }
              .text-\\[10px\\] { font-size: 10px !important; }
              .text-\\[11px\\] { font-size: 11px !important; }

              .text-emerald-700 { color: #047857 !important; }
              .text-emerald-800 { color: #065f46 !important; }
              .text-emerald-900 { color: #064e3b !important; }
              .text-emerald-950 { color: #022c22 !important; }
              .text-teal-700 { color: #0f766e !important; }
              .text-teal-800 { color: #115e59 !important; }
              .text-teal-900 { color: #134e4a !important; }
              .text-slate-400 { color: #94a3b8 !important; }
              .text-slate-500 { color: #64748b !important; }
              .text-slate-600 { color: #475569 !important; }
              .text-slate-700 { color: #334155 !important; }
              .text-slate-800 { color: #1e293b !important; }
              .text-slate-900 { color: #0f172a !important; }
              .text-rose-600 { color: #e11d48 !important; }
              .text-rose-700 { color: #be123c !important; }
              .text-rose-800 { color: #9f1239 !important; }
              
              .bg-emerald-50 { background-color: #ecfdf5 !important; }
              .bg-emerald-100 { background-color: #d1fae5 !important; }
              .bg-teal-50 { background-color: #f0fdfa !important; }
              .bg-teal-100 { background-color: #ccfbf1 !important; }
              .bg-slate-50 { background-color: #f8fafc !important; }
              .bg-slate-100 { background-color: #f1f5f9 !important; }
              .bg-white { background-color: #ffffff !important; }
              
              .border-emerald-600 { border-color: #059669 !important; }
              .border-emerald-800 { border-color: #065f46 !important; }
              .border-emerald-200 { border-color: #a7f3d0 !important; }
              .border-emerald-300 { border-color: #6ee7b7 !important; }
              .border-teal-200 { border-color: #99f6e4 !important; }
              .border-slate-200 { border-color: #e2e8f0 !important; }
              .border-slate-300 { border-color: #cbd5e1 !important; }
              .border-slate-400 { border-color: #94a3b8 !important; }
              .border-b { border-bottom-width: 1px !important; }
              .border-t { border-top-width: 1px !important; }
              .border-r { border-right-width: 1px !important; }
              .border-l { border-left-width: 1px !important; }
              .border { border-width: 1px !important; }
              .border-2 { border-width: 2px !important; }
              
              .rounded-xl { border-radius: 12px !important; }
              .rounded-lg { border-radius: 8px !important; }
              .rounded-md { border-radius: 6px !important; }
              .rounded-full { border-radius: 9999px !important; }
              .p-2 { padding: 8px !important; }
              .p-2\\.5 { padding: 10px !important; }
              .p-3 { padding: 12px !important; }
              .p-3\\.5 { padding: 14px !important; }
              .p-4 { padding: 16px !important; }
              .p-5 { padding: 20px !important; }
              .p-6 { padding: 24px !important; }
              .mb-2 { margin-bottom: 8px !important; }
              .mb-3 { margin-bottom: 12px !important; }
              .mb-4 { margin-bottom: 16px !important; }
              .mb-5 { margin-bottom: 20px !important; }
              .mt-1 { margin-top: 4px !important; }
              .mt-2 { margin-top: 8px !important; }
              .mt-3 { margin-top: 12px !important; }
              .mt-4 { margin-top: 16px !important; }

              .no-print { display: none !important; }
            </style>
          </head>
          <body>
            <div class="print-container">
              ${element.outerHTML}
            </div>
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame?.contentWindow?.focus();
          printFrame?.contentWindow?.print();
        } catch (iframeErr) {
          console.warn('Iframe print failed, falling back to window.print', iframeErr);
          window.focus();
          window.print();
        }
      }, 300);
      return;
    }
  } catch (err) {
    console.warn('Could not use iframe print, falling back to window.print', err);
  }

  // 2. Direct Window Print fallback
  window.focus();
  window.print();
}

/**
 * Open document in a dedicated new browser tab for guaranteed printing/PDF export
 */
export function openDocumentInNewTab(elementId: string, title: string = 'เอกสารใบแจ้งยอด A4'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[openDocumentInNewTab] Element #${elementId} not found.`);
    return;
  }

  const headStyles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n');

  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    // If popup blocker intervened, fallback to iframe print
    printA4Document(elementId, title);
    return;
  }

  newWindow.document.write(`
    <!DOCTYPE html>
    <html lang="th">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        ${headStyles}
        <style>
          * { box-sizing: border-box !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          html, body {
            margin: 0 !important;
            padding: 10mm 15mm;
            font-family: 'Sarabun', 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif !important;
            color: #1e293b !important;
            background: #f1f5f9;
            font-size: 12px;
            text-align: left !important;
          }
          .sheet-card {
            background: #ffffff;
            max-width: 210mm;
            margin: 0 auto;
            padding: 8mm 12mm;
            border-radius: 8px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            text-align: left !important;
          }
          @media print {
            body { background: #ffffff !important; padding: 0 !important; }
            .sheet-card { box-shadow: none !important; padding: 0 !important; border: none !important; }
            .toolbar { display: none !important; }
          }
          .toolbar {
            max-width: 210mm;
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 16px;
            border-radius: 8px;
          }
          .btn {
            background: #059669;
            color: white;
            padding: 8px 18px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 13px;
            border: none;
            cursor: pointer;
            transition: background 0.2s;
          }
          .btn:hover {
            background: #047857;
          }
          /* Layout guarantees */
          .flex { display: flex !important; }
          .inline-flex { display: inline-flex !important; }
          .flex-col { flex-direction: column !important; }
          .flex-row { flex-direction: row !important; }
          .items-center { align-items: center !important; }
          .justify-between { justify-content: space-between !important; }
          .grid { display: grid !important; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
          .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .text-center { text-align: center !important; }
          table { width: 100% !important; border-collapse: collapse !important; text-align: left !important; }
          th, td { border: 1px solid #cbd5e1 !important; padding: 6px 10px !important; font-size: 11px !important; text-align: left !important; }
          th.text-right, td.text-right { text-align: right !important; }
          th.text-center, td.text-center { text-align: center !important; }
          th.text-left, td.text-left { text-align: left !important; }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <span style="font-weight: 600; font-size: 13px;">🏛️ ศูนย์พิมพ์เอกสารทางการ ธนาคารขยะ อบต.ตาคลี</span>
          <button class="btn" onclick="window.print()">🖨️ สั่งพิมพ์เอกสารนี้ / บันทึกเป็น PDF</button>
        </div>
        <div class="sheet-card">
          ${element.outerHTML}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          };
        </script>
      </body>
    </html>
  `);
  newWindow.document.close();
}
