import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getAuth, confirmPasswordReset } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const params = new URLSearchParams(window.location.search);
const oobCode = params.get("oobCode");

// ─────────────────────────────────────────────────────
//  VERIFICADOR DE FORÇA DE SENHA
// ─────────────────────────────────────────────────────
window.verificarSenha = function () {
  const senha     = document.getElementById("newPassword").value;
  const container = document.getElementById("forcaContainer");

  if (!container) return;

  container.style.display = senha.length > 0 ? "block" : "none";

  const criterios = {
    tamanho:   senha.length >= 8,
    maiuscula: /[A-Z]/.test(senha),
    numero:    /[0-9]/.test(senha),
    simbolo:   /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)
  };

  atualizarCriterio("c-tamanho",   criterios.tamanho,   "Mínimo 8 caracteres");
  atualizarCriterio("c-maiuscula", criterios.maiuscula, "Uma letra maiúscula");
  atualizarCriterio("c-numero",    criterios.numero,    "Um número");
  atualizarCriterio("c-simbolo",   criterios.simbolo,   "Um símbolo (!@#$...)");

  const pontos = Object.values(criterios).filter(Boolean).length;

  const cores  = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71"];
  const labels = ["Fraca", "Razoável", "Boa", "Forte"];
  const barras = ["barra1", "barra2", "barra3", "barra4"];

  barras.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.style.background = i < pontos ? cores[pontos - 1] : "#ddd";
  });

  const label = document.getElementById("forcaLabel");
  if (label) {
    label.textContent = pontos > 0 ? labels[pontos - 1] : "";
    label.style.color = pontos > 0 ? cores[pontos - 1] : "";
  }
};

function atualizarCriterio(id, ok, texto) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = (ok ? "✓ " : "✗ ") + texto;
  el.classList.toggle("ok", ok);
}

function senhaEhForte(senha) {
  return (
    senha.length >= 8 &&
    /[A-Z]/.test(senha) &&
    /[0-9]/.test(senha) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)
  );
}

// ─────────────────────────────────────────────────────
//  BOTÃO SALVAR — valida força antes de confirmar reset
// ─────────────────────────────────────────────────────
document.getElementById("btnReset").addEventListener("click", async () => {
  const senha = document.getElementById("newPassword").value;

  if (!senhaEhForte(senha)) {
    alert("Crie uma senha mais forte seguindo os critérios indicados.");
    return;
  }

  if (!oobCode) {
    alert("Link inválido ou expirado. Solicite um novo link de recuperação.");
    return;
  }

  try {
    await confirmPasswordReset(auth, oobCode, senha);
    alert("Senha alterada com sucesso!");
    window.location.href = "index.html";
  } catch (erro) {
    console.error("Erro ao redefinir senha:", erro);

    if (erro.code === "auth/expired-action-code") {
      alert("O link expirou. Solicite um novo e-mail de recuperação.");
    } else if (erro.code === "auth/invalid-action-code") {
      alert("Link inválido. Solicite um novo e-mail de recuperação.");
    } else if (erro.code === "auth/weak-password") {
      alert("Senha fraca. Use os critérios indicados.");
    } else {
      alert("Erro: " + erro.message);
    }
  }
});

// ─────────────────────────────────────────────────────
//  TOGGLE VISIBILIDADE DA SENHA
// ─────────────────────────────────────────────────────
window.toggleSenha = function () {
  const input  = document.getElementById("newPassword");
  const icone  = document.getElementById("IconeSenha");
  const visivel = input.type === "password";

  input.type = visivel ? "text" : "password";
  if (icone) icone.src = visivel ? "../img/visivel.png" : "../img/invisivel.png";
};