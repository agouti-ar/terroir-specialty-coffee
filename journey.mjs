const section = document.getElementById('origin-to-cup');
const scrollStory = section.querySelector('.journey-scroll');
const stage = section.querySelector('.journey-stage');
const start = document.getElementById('journey-start');
const status = document.getElementById('journey-status');
const chapterTitle = document.getElementById('journey-chapter-title');
const chapterText = document.getElementById('journey-chapter-text');
const shop = document.getElementById('journey-shop');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const header = document.querySelector('body > .header');

if (header) {
    const syncHeaderHeight = () => {
        section.style.setProperty('--journey-nav-height', Math.ceil(header.getBoundingClientRect().height) + 'px');
    };
    new ResizeObserver(syncHeaderHeight).observe(header);
    syncHeaderHeight();
}
const translations = {
    "en": {
        "load": "Loading the scene…",
        "unavailable": "The 3D scene is unavailable. Read the story below.",
        "packing": "Ready for the shelf",
        "packText": "Roasted coffee releases gas. A one-way valve lets it escape while limiting the air that gets in."
    },
    "es": {
        "eyebrow": "El diario de Terroir",
        "title": "Del origen a la taza",
        "intro": "Cada taza tiene una historia. Descubre las decisiones que dan forma a su sabor.",
        "start": "Entrar en la historia en 3D",
        "exit": "Salir del 3D",
        "cue": "Desplázate para recorrer el tostadero",
        "shop": "Explora nuestros cafés",
        "originTitle": "El lugar de cultivo",
        "originText": "La variedad, el clima y el lugar influyen en la fruta. El frío puede ralentizar la maduración de las cerezas.",
        "processTitle": "Después de la cosecha",
        "processText": "En el proceso natural, el café se seca dentro de la cereza. En el lavado, la fruta se retira antes del secado.",
        "roastTitle": "En el tostadero",
        "roastText": "El calor cambia el color y el aroma del café verde. El tueste influye en los sabores que llegan a la taza.",
        "cupTitle": "En la barra",
        "cupText": "La molienda y el método cambian la taza. Empieza con una receta equilibrada y ajústala a tu gusto.",
        "load": "Cargando la escena…",
        "unavailable": "La escena 3D no está disponible. Puedes leer la historia debajo.",
        "packing": "Listo para la estantería",
        "packText": "El café tostado libera gas. Una válvula de una vía lo deja salir y limita la entrada de aire."
    },
    "de": {
        "eyebrow": "Das Terroir-Journal",
        "title": "Vom Ursprung bis zur Tasse",
        "intro": "Jede Tasse hat eine Geschichte. Entdecke die Entscheidungen hinter ihrem Geschmack.",
        "start": "Die 3D-Geschichte starten",
        "exit": "3D verlassen",
        "cue": "Scrolle durch die Rösterei",
        "shop": "Unsere Kaffees entdecken",
        "originTitle": "Der Anbauort",
        "originText": "Sorte, Wetter und Standort prägen die Frucht. Kühlere Bedingungen können die Reifung verlangsamen.",
        "processTitle": "Nach der Ernte",
        "processText": "Bei der natürlichen Aufbereitung trocknet der Kaffee in der Kirsche. Bei der gewaschenen wird die Frucht vorher entfernt.",
        "roastTitle": "In der Rösterei",
        "roastText": "Hitze verändert Farbe und Duft des Rohkaffees. Die Röstung prägt, welche Aromen in der Tasse hervortreten.",
        "cupTitle": "An der Theke",
        "cupText": "Mahlgrad und Zubereitung verändern die Tasse. Beginne mit einem ausgewogenen Rezept und passe es an deinen Geschmack an.",
        "load": "Die Szene wird geladen…",
        "unavailable": "Die 3D-Szene ist nicht verfügbar. Die Geschichte steht unten.",
        "packing": "Bereit fürs Regal",
        "packText": "Frisch gerösteter Kaffee gibt Gas ab. Ein Einwegventil lässt es entweichen und begrenzt den Luftzutritt."
    },
    "uk": {
        "eyebrow": "Журнал Terroir",
        "title": "Від походження до чашки",
        "intro": "Кожна чашка має історію. Дізнайтеся, які рішення формують її смак.",
        "start": "Відкрити 3D-історію",
        "exit": "Вийти з 3D",
        "cue": "Прокручуйте, щоб пройти крізь обсмажувальню",
        "shop": "Переглянути нашу каву",
        "originTitle": "Місце вирощування",
        "originText": "Сорт, погода й місцевість впливають на ягоди. У прохолодніших умовах вони можуть достигати повільніше.",
        "processTitle": "Після збору",
        "processText": "За натуральної обробки зерно висихає всередині ягоди. За митої м’якоть видаляють перед сушінням.",
        "roastTitle": "В обсмажувальні",
        "roastText": "Тепло змінює колір і аромат зеленого зерна. Обсмаження впливає на те, які смаки виходять на перший план.",
        "cupTitle": "Біля стійки",
        "cupText": "Помел і спосіб заварювання змінюють смак. Почніть зі збалансованого рецепта та змінюйте його до смаку.",
        "load": "Завантажуємо сцену…",
        "unavailable": "3D-сцена недоступна. Історію можна прочитати нижче.",
        "packing": "Можна ставити на полицю",
        "packText": "Обсмажена кава виділяє газ. Односторонній клапан випускає його й обмежує потрапляння повітря."
    }
};
const english = Object.fromEntries([...section.querySelectorAll('[data-journey]')].map(node => [node.dataset.journey, node.textContent]));
Object.assign(english, translations.en);

let release;
let chapter = 0;
let notice = '';
function translate() {
    const lang = document.documentElement.lang;
    const copy = lang === 'en' ? english : (translations[lang] || english);
    for (const node of section.querySelectorAll('[data-journey]')) node.textContent = copy[node.dataset.journey] || english[node.dataset.journey];
    const titles = ['roastTitle', 'packing', 'cupTitle'];
    const texts = ['roastText', 'packText', 'cupText'];
    chapterTitle.textContent = copy[titles[chapter]];
    chapterText.textContent = copy[texts[chapter]];
    shop.hidden = chapter !== 2;
    status.textContent = copy[notice] || '';
}

function close() {
    release?.();
    release = undefined;
    scrollStory.hidden = true;
    start.setAttribute('aria-expanded', 'false');
    start.hidden = motion.matches || !('WebGL2RenderingContext' in window);
}

const pages = new MutationObserver(translate);
pages.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
translate();
start.hidden = motion.matches || !('WebGL2RenderingContext' in window);
start.setAttribute('aria-expanded', 'false');
motion.addEventListener('change', close);
section.querySelector('.journey-stop').addEventListener('click', () => {
    close();
    start.focus();
});
stage.querySelector('canvas').addEventListener('webglcontextlost', event => {
    event.preventDefault();
    notice = 'unavailable';
    close();
    translate();
    start.focus();
});
start.addEventListener('click', async () => {
    start.disabled = true;
    notice = 'load';
    translate();
    try {
        const scene = await import('./journey-scene.mjs');
        if (motion.matches) return;
        scrollStory.hidden = false;
        release = scene.startJourney(stage, index => {
            chapter = index;
            translate();
        });
        start.setAttribute('aria-expanded', 'true');
        start.hidden = true;
        stage.focus({ preventScroll: true });
        window.scrollTo({
            top: window.scrollY + scrollStory.getBoundingClientRect().top - parseFloat(getComputedStyle(stage).top),
            behavior: 'instant',
        });
    } catch {
        close();
        notice = 'unavailable';
    } finally {
        start.disabled = false;
        if (notice === 'load') notice = '';
        translate();
    }
});
