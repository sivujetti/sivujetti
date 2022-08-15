const utils = {
    /**
     * @param {preact.AnyComponent} reactCmp
     * @param {Object} props
     */
    renderIntoDocument(reactCmp, props) {
        preact.render(preact.createElement(reactCmp, props),
                      document.getElementById('render-container-el'));
    },
    /**
     * @param {any} value
     * @param {Element} inputEl
     */
    fillInput(value, inputEl) {
        inputEl.value = value;
        const event = document.createEvent('HTMLEvents');
        event.initEvent('input', false, true);
        inputEl.dispatchEvent(event);
    },
    /**
     * @param {String} value Allow raw input
     * @param {String} wysiwygInputName Allow raw input
     */
    fillWysiwygInput(value, wysiwygInputName) {
        const contenteditable = document.querySelector(`#editor-${wysiwygInputName} .ql-editor`);
        contenteditable.innerHTML = value;
    },
};

export default utils;
