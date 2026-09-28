function replacePlaceholders(text, data) {
  return String(text || "")
    .replaceAll("{{clientName}}", data.clientName || "")
    .replaceAll("{{advisorName}}", data.advisorName || "")
    .replaceAll("{{brokerageName}}", data.brokerageName || "")
    .replaceAll("{{leadName}}", data.leadName || "");
}

module.exports = replacePlaceholders;
