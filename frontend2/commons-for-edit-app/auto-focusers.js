import {env} from '@sivujetti-commons-for-web-pages';

/**
 * @param {preact.Ref} elementRef
 */
function setFocusTo(elementRef) {
    if (!elementRef.current)
        return;
    const isObject = typeof elementRef.current === 'object';
    // QuillEditor
    if (isObject && elementRef.current.quill) {
        const quill = elementRef.current.quill;
        quill.setSelection(quill.getLength(), 0);
    } else if (elementRef.current instanceof HTMLElement) {
        const inputEl = elementRef.current;
        inputEl.focus();
    // ImagePicker
    } else if (isObject && elementRef.current.srcInput && elementRef.current.srcInput.current) {
        setFocusTo(elementRef.current.srcInput.current);
    // Input
    } else if (isObject && elementRef.current.inputEl && elementRef.current.inputEl.current) {
        setFocusTo(elementRef.current.inputEl.current);
    } else {
        env.window.console.error('Don\'t know how to focus to', elementRef.current);
    }
}

export default setFocusTo;
