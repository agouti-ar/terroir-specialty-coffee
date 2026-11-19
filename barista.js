document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('barista-form');
    const question = form.elements.question;
    form.autocomplete = 'off';
    question.autocomplete = 'off';
    const clearQuestion = () => {
        question.value = '';
        question.setCustomValidity('');
    };
    clearQuestion();
    window.addEventListener('pageshow', clearQuestion);
    if (location.protocol === 'file:') return;

    try {
        const response = await fetch('/api/barista', { cache: 'no-store' });
        if (!response.ok || !(await response.json()).enabled) return;
    } catch {
        return;
    }

    form.hidden = false;
    const output = document.getElementById('barista-answer');
    const productLinks = document.getElementById('barista-products');
    const submit = form.querySelector('button[type="submit"]');

    form.addEventListener('input', () => question.setCustomValidity(''));
    form.addEventListener('submit', async event => {
        event.preventDefault();
        const lang = activeLanguage;
        const copy = dictionary[lang];
        if (!question.value.trim()) {
            question.setCustomValidity(copy.barista_required);
            question.reportValidity();
            return;
        }

        submit.disabled = true;
        output.removeAttribute('lang');
        output.textContent = copy.barista_wait;
        productLinks.replaceChildren();
        try {
            const response = await fetch('/api/barista', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000),
                body: JSON.stringify({ question: question.value.trim(), topic: form.elements.topic.value, lang }),
            });
            if (response.status === 429) {
                output.textContent = pickBaristaMessage('barista_limit');
                return;
            }
            if (!response.ok) throw Error('Could not answer');
            const result = await response.json();
            output.lang = result.language;
            output.textContent = result.answer;
            const products = getStoredProducts();
            for (const id of result.productIds) {
                const product = products.find(item => item.id === id);
                if (!product) continue;
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'quiz-btn';
                button.textContent = dictionary[activeLanguage][product.titleKey] || product.title;
                button.addEventListener('click', () => openQuickView(product));
                productLinks.append(button);
            }
        } catch {
            output.removeAttribute('lang');
            output.textContent = pickBaristaMessage('barista_error');
        } finally {
            submit.disabled = false;
        }
    });
});

function pickBaristaMessage(key) {
    const messages = dictionary[activeLanguage][key];
    return messages[Math.floor(Math.random() * messages.length)];
}
