const form = document.getElementById("cadastroForm");
const status = document.getElementById("authStatus");
const button = document.getElementById("cadastroButton");

function mostrarStatus(mensagem, tipo = "") {
  status.textContent = mensagem;
  status.className = `auth-status ${tipo}`.trim();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  button.disabled = true;
  button.textContent = "Criando…";
  mostrarStatus("");

  const nome = document.getElementById("nome").value.trim();
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  const { data, error } = await window.plusnoteSupabase.auth.signUp({
    email,
    password: senha,
    options: { data: { name: nome } }
  });

  if (error) {
    mostrarStatus(error.message || "Não foi possível criar a conta.", "error");
    button.disabled = false;
    button.textContent = "Criar conta";
    return;
  }

  // O projeto deve estar configurado no Supabase com confirmação de email desativada.
  if (data.session) {
    window.location.replace("index.html");
    return;
  }

  mostrarStatus("Conta criada. Se o Supabase ainda exigir confirmação, desative 'Confirm email' nas configurações de Auth.", "warning");
  button.disabled = false;
  button.textContent = "Criar conta";
});
