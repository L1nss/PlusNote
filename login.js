const form = document.getElementById("loginForm");
const status = document.getElementById("authStatus");
const button = document.getElementById("loginButton");

function mostrarStatus(mensagem, tipo = "") {
  status.textContent = mensagem;
  status.className = `auth-status ${tipo}`.trim();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  button.textContent = "Entrando…";
  mostrarStatus("");

  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  const { error } = await window.plusnoteSupabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    mostrarStatus("Email ou senha incorretos.", "error");
    button.disabled = false;
    button.textContent = "Entrar";
    return;
  }

  window.location.replace("index.html");
});
