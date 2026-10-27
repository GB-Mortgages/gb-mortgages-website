const markdownIt = require("markdown-it");

const md = markdownIt({ html: false, linkify: true, breaks: false });

// Opens external links in a new tab.
const defaultLink = md.renderer.rules.link_open || ((t, i, o, e, s) => s.renderToken(t, i, o));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet("href") || "";
  if (/^https?:\/\//.test(href)) {
    tokens[idx].attrSet("target", "_blank");
    tokens[idx].attrSet("rel", "noreferrer");
  }
  return defaultLink(tokens, idx, options, env, self);
};

const escapeHtml = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Text in [square brackets] shows highlighted as a placeholder.
const placeholders = (html) => html.replace(/\[([^\]]+)\]/g, '<span class="ph">[$1]</span>');

module.exports = function (eleventyConfig) {
  eleventyConfig.setNunjucksEnvironmentOptions({ autoescape: true });
  eleventyConfig.addPassthroughCopy({ "src/images": "images" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/assets/site.js": "assets/site.js" });
  eleventyConfig.addPassthroughCopy({ "src/robots.txt": "robots.txt" });

  // Plain text field: escaped, placeholders highlighted.
  eleventyConfig.addFilter("t", (s) => placeholders(escapeHtml(s)));
  // Rich text field (markdown): bold, links and bullet lists.
  eleventyConfig.addFilter("md", (s) => placeholders(md.render(String(s ?? ""))));
  eleventyConfig.addFilter("pad2", (n) => String(n).padStart(2, "0"));
  eleventyConfig.addFilter("json", (v) => JSON.stringify(v));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk"],
    htmlTemplateEngine: "njk"
  };
};
