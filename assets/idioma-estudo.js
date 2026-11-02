// Idioma do estudo de caso: português na raiz, inglês em en/ e espanhol em es/.
// A escolha é a mesma da Vitrine (mesma chave no mesmo domínio): quem lê em inglês continua em inglês.
(() => {
  const CHAVE = "vitrine-idioma";
  const IDIOMAS = ["pt", "en", "es"];
  const valido = (v) => (IDIOMAS.includes(v) ? v : null);
  const guardar = (v) => { try { localStorage.setItem(CHAVE, v); } catch { /* sem armazenamento */ } };

  const doLink = valido(new URLSearchParams(location.search).get("lang"));
  if (doLink) guardar(doLink);

  // Só a página em português (a porta de entrada) redireciona; en/ e es/ abertos por link ficam onde estão.
  if (document.documentElement.lang.startsWith("pt")) {
    let salvo = null;
    try { salvo = localStorage.getItem(CHAVE); } catch { /* sem armazenamento */ }
    // Navegador em outro idioma (francês, alemão...) abre em inglês, como na Vitrine.
    const doNavegador = (navigator.language || "pt").slice(0, 2).toLowerCase();
    const preferido = doLink || valido(salvo) || valido(doNavegador) || "en";
    if (preferido !== "pt") {
      const raiz = location.pathname.replace(/index\.html$/, "");
      location.replace(`${raiz}${preferido}/${location.hash}`);
      return;
    }
  }

  // Trocar de idioma pelo seletor: guarda a escolha e mantém o capítulo que estava na tela.
  document.addEventListener("click", (e) => {
    const link = e.target.closest(".idiomas a[data-idioma]");
    if (!link) return;
    guardar(link.dataset.idioma);
    if (location.hash) link.href = link.href.split("#")[0] + location.hash;
  });
})();
