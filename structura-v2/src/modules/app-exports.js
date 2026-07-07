(function initStructuraExports(root, factory) {
  const api = factory(root);
  root.StructuraExports = api;
  root.exportCSV = api.exportCSV;
  root.exportXLSX = api.exportXLSX;
  root.downloadPitchPPTX = api.downloadPitchPPTX;
  root.downloadPitchPDF = api.downloadPitchPDF;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(
  typeof globalThis !== "undefined" ? globalThis : this,
  function createStructuraExports(root) {
    const state = root.StructuraAppState || {};

    function scopedProducts() {
      if (typeof state.productsForScope === "function") return state.productsForScope();
      return typeof state.activeProducts === "function" ? state.activeProducts() : [];
    }

    function notify(message, type) {
      if (typeof root.notify === "function") root.notify(message, type);
    }

    function exportCSV() {
      const header = [
        "Nom",
        "ISIN",
        "Client",
        "Type",
        "Émetteur",
        "Nominal",
        "Valorisation",
        "P&L",
        "Coupon",
        "TRI",
        "Barrière%",
        "Distance",
        "Maturité",
        "Statut",
      ];
      const rows = scopedProducts().map((product) => [
        product.name,
        product.isin,
        state.getClientLabel?.(product.clientId) || "Non assigné",
        state.TYPE_NAMES?.[product.type] || product.type,
        product.emetteur,
        product.nominal,
        product.val,
        product.pnl,
        product.coupon,
        product.tri,
        product.barrier != null ? product.barrier : "N/A",
        product.dist != null ? Number(product.dist).toFixed(1) : "N/A",
        product.maturity,
        (product.st || { label: "N/A" }).label,
      ]);
      const csv = [header, ...rows]
        .map((row) => row.map((value) => `"${value}"`).join(","))
        .join("\n");
      const anchor = document.createElement("a");
      anchor.href =
        "data:text/csv;charset=utf-8,\uFEFF" + encodeURIComponent(csv);
      anchor.download =
        "structura_portefeuille_" +
        new Date().toISOString().slice(0, 10) +
        ".csv";
      anchor.click();
      notify("Export CSV généré", "ok");
    }

    function exportXLSX() {
      if (typeof root.XLSX === "undefined") {
        notify("Bibliothèque Excel non chargée", "err");
        return;
      }
      const rows = scopedProducts().map((product) => ({
        Nom: product.name,
        ISIN: product.isin,
        Client: state.getClientLabel?.(product.clientId) || "Non assigné",
        Type: state.TYPE_NAMES?.[product.type],
        Emetteur: product.emetteur,
        Nominal: product.nominal,
        Valorisation: product.val,
        PnL: product.pnl,
        Coupon: product.coupon,
        TRI: product.tri,
        BarrierePct: product.barrier,
        DistancePct:
          product.dist != null ? Number(Number(product.dist).toFixed(1)) : null,
        Maturite: product.maturity,
        Statut: (product.st || { label: "N/A" }).label,
      }));
      const worksheet = root.XLSX.utils.json_to_sheet(rows);
      const workbook = root.XLSX.utils.book_new();
      root.XLSX.utils.book_append_sheet(workbook, worksheet, "Portefeuille");
      root.XLSX.writeFile(
        workbook,
        `structura_portefeuille_${state.isoDate(new Date())}.xlsx`,
      );
      notify("Export Excel généré", "ok");
    }

    function downloadPitchPPTX() {
      const generatedPitch = state.runtime?.generatedPitch;
      if (!generatedPitch) {
        notify("Générez d’abord un pitch", "err");
        return;
      }
      if (typeof root.PptxGenJS === "undefined") {
        notify("Librairie PPTX non chargée", "err");
        return;
      }
      const pitchInput = root.getPitchInput?.();
      if (!pitchInput) {
        notify("Module Pitch Engine indisponible", "err");
        return;
      }
      const pptx = new root.PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";
      pptx.author = "Structura Pro";
      const slides = [
        { t: generatedPitch.tagline, b: generatedPitch.subtitle },
        { t: "Executive Summary", b: generatedPitch.executiveSummary },
        {
          t: "Mécanique Produit",
          b: (generatedPitch.howItWorks || []).map((x) => `• ${x}`).join("\n"),
        },
        {
          t: "Scénarios",
          b: `${generatedPitch.scenarios?.bull?.label}: ${generatedPitch.scenarios?.bull?.returnStr}\n${generatedPitch.scenarios?.base?.label}: ${generatedPitch.scenarios?.base?.returnStr}\n${generatedPitch.scenarios?.bear?.label}: ${generatedPitch.scenarios?.bear?.returnStr}`,
        },
        {
          t: "Risques",
          b: (generatedPitch.risks || [])
            .map((risk) => `• ${risk.risk} (${risk.level}) - ${risk.desc}`)
            .join("\n"),
        },
        {
          t: "Pourquoi Maintenant",
          b: (generatedPitch.whyNow || []).map((x) => `• ${x}`).join("\n"),
        },
        { t: generatedPitch.ctaTitle, b: generatedPitch.ctaBody },
        { t: "Disclaimer", b: generatedPitch.disclaimer },
      ];
      slides.forEach((slide, index) => {
        const currentSlide = pptx.addSlide();
        currentSlide.background = {
          color: index === 0 ? "FBF5ED" : "FFF9F2",
        };
        currentSlide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 13.333,
          h: 0.55,
          fill: { color: "E8EEF0" },
          line: { color: "E8EEF0" },
        });
        currentSlide.addText("STRUCTURA PRO", {
          x: 0.45,
          y: 0.12,
          w: 4,
          h: 0.3,
          fontSize: 11,
          bold: true,
          color: "C9984D",
        });
        currentSlide.addText(
          `${pitchInput.client} | ${pitchInput.underlying}`,
          {
            x: 9.1,
            y: 0.13,
            w: 4,
            h: 0.3,
            fontSize: 9,
            color: "8D7A69",
            align: "right",
          },
        );
        currentSlide.addText(slide.t, {
          x: 0.7,
          y: 0.95,
          w: 12,
          h: 0.75,
          fontSize: 26,
          bold: true,
          color: "22313B",
        });
        currentSlide.addShape(pptx.ShapeType.line, {
          x: 0.7,
          y: 1.75,
          w: 4.6,
          h: 0,
          line: { color: "378FA1", pt: 1.6 },
        });
        currentSlide.addText(slide.b, {
          x: 0.7,
          y: 2.0,
          w: 12,
          h: 4.6,
          fontSize: 13,
          color: "556674",
          breakLine: true,
        });
        currentSlide.addText(
          `${pitchInput.type} | ${state.isoDate(new Date())}`,
          {
            x: 0.7,
            y: 6.95,
            w: 12,
            h: 0.3,
            fontSize: 9,
            color: "9A836D",
          },
        );
      });
      pptx.writeFile({
        fileName: `pitch_${pitchInput.underlying.replace(/\s+/g, "_")}_${state.isoDate(new Date())}.pptx`,
      });
    }

    function downloadPitchPDF() {
      const generatedPitch = state.runtime?.generatedPitch;
      if (!generatedPitch) {
        notify("Générez d’abord un pitch", "err");
        return;
      }
      if (!root.window?.jspdf || !root.window.jspdf.jsPDF) {
        notify("Librairie PDF non chargée", "err");
        return;
      }
      const pitchInput = root.getPitchInput?.();
      if (!pitchInput) {
        notify("Module Pitch Engine indisponible", "err");
        return;
      }
      const doc = new root.window.jspdf.jsPDF({ unit: "pt", format: "a4" });
      const pages = [
        { t: generatedPitch.tagline, b: generatedPitch.subtitle },
        { t: "Executive Summary", b: generatedPitch.executiveSummary },
        {
          t: "Mécanique Produit",
          b: (generatedPitch.howItWorks || []).map((x) => `• ${x}`).join("\n"),
        },
        {
          t: "Scénarios",
          b: `${generatedPitch.scenarios?.bull?.label}: ${generatedPitch.scenarios?.bull?.returnStr}\n${generatedPitch.scenarios?.base?.label}: ${generatedPitch.scenarios?.base?.returnStr}\n${generatedPitch.scenarios?.bear?.label}: ${generatedPitch.scenarios?.bear?.returnStr}`,
        },
        {
          t: "Risques",
          b: (generatedPitch.risks || [])
            .map((risk) => `• ${risk.risk} (${risk.level}) - ${risk.desc}`)
            .join("\n"),
        },
        {
          t: generatedPitch.ctaTitle,
          b: generatedPitch.ctaBody + "\n\n" + generatedPitch.disclaimer,
        },
      ];
      pages.forEach((page, index) => {
        if (index > 0) doc.addPage();
        doc.setFillColor(255, 249, 242);
        doc.rect(0, 0, 595, 842, "F");
        doc.setFillColor(232, 238, 240);
        doc.rect(0, 0, 595, 34, "F");
        doc.setTextColor(201, 152, 77);
        doc.setFontSize(11);
        doc.text("STRUCTURA PRO", 24, 22);
        doc.setTextColor(154, 131, 109);
        doc.setFontSize(9);
        doc.text(`${pitchInput.client} | ${pitchInput.underlying}`, 575, 22, {
          align: "right",
        });
        doc.setTextColor(34, 49, 59);
        doc.setFontSize(26);
        doc.text(page.t, 36, 92, { maxWidth: 520 });
        doc.setDrawColor(55, 143, 161);
        doc.line(36, 102, 170, 102);
        doc.setTextColor(85, 102, 116);
        doc.setFontSize(12);
        doc.text(page.b, 36, 130, { maxWidth: 520 });
        doc.setTextColor(154, 131, 109);
        doc.setFontSize(9);
        doc.text(`${pitchInput.type} | ${state.isoDate(new Date())}`, 36, 816);
      });
      doc.save(
        `pitch_${pitchInput.underlying.replace(/\s+/g, "_")}_${state.isoDate(new Date())}.pdf`,
      );
    }

    return {
      exportCSV,
      exportXLSX,
      downloadPitchPPTX,
      downloadPitchPDF,
    };
  },
);
