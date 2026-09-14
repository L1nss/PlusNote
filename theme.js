(() => {
  "use strict";

  function iniciarTema() {
    const botaoTema = document.getElementById("themeToggle");
    const temaAtual = localStorage.getItem("tema") || "light";

    if (temaAtual === "dark") document.body.classList.add("dark");

    function atualizarIcone() {
      if (!botaoTema) return;
      const escuro = document.body.classList.contains("dark");
      botaoTema.textContent = escuro ? "☀" : "☾";
      botaoTema.setAttribute("aria-label", escuro ? "Ativar tema claro" : "Ativar tema escuro");
    }

    atualizarIcone();

    botaoTema?.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
      atualizarIcone();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarTema, { once: true });
  } else {
    iniciarTema();
  }
})();
