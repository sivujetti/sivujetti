function refreshStyles(newCss, scope = 'all') {
    const iframeDocument = document.querySelector('#site-preview-iframe').contentDocument;
    const el = iframeDocument.head.querySelector(scope === 'all'
        ? 'style[data-todo]'
        : 'style[data-todo]'
    );
    el.innerHTML = newCss;
}

export {refreshStyles};
