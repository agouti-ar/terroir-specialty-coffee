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
    const conversation = form.querySelector('.barista-conversation');
    const template = document.getElementById('barista-exchange-template');
    const submit = form.querySelector('button[type="submit"]');
    let inFlight = false;
    let exchange = null;

    const showReply = reply => {
        const top = Math.min(reply.offsetTop, conversation.scrollHeight - conversation.clientHeight);
        conversation.scrollTo({
            top: Math.max(0, top),
            behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        });
    };

    const prepareExchange = (text, topic) => {
        // Reuse a failed turn on retry; preserve completed turns and their product handlers.
        if (exchange && !exchange.succeeded && exchange.text === text && exchange.topic === topic) return exchange;
        if (exchange) {
            for (const element of [exchange.user, exchange.reply, ...exchange.user.querySelectorAll('[id]'), ...exchange.reply.querySelectorAll('[id]')]) {
                element.removeAttribute('id');
            }
        }
        const fragment = template.content.cloneNode(true);
        exchange = {
            user: fragment.querySelector('#barista-user'),
            userText: fragment.querySelector('#barista-user-text'),
            reply: fragment.querySelector('#barista-reply'),
            output: fragment.querySelector('#barista-answer'),
            products: fragment.querySelector('#barista-products'),
            text,
            topic,
            succeeded: false,
        };
        exchange.user.querySelector('[data-i18n="bruma_you"]').textContent = dictionary[activeLanguage].bruma_you;
        conversation.append(fragment);
        return exchange;
    };

    form.addEventListener('input', () => question.setCustomValidity(''));
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (inFlight) return;
        const lang = activeLanguage;
        const copy = dictionary[lang];
        if (!question.value.trim()) {
            question.setCustomValidity(copy.barista_required);
            question.reportValidity();
            return;
        }

        const draft = question.value;
        const text = draft.trim();
        const topic = form.elements.topic.value;
        const turn = prepareExchange(text, topic);
        const { userText, reply, output, products: productLinks } = turn;
        inFlight = true;
        submit.disabled = true;
        userText.textContent = text;
        userText.removeAttribute('lang');
        form.classList.add('is-waiting');
        form.setAttribute('aria-busy', 'true');
        output.removeAttribute('lang');
        output.textContent = copy.barista_wait;
        productLinks.replaceChildren();
        showReply(reply);
        try {
            const response = await fetch('/api/barista', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(10000),
                body: JSON.stringify({ question: text, topic, lang }),
            });
            if (response.status === 429) {
                output.textContent = pickBaristaMessage('barista_limit');
                return;
            }
            if (!response.ok) throw Error('Could not answer');
            const result = await response.json();
            output.lang = result.language;
            userText.lang = result.language;
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
            turn.succeeded = true;
            // Do not erase a new draft written while the previous request was pending.
            if (question.value === draft) clearQuestion();
        } catch {
            output.removeAttribute('lang');
            output.textContent = pickBaristaMessage('barista_error');
        } finally {
            inFlight = false;
            submit.disabled = false;
            form.classList.remove('is-waiting');
            form.setAttribute('aria-busy', 'false');
            showReply(reply);
        }
    });
});

function pickBaristaMessage(key) {
    const messages = dictionary[activeLanguage][key];
    return messages[Math.floor(Math.random() * messages.length)];
}
