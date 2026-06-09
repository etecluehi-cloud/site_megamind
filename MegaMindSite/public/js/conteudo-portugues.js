// ═══════════════════════════════════════════════════════════════════
//  js/conteudo-portugues.js  –  Megamind
//  Back-end da tela de conteúdos de Português.
//  Espelha exatamente a lógica de TelaSecaoConteudoPort.java
//  e DetalhesVideos.java do app Android.
// ═══════════════════════════════════════════════════════════════════

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import { getAuth, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { getFirestore, doc, getDoc, collection, getDocs, setDoc }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey:            "AIzaSyAXoLRatnIuZSEXYENjFGWgloV3-xaDf9Q",
    authDomain:        "megamindapp-4e60c.firebaseapp.com",
    projectId:         "megamindapp-4e60c",
    storageBucket:     "megamindapp-4e60c.firebasestorage.app",
    messagingSenderId: "114881660257",
    appId:             "1:114881660257:web:d0b6ae935486429bfb3120"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── IDs dos conteúdos — espelham TelaSecaoConteudoPort.java ───────
const CONTEUDOS = [
    { id: "leitura_interpretacao",  label: "Leitura e Interpretação", icon: "📖", desc: "Compreensão e análise de textos"           },
    { id: "generos_textuais",       label: "Gêneros Textuais",        icon: "📝", desc: "Tipos e estruturas dos gêneros textuais"  },
    { id: "variacao_linguistica",   label: "Variação Linguística",    icon: "🗣️", desc: "Diversidade e uso da língua portuguesa"   },
    { id: "gramatica",              label: "Gramática",               icon: "Aa", desc: "Morfologia, sintaxe e ortografia"         },
    { id: "coesao_coerencia",       label: "Coesão e Coerência",      icon: "🔗", desc: "Articulação e unidade textual"            },
    { id: "figuras_linguagem",      label: "Figuras de Linguagem",    icon: "✨", desc: "Recursos expressivos da língua"           },
    { id: "literatura",             label: "Literatura",              icon: "📚", desc: "Movimentos literários e obras clássicas"  }
];

let currentUser = null;

// ── Auth ──────────────────────────────────────────────────────────
onAuthStateChanged(auth, user => {
    if (!user) { window.location.href = "index.html"; return; }
    currentUser = user;
    renderCards();
});

// ── Renderiza os cards ────────────────────────────────────────────
function renderCards() {
    const grade = document.getElementById("grade-conteudos");
    grade.innerHTML = "";

    CONTEUDOS.forEach(c => {
        const card = document.createElement("div");
        card.className  = "card-conteudo";
        card.dataset.id = c.id;
        card.innerHTML  = `
            <div class="card-icon">${c.icon}</div>
            <div class="card-body">
                <h3>${c.label}</h3>
                <p>${c.desc}</p>
                <div class="progress-wrap">
                    <div class="progress-bar" id="bar-${c.id}"></div>
                </div>
                <span class="progress-label" id="lbl-${c.id}">Carregando…</span>
            </div>
        `;
        card.addEventListener("click", () => abrirModal(c.id, c.label));
        grade.appendChild(card);
        carregarProgressoCard(c.id);
    });
}

// ── Progresso do card ─────────────────────────────────────────────
async function carregarProgressoCard(conteudoId) {
    try {
        const conteudoSnap = await getDoc(doc(db, "conteudo", conteudoId));
        if (!conteudoSnap.exists()) { atualizarLabelCard(conteudoId, 0, 0); return; }

        const data  = conteudoSnap.data();
        const v1    = data.videoId1 || data.videoId || "";
        const v2    = data.videoId2 || "";
        const v3    = data.videoId3 || "";
        const total = [v1, v2, v3].filter(Boolean).length;

        const progressSnap = await getDocs(
            collection(db, "progresso_videos", currentUser.uid, conteudoId)
        );
        let vistos = 0;
        progressSnap.forEach(d => { if (d.data().visto === true) vistos++; });

        atualizarLabelCard(conteudoId, vistos, total);
    } catch (err) {
        console.warn("[Megamind] Progresso não carregado para:", conteudoId, err);
    }
}

function atualizarLabelCard(conteudoId, vistos, total) {
    const pct = total > 0 ? Math.round((vistos / total) * 100) : 0;
    const bar = document.getElementById(`bar-${conteudoId}`);
    const lbl = document.getElementById(`lbl-${conteudoId}`);
    if (bar) bar.style.width = pct + "%";
    if (lbl) lbl.textContent = total > 0
        ? `${vistos} de ${total} vídeos · ${pct}%`
        : "Sem vídeos cadastrados";
}

// ── Modal de vídeos ───────────────────────────────────────────────
async function abrirModal(conteudoId, titulo) {
    const modal   = document.getElementById("modal");
    const overlay = document.getElementById("modal-overlay");
    const mTitulo = document.getElementById("modal-titulo");
    const mResumo = document.getElementById("modal-resumo");
    const mVideos = document.getElementById("modal-videos");
    const mBtn    = document.getElementById("modal-btn-questoes");

    mTitulo.textContent = titulo;
    mResumo.textContent = "Carregando…";
    mVideos.innerHTML   = "<p class='modal-loading'>Buscando vídeos…</p>";
    mBtn.disabled       = true;

    modal.classList.add("open");
    overlay.style.opacity       = "1";
    overlay.style.pointerEvents = "auto";
    document.body.style.overflow = "hidden";

    try {
        const snap = await getDoc(doc(db, "conteudo", conteudoId));
        if (!snap.exists()) { mResumo.textContent = "Conteúdo não encontrado."; return; }

        const data = snap.data();
        mResumo.textContent = data.resumo || "";

        const v1 = data.videoId1 || data.videoId || "";
        const v2 = data.videoId2 || "";
        const v3 = data.videoId3 || "";
        const videoIds = [v1, v2, v3].filter(Boolean);

        if (videoIds.length === 0) {
            mVideos.innerHTML = "<p class='modal-loading'>Nenhum vídeo cadastrado ainda.</p>";
            return;
        }

        const progressSnap = await getDocs(
            collection(db, "progresso_videos", currentUser.uid, conteudoId)
        );
        const progressoMap = {};
        progressSnap.forEach(d => { progressoMap[d.id] = d.data().visto === true; });

        mVideos.innerHTML = "";
        const KEYS = ["video1", "video2", "video3"];

        videoIds.forEach((videoId, i) => {
            const key   = KEYS[i];
            const visto = progressoMap[key] || false;
            const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

            const item = document.createElement("div");
            item.className   = "video-item" + (visto ? " visto" : "");
            item.dataset.key = key;
            item.innerHTML   = `
                <div class="video-thumb-wrap">
                    <img class="video-thumb" src="${thumb}" alt="Thumbnail vídeo ${i+1}" loading="lazy">
                    <div class="video-play-overlay">
                        <svg viewBox="0 0 24 24" width="40" height="40">
                            <circle cx="12" cy="12" r="12" fill="rgba(0,0,0,0.55)"/>
                            <polygon points="10,8 18,12 10,16" fill="white"/>
                        </svg>
                    </div>
                </div>
                <div class="video-info">
                    <span class="video-num">Vídeo ${i+1}</span>
                    <label class="check-wrap">
                        <input type="checkbox" class="video-check" data-key="${key}" ${visto ? "checked" : ""}>
                        <span class="check-label">${visto ? "Assistido ✓" : "Marcar como visto"}</span>
                    </label>
                </div>
            `;

            item.querySelector(".video-thumb-wrap").addEventListener("click", () => {
                window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
                const cb = item.querySelector(".video-check");
                if (!cb.checked) {
                    cb.checked = true;
                    salvarProgresso(conteudoId, key, true);
                    item.classList.add("visto");
                    cb.nextElementSibling.textContent = "Assistido ✓";
                    verificarBotaoQuestoes(videoIds.length);
                    carregarProgressoCard(conteudoId);
                }
            });

            item.querySelector(".video-check").addEventListener("change", e => {
                const checked = e.target.checked;
                salvarProgresso(conteudoId, key, checked);
                item.classList.toggle("visto", checked);
                e.target.nextElementSibling.textContent = checked ? "Assistido ✓" : "Marcar como visto";
                verificarBotaoQuestoes(videoIds.length);
                carregarProgressoCard(conteudoId);
            });

            mVideos.appendChild(item);
        });

        verificarBotaoQuestoes(videoIds.length);

        mBtn.onclick = () => {
            window.location.href = `questoes.html?conteudoId=${conteudoId}`;
        };

    } catch (err) {
        mResumo.textContent = "Erro ao carregar conteúdo. Tente novamente.";
        console.error("[Megamind] Erro no modal:", err);
    }
}

function verificarBotaoQuestoes(totalVideos) {
    const checks      = document.querySelectorAll("#modal-videos .video-check");
    const todosVistos = Array.from(checks).every(c => c.checked);
    const btn         = document.getElementById("modal-btn-questoes");
    btn.disabled      = !(todosVistos && totalVideos > 0);
}

async function salvarProgresso(conteudoId, videoKey, visto) {
    try {
        await setDoc(
            doc(db, "progresso_videos", currentUser.uid, conteudoId, videoKey),
            { visto }
        );
    } catch (err) {
        console.error("[Megamind] Erro ao salvar progresso:", err);
    }
}

// ── Fechar modal ──────────────────────────────────────────────────
function fecharModal() {
    const modal   = document.getElementById("modal");
    const overlay = document.getElementById("modal-overlay");
    modal.classList.remove("open");
    overlay.style.opacity       = "0";
    overlay.style.pointerEvents = "none";
    document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("modal-fechar").addEventListener("click", fecharModal);
    document.getElementById("modal-overlay").addEventListener("click", fecharModal);
    document.addEventListener("keydown", e => { if (e.key === "Escape") fecharModal(); });
});