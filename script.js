/* ============================================================
   IMPORTS
   ============================================================ */
import gsap from "https://esm.sh/gsap";
import { vec2 } from "https://esm.sh/vecteur";


/* ============================================================
   CURSOR MAGNÉTICO
   ============================================================ */
class Cursor {
    constructor(targetEl) {
        this.el = targetEl;

        this.position = {
            previous: vec2(-100, -100),
            current: vec2(-100, -100),
            target: vec2(-100, -100),
            lerpAmount: 0.1
        };

        this.scale = {
            previous: 1,
            current: 1,
            target: 1,
            lerpAmount: 0.1
        };

        this.isHovered = false;
        this.hoverEl = null;

        this.addListeners();
    }

    update() {
        this.position.current.lerp(this.position.target, this.position.lerpAmount);

        this.scale.current = gsap.utils.interpolate(
            this.scale.current,
            this.scale.target,
            this.scale.lerpAmount
        );

        const delta = this.position.current.clone().sub(this.position.previous);
        this.position.previous.copy(this.position.current);

        gsap.set(this.el, {
            x: this.position.current.x,
            y: this.position.current.y
        });

        if (!this.isHovered) {
            const angle = Math.atan2(delta.y, delta.x) * (180 / Math.PI);
            const distance = Math.sqrt(delta.x * delta.x + delta.y * delta.y) * 0.04;

            gsap.set(this.el, {
                rotate: angle,
                scaleX: this.scale.current + Math.min(distance, 1),
                scaleY: this.scale.current - Math.min(distance, 0.3)
            });
        }
    }

    updateTargetPosition(x, y) {
        if (this.isHovered && this.hoverEl) {
            const bounds = this.hoverEl.getBoundingClientRect();
            const cx = bounds.x + bounds.width / 2;
            const cy = bounds.y + bounds.height / 2;

            const dx = x - cx;
            const dy = y - cy;

            this.position.target.x = cx + dx * 0.15;
            this.position.target.y = cy + dy * 0.15;
            this.scale.target = 2;

            const angle = Math.atan2(dy, dx) * (180 / Math.PI);
            const distance = Math.sqrt(dx * dx + dy * dy) * 0.01;

            gsap.set(this.el, { rotate: angle });

            gsap.to(this.el, {
                scaleX: this.scale.target + Math.pow(Math.min(distance, 0.6), 3) * 3,
                scaleY: this.scale.target - Math.pow(Math.min(distance, 0.3), 3) * 3,
                duration: 0.5,
                ease: "power4.out",
                overwrite: true
            });
        } else {
            this.position.target.x = x;
            this.position.target.y = y;
            this.scale.target = 1;
        }
    }

    addListeners() {
        gsap.utils.toArray("[data-hover]").forEach((hoverEl) => {
            const boundsEl = hoverEl.querySelector("[data-hover-bounds]");
            if (!boundsEl) return;

            boundsEl.addEventListener("pointerover", () => {
                this.isHovered = true;
                this.hoverEl = boundsEl;
            });

            boundsEl.addEventListener("pointerout", () => {
                this.isHovered = false;
                this.hoverEl = null;
                this.scale.target = 1;
            });

            /* Magnetismo */
            const xTo = gsap.quickTo(hoverEl, "x", {
                duration: 1,
                ease: "elastic.out(1, 0.3)"
            });
            const yTo = gsap.quickTo(hoverEl, "y", {
                duration: 1,
                ease: "elastic.out(1, 0.3)"
            });

            hoverEl.addEventListener("pointermove", (event) => {
                const { clientX: cx, clientY: cy } = event;
                const { height, width, left, top } = hoverEl.getBoundingClientRect();
                const x = cx - (left + width / 2);
                const y = cy - (top + height / 2);
                xTo(x * 0.2);
                yTo(y * 0.2);
            });

            hoverEl.addEventListener("pointerout", () => {
                xTo(0);
                yTo(0);
            });
        });
    }
}

/* Inicializa el cursor solo en desktop */
const cursorElement = document.querySelector(".cursor");
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

if (cursorElement && !isTouchDevice) {
    const cursor = new Cursor(cursorElement);

    function updateCursor() { cursor.update(); }
    function onMouseMove(event) {
        cursor.updateTargetPosition(event.clientX, event.clientY);
    }

    gsap.ticker.add(updateCursor);
    window.addEventListener("pointermove", onMouseMove);
}


/* ============================================================
   FILTROS DE PROYECTOS
   ============================================================ */
const filterButtons = document.querySelectorAll(".filter-btn");
const projectCards = document.querySelectorAll(".proj-card");

filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        const filter = button.getAttribute("data-filter");

        projectCards.forEach((card) => {
            const category = card.getAttribute("data-cat");
            const shouldShow = filter === "all" || category === filter;
            card.style.display = shouldShow ? "" : "none";
        });
    });
});


/* ============================================================
   MENÚ HAMBURGUESA
   ============================================================ */
const menuBtn = document.querySelector("#menuToggle");
const closeBtn = document.querySelector("#closeToggle");
const mobileMenu = document.querySelector("#mobileMenu");
const mobileLinks = document.querySelectorAll(".mobile-navlinks a");

function openMenu() {
    mobileMenu.classList.add("is-open");
    mobileMenu.setAttribute("aria-hidden", "false");
    menuBtn.setAttribute("aria-expanded", "true");
    document.body.classList.add("menu-open");
}

function closeMenu() {
    mobileMenu.classList.remove("is-open");
    mobileMenu.setAttribute("aria-hidden", "true");
    menuBtn.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
}

if (menuBtn) menuBtn.addEventListener("click", openMenu);
if (closeBtn) closeBtn.addEventListener("click", closeMenu);

mobileLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
        closeMenu();
    }
});


/* ============================================================
   MODO CLARO / OSCURO
   ============================================================ */
const themeBtn = document.querySelector("#themeToggle");

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    if (themeBtn) {
        themeBtn.setAttribute("aria-pressed", theme === "dark");
    }
}

// Estado inicial: si no hay nada guardado, respetamos el sistema
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (themeBtn) themeBtn.setAttribute("aria-pressed", savedTheme === "dark");
} else {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (themeBtn) themeBtn.setAttribute("aria-pressed", prefersDark);
}

// Toggle
if (themeBtn) {
    themeBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");

        // Si no hay atributo explícito, decidimos según el SO
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const effectiveTheme = current || (systemDark ? "dark" : "light");

        applyTheme(effectiveTheme === "dark" ? "light" : "dark");
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const codeContent = document.getElementById('code-content');
    if (!codeContent) return;

    // Texto completo con formato de código, incluyendo números de línea y sintaxis
    const fullText = `1  <span class="kw">function</span> <span class="func">createAwesomeFeature</span>() {
2      <span class="kw">const</span> <span class="var">animate</span> = () => {
3          <span class="kw">return new</span> <span class="func">Promise</span>(resolve => {
4              element.<span class="var">style</span>.<span class="var">transform</span> =
5                  <span class="str">'translateY(-10px)'</span>;
6              <span class="func">setTimeout</span>(() => <span class="func">resolve</span>(), <span class="num-val">300</span>);
7          });
8      };
9
10     <span class="kw">return</span> {
11         element,
12         <span class="comment">/* lógica interactiva */</span>
13     };
14 }`;

    const typingDelay = 40; // Velocidad de tipeo en milisegundos
    const cursor = '<span class="typewriter-cursor flickering"></span>';

    // Función para tipear de forma segura, respetando el HTML
    function typeWithCursor() {
        let index = 0;

        function typeChar() {
            // Revisa si el texto contiene una etiqueta HTML
            const htmlChar = fullText.slice(index);
            if (htmlChar.startsWith('<')) {
                const tagEndIndex = htmlChar.indexOf('>');
                if (tagEndIndex !== -1) {
                    // Salta toda la etiqueta y continúa
                    index += tagEndIndex + 1;
                }
            }

            // Actualiza el texto visible (sin cursor temporalmente)
            codeContent.innerHTML = fullText.slice(0, index);
            // Agrega el cursor al final
            codeContent.innerHTML += cursor;

            index++;

            if (index < fullText.length) {
                setTimeout(typeChar, typingDelay);
            }
        }

        // Inicia el tipeo
        typeChar();
    }

    // Prepara el contenedor y comienza la escritura
    codeContent.innerHTML = cursor;
    typeWithCursor();
});

/* ============================================================
   FORMULARIO A WHATSAPP
   ============================================================ */
document.addEventListener("DOMContentLoaded", function () {
    const wsForm = document.getElementById('whatsapp-form');

    if (wsForm) {
        wsForm.addEventListener('submit', function (e) {
            e.preventDefault(); // Evita que la página se recargue

            // Obtenemos los valores de los campos
            const nombre = document.getElementById('name').value;
            const asunto = document.getElementById('subject').value;
            const mensaje = document.getElementById('message').value;

            // REEMPLAZA AQUÍ con tu número real. 
            // Para CABA (Argentina) es 54911 seguido de tus 8 números.
            const tuNumero = "5491163633835";

            // Armamos el mensaje final
            const textoWhatsApp = `¡Hola Alex! Soy ${nombre}.%0A%0ATe contacto por: ${asunto}.%0A%0A${mensaje}`;

            // Creamos el enlace oficial de la API de WhatsApp
            const url = `https://wa.me/${tuNumero}?text=${textoWhatsApp}`;

            // Abrimos WhatsApp en una nueva pestaña
            window.open(url, '_blank');
        });
    }
});



document.addEventListener("DOMContentLoaded", function () {
    const h1Element = document.querySelector("h1");
    if (!h1Element) return;

    // Dividimos el texto para animar solo lo necesario y conservar el formato limpio
    const part1 = "Desarrollador Fullstack";
    const part2 = " | Analista en Sistemas";
    
    h1Element.innerHTML = '<em class="neon-role"><span class="typed-fullstack"></span></em><span class="typed-rest"></span><span class="terminal-cursor">_</span>';
    
    const container1 = h1Element.querySelector(".typed-fullstack");
    const container2 = h1Element.querySelector(".typed-rest");
    
    let i = 0;
    let j = 0;

    function typePart1() {
        if (i < part1.length) {
            container1.textContent += part1.charAt(i);
            i++;
            setTimeout(typePart1, 55);
        } else {
            setTimeout(typePart2, 100);
        }
    }

    function typePart2() {
        if (j < part2.length) {
            container2.textContent += part2.charAt(j);
            j++;
            setTimeout(typePart2, 45);
        }
    }

    setTimeout(typePart1, 300);
});

