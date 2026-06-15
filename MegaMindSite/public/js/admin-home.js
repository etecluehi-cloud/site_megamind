const adminHomeFirebaseConfig = {
  apiKey: "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
  authDomain: "megamindapp-4e60c.firebaseapp.com",
  projectId: "megamindapp-4e60c",
  storageBucket: "megamindapp-4e60c.firebasestorage.app",
  messagingSenderId: "114881660257",
  appId: "1:114881660257:web:d0b6ae935486429bfb3120"
};

if (window.firebase && !firebase.apps.length) {
  firebase.initializeApp(adminHomeFirebaseConfig);
}

const adminHomeAuth = firebase.auth();
const adminHomeDb = firebase.firestore();

function setHomeText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

async function contarQuestoesHome() {
  let total = 0;
  for (const colecao of ["questoes_matematica", "questoes_portugues"]) {
    const snapshot = await adminHomeDb.collection(colecao).get();
    snapshot.forEach((doc) => {
      const dados = doc.data();
      if (Array.isArray(dados.questoes)) total += dados.questoes.length;
    });
  }
  return total;
}

async function carregarResumoHome(user) {
  try {
    const userDoc = await adminHomeDb.collection("usuarios").doc(user.uid).get();
    const dadosAdmin = userDoc.exists ? userDoc.data() : {};
    const nome = dadosAdmin.nome || user.email || "Administrador";
    setHomeText("nome-admin-home", nome.split(" ")[0]);
    setHomeText("home-status-admin", `Acesso confirmado para ${nome}.`);

    const usuariosSnap = await adminHomeDb.collection("usuarios").get();
    let alunosAtivos = 0;
    let bloqueados = 0;
    usuariosSnap.forEach((doc) => {
      const dados = doc.data();
      if (dados.admin === true || dados.tipo === "admin") return;
      if ((dados.status || "ativo") === "bloqueado") bloqueados++;
      if ((dados.status || "ativo") === "ativo") alunosAtivos++;
    });

    const conteudosSnap = await adminHomeDb.collection("conteudo").get();
    const totalQuestoes = await contarQuestoesHome();

    setHomeText("home-alunos-ativos", alunosAtivos);
    setHomeText("home-bloqueados", bloqueados);
    setHomeText("home-conteudos", conteudosSnap.size);
    setHomeText("home-questoes", totalQuestoes);
  } catch (error) {
    console.error("Erro ao carregar resumo ADM:", error);
    setHomeText("home-status-admin", "Não foi possível carregar o resumo agora.");
  }
}

adminHomeAuth.onAuthStateChanged((user) => {
  if (user) carregarResumoHome(user);
});
