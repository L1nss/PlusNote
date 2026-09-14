(() => {
  'use strict';

const supabase = window.plusnoteSupabase;

let currentUser = null;
let dados = {
  modo: "nota",
  periodo: "trimestre",
  mediaNecessaria: 60,
  conceitos: [],
  materias: []
};

const modoAvaliacao = document.getElementById("modoAvaliacao");
const areaConceitos = document.getElementById("areaConceitos");
const listaConceitos = document.getElementById("listaConceitos");
const listaMaterias = document.getElementById("listaMaterias");
const totalMaterias = document.getElementById("totalMaterias");
const totalPontosGeral = document.getElementById("totalPontosGeral");
const usuarioNome = document.getElementById("usuarioNome");
const statusConfig = document.getElementById("statusConfig");
const toast = document.getElementById("toast");

const STORAGE_KEY = "PlusNote";

function numero(valor) {
  if (valor === "" || valor === null || valor === undefined) return null;
  const resultado = Number(String(valor).replace(",", "."));
  return Number.isFinite(resultado) ? resultado : null;
}

function idNovo() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapar(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function exibir(valor) {
  const n = numero(valor);
  if (n === null) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function mostrarToast(mensagem, tipo = "") {
  toast.textContent = mensagem;
  toast.className = `toast visible ${tipo}`.trim();
  clearTimeout(mostrarToast.timer);
  mostrarToast.timer = setTimeout(() => {
    toast.className = "toast";
  }, 2600);
}

function marcarStatusConfig(mensagem) {
  statusConfig.textContent = mensagem;
  clearTimeout(marcarStatusConfig.timer);
  marcarStatusConfig.timer = setTimeout(() => {
    statusConfig.textContent = "";
  }, 2200);
}

function periodoConfig() {
  if (dados.periodo === "bimestre") return { quantidade: 4, nome: "Bimestre" };
  if (dados.periodo === "semestre") return { quantidade: 2, nome: "Semestre" };
  return { quantidade: 3, nome: "Trimestre" };
}

function criarPeriodos(materia, reset = false) {
  const config = periodoConfig();
  const anteriores = reset ? [] : (materia.trimestres || []);

  materia.trimestres = Array.from({ length: config.quantidade }, (_, index) => ({
    nome: `${index + 1}º ${config.nome}`,
    valores: [anteriores[index]?.valores?.[0] ?? ""]
  }));
}

function normalizarDados() {
  if (!dados || typeof dados !== "object") dados = {};
  dados.modo = dados.modo === "conceito" ? "conceito" : "nota";
  dados.periodo = ["trimestre", "bimestre", "semestre"].includes(dados.periodo) ? dados.periodo : "trimestre";
  dados.mediaNecessaria = numero(dados.mediaNecessaria) ?? 60;
  dados.conceitos = Array.isArray(dados.conceitos) ? dados.conceitos : [];
  dados.materias = Array.isArray(dados.materias) ? dados.materias : [];

  dados.conceitos = dados.conceitos.map(c => ({
    id: c.id || idNovo(),
    nome: String(c.nome || "").trim(),
    minimo: numero(c.minimo),
    maximo: numero(c.maximo)
  })).filter(c => c.nome);

  dados.materias = dados.materias.map(m => {
    const materia = {
      id: m.id || idNovo(),
      nome: String(m.nome || "").trim(),
      trimestres: Array.isArray(m.trimestres) ? m.trimestres : []
    };
    materia.trimestres = materia.trimestres.map((p, i) => ({
      nome: p.nome || `${i + 1}º ${periodoConfig().nome}`,
      valores: [p?.valores?.[0] ?? ""]
    }));
    if (!materia.trimestres.length) criarPeriodos(materia);
    return materia;
  }).filter(m => m.nome);
}

function dadosLocais() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch {
    return null;
  }
}

function salvarLocal() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

async function carregarConta() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) {
    window.location.replace("login.html");
    return false;
  }

  currentUser = sessionData.session.user;
  usuarioNome.textContent = currentUser.user_metadata?.name || currentUser.email || "Aluno";
  return true;
}

async function carregarBanco() {
  const [settingsResult, conceptsResult, subjectsResult] = await Promise.all([
    supabase.from("settings").select("mode, period, required_points").eq("user_id", currentUser.id).maybeSingle(),
    supabase.from("concepts").select("id, name, min_value, max_value").eq("user_id", currentUser.id).order("created_at", { ascending: true }),
    supabase.from("subjects").select("id, name, created_at").eq("user_id", currentUser.id).order("created_at", { ascending: true })
  ]);

  const erro = settingsResult.error || conceptsResult.error || subjectsResult.error;
  if (erro) throw erro;

  const subjects = subjectsResult.data || [];
  const subjectIds = subjects.map(s => s.id);
  let grades = [];

  if (subjectIds.length) {
    const gradesResult = await supabase
      .from("grades")
      .select("id, subject_id, period_index, value")
      .in("subject_id", subjectIds)
      .order("period_index", { ascending: true });
    if (gradesResult.error) throw gradesResult.error;
    grades = gradesResult.data || [];
  }

  dados = {
    modo: settingsResult.data?.mode === "conceito" ? "conceito" : "nota",
    periodo: ["trimestre", "bimestre", "semestre"].includes(settingsResult.data?.period)
      ? settingsResult.data.period : "trimestre",
    mediaNecessaria: numero(settingsResult.data?.required_points) ?? 60,
    conceitos: (conceptsResult.data || []).map(c => ({
      id: c.id,
      nome: c.name,
      minimo: numero(c.min_value),
      maximo: numero(c.max_value)
    })),
    materias: subjects.map(subject => ({
      id: subject.id,
      nome: subject.name,
      trimestres: []
    }))
  };

  const mapaGrades = new Map();
  grades.forEach(g => mapaGrades.set(`${g.subject_id}:${g.period_index}`, g.value ?? ""));

  dados.materias.forEach(materia => {
    const config = periodoConfig();
    materia.trimestres = Array.from({ length: config.quantidade }, (_, index) => ({
      nome: `${index + 1}º ${config.nome}`,
      valores: [mapaGrades.get(`${materia.id}:${index}`) ?? ""]
    }));
  });

  return { possuiDados: Boolean(settingsResult.data || subjects.length || (conceptsResult.data || []).length) };
}

async function migrarDadosLocais() {
  const antigos = dadosLocais();
  if (!antigos) return false;

  const materiasAntigas = Array.isArray(antigos.materias) ? antigos.materias : [];
  const conceitosAntigos = Array.isArray(antigos.conceitos) ? antigos.conceitos : [];
  const temDados = materiasAntigas.length || conceitosAntigos.length;
  if (!temDados) return false;

  const config = {
    modo: antigos.modo === "conceito" ? "conceito" : "nota",
    periodo: ["trimestre", "bimestre", "semestre"].includes(antigos.periodo) ? antigos.periodo : "trimestre",
    mediaNecessaria: numero(antigos.mediaNecessaria) ?? 60
  };

  const settingsResult = await supabase.from("settings").upsert({
    user_id: currentUser.id,
    mode: config.modo,
    period: config.periodo,
    required_points: config.mediaNecessaria
  }, { onConflict: "user_id" });
  if (settingsResult.error) throw settingsResult.error;

  for (const conceito of conceitosAntigos.slice(0, 6)) {
    const result = await supabase.from("concepts").insert({
      user_id: currentUser.id,
      name: String(conceito.nome || "").trim(),
      min_value: numero(conceito.minimo),
      max_value: numero(conceito.maximo)
    });
    if (result.error && result.error.code !== "23505") throw result.error;
  }

  for (const antiga of materiasAntigas) {
    const subjectResult = await supabase.from("subjects").insert({
      user_id: currentUser.id,
      name: String(antiga.nome || "").trim()
    }).select("id").single();
    if (subjectResult.error) throw subjectResult.error;

    const materiaId = subjectResult.data.id;
    const periodos = Array.isArray(antiga.trimestres) ? antiga.trimestres : [];
    for (let index = 0; index < periodos.length; index++) {
      const value = periodos[index]?.valores?.[0] ?? "";
      if (value === "") continue;
      const gradeResult = await supabase.from("grades").insert({
        subject_id: materiaId,
        period_index: index,
        value: String(value)
      });
      if (gradeResult.error) throw gradeResult.error;
    }
  }

  localStorage.removeItem(STORAGE_KEY);
  mostrarToast("Dados antigos sincronizados com o banco.");
  return true;
}

async function iniciar() {
  try {
    if (!(await carregarConta())) return;

    const resultado = await carregarBanco();
    if (!resultado.possuiDados) {
      const migrou = await migrarDadosLocais();
      if (migrou) await carregarBanco();
    }

    normalizarDados();
    salvarLocal();
    renderizar();
  } catch (error) {
    console.error(error);
    const antigos = dadosLocais();
    if (antigos) {
      dados = antigos;
      normalizarDados();
      renderizar();
      mostrarToast("Banco indisponível. Exibindo os dados locais.", "warning");
    } else {
      mostrarToast("Não foi possível carregar seus dados.", "error");
    }
  }
}

async function salvarConfiguracao() {
  const payload = {
    user_id: currentUser.id,
    mode: modoAvaliacao.value,
    period: document.getElementById("tipoPeriodo").value,
    required_points: numero(document.getElementById("mediaNecessaria").value) ?? 0
  };

  const { error } = await supabase.from("settings").upsert(payload, { onConflict: "user_id" });
  if (error) {
    mostrarToast("Não foi possível salvar a configuração.", "error");
    return;
  }

  dados.modo = payload.mode;
  dados.periodo = payload.period;
  dados.mediaNecessaria = payload.required_points;
  normalizarDados();
  salvarLocal();
  renderizar();
  marcarStatusConfig("Salvo no banco");
}

async function alterarPeriodo() {
  const novoPeriodo = document.getElementById("tipoPeriodo").value;
  dados.periodo = novoPeriodo;
  dados.materias.forEach(materia => criarPeriodos(materia));

  const { error } = await supabase.from("settings").upsert({
    user_id: currentUser.id,
    mode: dados.modo,
    period: dados.periodo,
    required_points: dados.mediaNecessaria
  }, { onConflict: "user_id" });

  if (error) {
    mostrarToast("Não foi possível salvar o período.", "error");
    return;
  }

  // Os períodos que deixaram de existir são removidos do banco.
  const quantidade = periodoConfig().quantidade;
  for (const materia of dados.materias) {
    await supabase.from("grades").delete().eq("subject_id", materia.id).gte("period_index", quantidade);
    for (let i = 0; i < quantidade; i++) {
      const valor = materia.trimestres[i]?.valores?.[0] ?? "";
      await salvarNotaBanco(materia, i, valor, false);
    }
  }

  salvarLocal();
  renderizar();
}

function alterarModo() {
  dados.modo = modoAvaliacao.value;
  salvarLocal();
  renderizar();
  salvarConfiguracao();
}

function valorConceito(nome) {
  const conceito = dados.conceitos.find(c => c.nome === nome);
  if (!conceito) return null;
  const minimo = numero(conceito.minimo);
  const maximo = numero(conceito.maximo);
  if (minimo === null || maximo === null) return null;
  return (minimo + maximo) / 2;
}

function calcularMateria(materia) {
  const notas = [];
  (materia.trimestres || []).forEach(periodo => {
    const valor = periodo.valores?.[0] ?? "";
    const nota = dados.modo === "nota" ? numero(valor) : valorConceito(valor);
    if (nota !== null) notas.push(nota);
  });

  if (!notas.length) return { total: 0, texto: "Sem notas cadastradas", classe: "vazio" };

  // Regra solicitada: não existe divisão pela quantidade de avaliações.
  // A "média" do PlusNote é somente a soma das notas/conceitos convertidos.
  const total = notas.reduce((a, b) => a + b, 0);
  const falta = Math.max(0, dados.mediaNecessaria - total);

  if (total >= dados.mediaNecessaria) {
    return { total, texto: `Aprovado · Total ${exibir(total)}`, classe: "aprovado" };
  }

  return { total, texto: `Total ${exibir(total)} · Falta ${exibir(falta)}`, classe: "recuperacao" };
}

async function adicionarConceito() {
  if (dados.conceitos.length >= 6) {
    mostrarToast("Máximo de 6 conceitos.", "warning");
    return;
  }

  const nome = document.getElementById("nomeConceito").value.trim();
  const minimo = numero(document.getElementById("minimoConceito").value);
  const maximo = numero(document.getElementById("maximoConceito").value);

  if (!nome || minimo === null || maximo === null || minimo > maximo) {
    mostrarToast("Preencha o conceito e uma faixa válida.", "warning");
    return;
  }

  const { data, error } = await supabase.from("concepts").insert({
    user_id: currentUser.id,
    name: nome,
    min_value: minimo,
    max_value: maximo
  }).select("id, name, min_value, max_value").single();

  if (error) {
    mostrarToast(error.code === "23505" ? "Esse conceito já existe." : "Não foi possível salvar o conceito.", "error");
    return;
  }

  dados.conceitos.push({ id: data.id, nome: data.name, minimo: numero(data.min_value), maximo: numero(data.max_value) });
  document.getElementById("nomeConceito").value = "";
  document.getElementById("minimoConceito").value = "";
  document.getElementById("maximoConceito").value = "";
  salvarLocal();
  renderizar();
}

async function removerConceito(i) {
  const conceito = dados.conceitos[i];
  if (!conceito) return;
  if (!confirm(`Excluir o conceito "${conceito.nome}"?`)) return;

  const { error } = await supabase.from("concepts").delete().eq("id", conceito.id).eq("user_id", currentUser.id);
  if (error) {
    mostrarToast("Não foi possível excluir o conceito.", "error");
    return;
  }

  dados.conceitos.splice(i, 1);
  salvarLocal();
  renderizar();
}

async function adicionarMateria() {
  const input = document.getElementById("materia");
  const nome = input.value.trim();
  if (!nome) {
    mostrarToast("Digite o nome da matéria.", "warning");
    input.focus();
    return;
  }

  const { data, error } = await supabase.from("subjects").insert({
    user_id: currentUser.id,
    name: nome
  }).select("id, name").single();

  if (error) {
    mostrarToast("Não foi possível adicionar a matéria.", "error");
    return;
  }

  const novaMateria = { id: data.id, nome: data.name, trimestres: [] };
  criarPeriodos(novaMateria);
  dados.materias.push(novaMateria);
  input.value = "";
  salvarLocal();
  renderizar();
}

async function removerMateria(i) {
  const materia = dados.materias[i];
  if (!materia) return;
  if (!confirm(`Excluir a matéria "${materia.nome}" e todas as notas dela?`)) return;

  const { error } = await supabase.from("subjects").delete().eq("id", materia.id).eq("user_id", currentUser.id);
  if (error) {
    mostrarToast("Não foi possível excluir a matéria.", "error");
    return;
  }

  dados.materias.splice(i, 1);
  salvarLocal();
  renderizar();
}

async function salvarNotaBanco(materia, periodo, valor, mostrar = true) {
  const vazio = String(valor ?? "").trim() === "";
  let result;

  if (vazio) {
    result = await supabase.from("grades").delete().eq("subject_id", materia.id).eq("period_index", periodo);
  } else {
    result = await supabase.from("grades").upsert({
      subject_id: materia.id,
      period_index: periodo,
      value: String(valor)
    }, { onConflict: "subject_id,period_index" });
  }

  if (result.error) {
    mostrarToast("Não foi possível salvar a nota.", "error");
    return false;
  }

  if (mostrar) mostrarToast("Nota salva");
  return true;
}

async function alterarValorTrimestre(materiaIndex, periodoIndex, valor) {
  const materia = dados.materias[materiaIndex];
  if (!materia?.trimestres[periodoIndex]) return;

  if (dados.modo === "nota" && valor !== "" && numero(valor) === null) {
    mostrarToast("Digite uma nota válida.", "warning");
    renderizar();
    return;
  }

  materia.trimestres[periodoIndex].valores[0] = valor;
  salvarLocal();
  renderizar();
  await salvarNotaBanco(materia, periodoIndex, valor);
}

function renderizarConceitos() {
  listaConceitos.innerHTML = "";
  if (!dados.conceitos.length) {
    listaConceitos.innerHTML = `<div class="empty-state">Nenhum conceito cadastrado.</div>`;
    return;
  }

  dados.conceitos.forEach((c, i) => {
    listaConceitos.insertAdjacentHTML("beforeend", `
      <div class="concept-row">
        <div>
          <strong>${escapar(c.nome)}</strong>
          <span>${exibir(c.minimo)} até ${exibir(c.maximo)}</span>
        </div>
        <button class="button button-danger button-small" type="button" data-action="remove-concept" data-index="${i}">Excluir</button>
      </div>
    `);
  });
}

function renderizarMaterias() {
  listaMaterias.innerHTML = "";
  totalMaterias.textContent = dados.materias.length;

  if (!dados.materias.length) {
    totalPontosGeral.textContent = "0 pontos";
    listaMaterias.innerHTML = `
      <div class="empty-state large">
        <strong>Você ainda não cadastrou matérias.</strong>
        <span>Adicione a primeira acima para começar a acompanhar seus pontos.</span>
      </div>`;
    return;
  }

  let totalGeral = 0;

  dados.materias.forEach((materia, index) => {
    const resultado = calcularMateria(materia);
    totalGeral += resultado.total;

    const periodosHtml = materia.trimestres.map((periodo, i) => {
      let campo;
      const valor = periodo.valores?.[0] ?? "";

      if (dados.modo === "nota") {
        campo = `<input class="grade-input" type="number" min="0" step="0.01" placeholder="Nota" value="${escapar(valor)}" data-action="grade-change" data-index="${index}" data-period="${i}">`;
      } else {
        const options = dados.conceitos.map(c => `<option value="${escapar(c.nome)}" ${valor === c.nome ? "selected" : ""}>${escapar(c.nome)}</option>`).join("");
        campo = `<select class="grade-input" data-action="grade-change" data-index="${index}" data-period="${i}"><option value="">Escolha</option>${options}</select>`;
      }

      return `
        <div class="period-card">
          <span class="period-label">${escapar(periodo.nome)}</span>
          ${campo}
        </div>`;
    }).join("");

    listaMaterias.insertAdjacentHTML("beforeend", `
      <article class="subject-card">
        <div class="subject-head">
          <div>
            <span class="subject-number">${String(index + 1).padStart(2, "0")}</span>
            <h3>${escapar(materia.nome)}</h3>
          </div>
          <button class="text-button danger-text" type="button" data-action="remove-subject" data-index="${index}">Excluir</button>
        </div>
        <div class="period-grid">${periodosHtml}</div>
        <div class="result ${resultado.classe}">
          <span>${resultado.texto}</span>
          <strong>${exibir(resultado.total)}</strong>
        </div>
      </article>`);
  });

  totalPontosGeral.textContent = `${exibir(totalGeral)} ponto${totalGeral === 1 ? "" : "s"}`;
}

function renderizar() {
  modoAvaliacao.value = dados.modo;
  document.getElementById("tipoPeriodo").value = dados.periodo;
  document.getElementById("mediaNecessaria").value = dados.mediaNecessaria;
  areaConceitos.classList.toggle("oculto", dados.modo !== "conceito");
  renderizarConceitos();
  renderizarMaterias();
}

// Permite adicionar matéria e login com Enter sem precisar clicar.
document.getElementById("materia")?.addEventListener("keydown", event => {
  if (event.key === "Enter") adicionarMateria();
});

document.getElementById("mediaNecessaria")?.addEventListener("keydown", event => {
  if (event.key === "Enter") salvarConfiguracao();
});

document.getElementById("saveConfigButton")?.addEventListener("click", salvarConfiguracao);
document.getElementById("addConceptButton")?.addEventListener("click", adicionarConceito);
document.getElementById("addSubjectButton")?.addEventListener("click", adicionarMateria);
modoAvaliacao?.addEventListener("change", alterarModo);
document.getElementById("tipoPeriodo")?.addEventListener("change", alterarPeriodo);
document.getElementById("logoutButton")?.addEventListener("click", async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    mostrarToast("Não foi possível sair.", "error");
    return;
  }
  window.location.replace("login.html");
});

listaConceitos?.addEventListener("click", event => {
  const button = event.target.closest('[data-action="remove-concept"]');
  if (!button) return;
  removerConceito(Number(button.dataset.index));
});

listaMaterias?.addEventListener("click", event => {
  const button = event.target.closest('[data-action="remove-subject"]');
  if (!button) return;
  removerMateria(Number(button.dataset.index));
});

listaMaterias?.addEventListener("change", event => {
  const field = event.target.closest('[data-action="grade-change"]');
  if (!field) return;
  alterarValorTrimestre(Number(field.dataset.index), Number(field.dataset.period), field.value);
});

iniciar();

})();
