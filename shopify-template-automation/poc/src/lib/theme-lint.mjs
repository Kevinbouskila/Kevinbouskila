// Pre-validation locale : JSON des templates et blocs {% schema %}.
// Ne remplace pas `shopify theme check` ni la Lighthouse CI Action, mais
// attrape en quelques millisecondes les erreurs qui font echouer un push.
export function lintTheme(files) {
  const errors = [];
  for (const [path, content] of Object.entries(files)) {
    if (path.endsWith('.json')) {
      try { JSON.parse(content); } catch (e) { errors.push(path + ' : JSON invalide — ' + e.message); }
    }
    if (path.endsWith('.liquid')) {
      const m = /\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/.exec(content);
      if (path.startsWith('sections/') && !m) errors.push(path + ' : section sans bloc {% schema %}');
      if (m) {
        try { JSON.parse(m[1]); } catch (e) { errors.push(path + ' : schema JSON invalide — ' + e.message); }
      }
    }
  }
  for (const required of ['layout/theme.liquid', 'config/settings_schema.json', 'locales/en.default.json']) {
    if (!files[required]) errors.push('fichier requis manquant : ' + required);
  }
  return errors;
}
