// Estudo de caso: tema claro/escuro, índice que acompanha a leitura, barra de progresso e entrada suave das seções.
(() => {
  const raiz = document.documentElement;
  // Mesma chave de tema do painel: a escolha vale nas duas páginas.
  try { const tema = localStorage.getItem("dc-tema"); if (tema) raiz.dataset.theme = tema; } catch { /* sem armazenamento */ }
  const botao = document.getElementById("tema");
  const escuroAgora = () => (raiz.dataset.theme ? raiz.dataset.theme === "dark" : !matchMedia("(prefers-color-scheme: light)").matches);
  const icone = () => { botao.textContent = escuroAgora() ? "☀" : "☾"; botao.title = escuroAgora() ? "Tema claro" : "Tema escuro"; };
  icone();
  botao.addEventListener("click", () => {
    raiz.dataset.theme = escuroAgora() ? "light" : "dark";
    try { localStorage.setItem("dc-tema", raiz.dataset.theme); } catch { /* sem armazenamento */ }
    icone();
  });

  // Barra de progresso de leitura.
  const barra = document.querySelector(".progresso");
  const progresso = () => { const max = document.body.scrollHeight - innerHeight; barra.style.width = `${max > 0 ? (scrollY / max) * 100 : 0}%`; };
  addEventListener("scroll", progresso, { passive: true });
  progresso();

  // Índice: marca o capítulo que está na tela.
  const links = new Map([...document.querySelectorAll(".indice a")].map((a) => [a.getAttribute("href").slice(1), a]));
  const visiveis = new Set();
  const espia = new IntersectionObserver((entradas) => {
    for (const e of entradas) e.isIntersecting ? visiveis.add(e.target.id) : visiveis.delete(e.target.id);
    const atual = [...links.keys()].find((id) => visiveis.has(id));
    if (atual) links.forEach((a, id) => a.classList.toggle("ativo", id === atual));
  }, { rootMargin: "-20% 0px -60% 0px" });
  document.querySelectorAll(".capitulo[id]").forEach((s) => espia.observe(s));

  // Entrada suave dos blocos.
  const revelar = new IntersectionObserver((entradas) => {
    for (const e of entradas) if (e.isIntersecting) { e.target.classList.add("visivel"); revelar.unobserve(e.target); }
  }, { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".revelar").forEach((el) => revelar.observe(el));
})();
