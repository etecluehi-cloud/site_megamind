import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs
}
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {

    if (!user) return;

    let totalVideos = 0;
    let videosAssistidos = 0;

    const conteudos = await getDocs(
        collection(db, "progresso_videos", user.uid)
    );

    for (const conteudo of conteudos.docs) {

        const videos = await getDocs(
            collection(
                db,
                "progresso_videos",
                user.uid,
                conteudo.id
            )
        );

        videos.forEach(video => {

            totalVideos++;

            if (video.data().visto === true) {
                videosAssistidos++;
            }

        });
    }

    const porcentagem =
        totalVideos > 0
        ? Math.round((videosAssistidos / totalVideos) * 100)
        : 0;

    document.getElementById("videosAssistidos").textContent =
        videosAssistidos;

    document.getElementById("videosTotal").textContent =
        totalVideos;

    document.getElementById("porcentagem").textContent =
        porcentagem + "%";

    criarGrafico(videosAssistidos, totalVideos);
});

function criarGrafico(assistidos, total) {

    const restantes = total - assistidos;

    new Chart(
        document.getElementById("graficoDesempenho"),
        {
            type: "doughnut",
            data: {
                labels: [
                    "Assistidos",
                    "Restantes"
                ],
                datasets: [{
                    data: [
                        assistidos,
                        restantes
                    ],
                    backgroundColor: [
                        "#6c07ab",
                        "#d9d9d9"
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "bottom"
                    }
                }
            }
        }
    );
}