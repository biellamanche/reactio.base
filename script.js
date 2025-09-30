// --- Configuración del test ---
const TOTAL_RONDAS = 20;
const DURACION_RONDA_MS = 500; // 500 ms por ronda
const ALFABETO = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// --- Elementos del DOM ---
const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const pantallaResultados = document.getElementById("pantalla-resultados");

const btnComenzar = document.getElementById("btn-comenzar");
const btnReiniciar = document.getElementById("btn-reiniciar");

const indicadorRonda = document.getElementById("indicador-ronda");
const cronometro = document.getElementById("cronometro");
const zonaClic = document.getElementById("zona-clic");
const letraEl = document.getElementById("letra");
const barraProgreso = document.getElementById("barra-progreso");
const emojiFeedback = document.getElementById("emoji-feedback");

const cuerpoTabla = document.getElementById("cuerpo-tabla");

// --- Estado ---
let ronda = 0;
let letraActual = "";
let inicioRonda = 0;
let clicRegistrado = false;
let timeoutRonda = null;
let secuencia = [];
const resultados = []; // { ronda, letra, clicado, tiempo }

// --- Utilidades ---
const aleatoria = (arr) => arr[Math.floor(Math.random() * arr.length)];
const aleatorioEntre = (min, max) => Math.random() * (max - min) + min;

function prepararSecuencia() {
  return Array.from({ length: TOTAL_RONDAS }, () => aleatoria(ALFABETO));
}

// --- Inicio del test ---
btnComenzar.addEventListener("click", () => {
  resultados.length = 0;
  ronda = 0;
  secuencia = prepararSecuencia();
  pantallaInicio.classList.add("hidden");
  pantallaResultados.classList.add("hidden");
  
  // Mostrar pantalla de juego antes de la cuenta regresiva
  pantallaJuego.classList.remove("hidden");

  // Contagem regressiva 3-2-1
  let contador = 3;
  letraEl.textContent = contador;
  const intervalId = setInterval(() => {
    contador--;
    if (contador > 0) {
      letraEl.textContent = contador;
    } else {
      clearInterval(intervalId);
      siguienteRonda(); // Inicia la primera ronda
    }
  }, 1000);
});

// --- Reinicio ---
btnReiniciar.addEventListener("click", () => {
  cuerpoTabla.innerHTML = "";
  pantallaResultados.classList.add("hidden");
  pantallaInicio.classList.remove("hidden");
});

// --- Lógica de cada ronda ---
function siguienteRonda() {
  if (ronda >= TOTAL_RONDAS) {
    finalizar();
    return;
  }

  letraActual = secuencia[ronda];
  ronda++;
  indicadorRonda.textContent = `Ronda ${ronda}/${TOTAL_RONDAS}`;
  cronometro.textContent = `${(DURACION_RONDA_MS / 1000).toFixed(1)} s`;

  letraEl.textContent = letraActual;

  clicRegistrado = false;
  zonaClic.classList.remove("flash-ok", "flash-err");

  // Reinicia barra de tiempo
  barraProgreso.style.animation = "none";
  barraProgreso.offsetHeight;
  barraProgreso.style.animation = `drain ${DURACION_RONDA_MS}ms linear forwards`;

  requestAnimationFrame(() => {
    inicioRonda = performance.now();

    window.addEventListener("click", onClick, { once: true });

    timeoutRonda = setTimeout(() => {
      if (!clicRegistrado) {
        window.removeEventListener("click", onClick);
        registrarSinClic();
      }
    }, DURACION_RONDA_MS);
  });
}

// --- Manejo del clic ---
function onClick() {
  if (clicRegistrado) return;
  clicRegistrado = true;
  const tiempo = performance.now() - inicioRonda;
  clearTimeout(timeoutRonda);

  resultados.push({
    ronda,
    letra: letraActual,
    clicado: true,
    tiempo: tiempo.toFixed(2),
  });

  mostrarEmoji(true);
  flashResultado(true);
  avanzarTrasBrevePausa();
}

// --- Sin clic ---
function registrarSinClic() {
  resultados.push({
    ronda,
    letra: letraActual,
    clicado: false,
    tiempo: "Sin respuesta",
  });

  mostrarEmoji(false);
  flashResultado(false);
  avanzarTrasBrevePausa();
}

// --- Mostrar emoji (sin timeout interno) ---
function mostrarEmoji(ok) {
  emojiFeedback.textContent = ok ? "✅" : "❌";
  emojiFeedback.classList.add("show");
  emojiFeedback.classList.remove("hidden");
}

// --- Feedback visual ---
function flashResultado(ok) {
  zonaClic.classList.remove("flash-ok", "flash-err");
  zonaClic.classList.add(ok ? "flash-ok" : "flash-err");
}

// --- Pausa breve entre rondas (ahora aleatoria 1-2s) ---
function avanzarTrasBrevePausa() {
  const pausaAleatoria = aleatorioEntre(1000, 2000); // ms

  // Mantiene emoji y letra juntos durante DURACION_RONDA_MS, luego desaparecen juntos
  setTimeout(() => {
    letraEl.textContent = "";
    emojiFeedback.classList.remove("show");
    emojiFeedback.classList.add("hidden");

    // Chama próxima ronda após pausa aleatória
    setTimeout(() => {
      siguienteRonda();
    }, pausaAleatoria);
  }, DURACION_RONDA_MS);
}

// --- Finalización ---
function finalizar() {
  window.removeEventListener("click", onClick);
  clearTimeout(timeoutRonda);
  pantallaJuego.classList.add("hidden");
  pantallaResultados.classList.remove("hidden");

  cuerpoTabla.innerHTML = resultados
    .map(
      (res) => `
    <tr>
      <td>${res.ronda}</td>
      <td>${res.letra}</td>
      <td>${res.clicado ? "✅" : "❌"}</td>
      <td>${res.tiempo}</td>
    </tr>`
    )
    .join("");

  const tiemposValidos = resultados
    .filter((r) => r.tiempo !== "Sin respuesta")
    .map((r) => parseFloat(r.tiempo))
    .filter((t) => !isNaN(t));

  if (tiemposValidos.length > 0) {
    const media = (
      tiemposValidos.reduce((a, b) => a + b, 0) / tiemposValidos.length
    ).toFixed(2);
    cuerpoTabla.innerHTML += `
      <tr style="font-weight:bold; background:#eef;">
        <td colspan="3">Media de tiempos</td>
        <td>${media} ms</td>
      </tr>
    `;
  }
}

// --- Animación CSS para la barra ---
const style = document.createElement("style");
style.textContent = `
@keyframes drain {
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
}`;
document.head.appendChild(style);
