// Preserve unchanged cards (including decoded images and focused inputs) on updates.
export function reconcileCards(container, items, render) {
    const existing = new Map([...container.children].map(node => [node.dataset.post, node]));
    items.forEach((item, index) => {
        const html = render(item);
        let node = existing.get(String(item.id));
        if (!node || node.renderedHTML !== html) {
            const template = document.createElement('template');
            template.innerHTML = html.trim();
            const next = template.content.firstElementChild;
            next.renderedHTML = html;
            if (node) {
                // A vote on the same post must not erase a comment being written.
                const draft = node.querySelector('.comment-form input');
                const input = next.querySelector('.comment-form input');
                if (draft && input) input.value = draft.value;
                const focused = draft && document.activeElement === draft;
                const selection = focused ? [draft.selectionStart, draft.selectionEnd] : null;
                node.replaceWith(next);
                if (focused && input) { input.focus({preventScroll: true}); input.setSelectionRange(...selection); }
            }
            node = next;
        }
        if (container.children[index] !== node) container.insertBefore(node, container.children[index] || null);
        existing.delete(String(item.id));
    });
    existing.forEach(node => node.remove());
}

export function routeParts(path) {
    return path.split('/').filter(Boolean).map(part => {
        try { return decodeURIComponent(part); } catch { return part; }
    });
}
