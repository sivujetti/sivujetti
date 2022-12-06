import {env} from '@sivujetti-commons-for-edit-app';

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
    // Input, ImagePicker
    } else if (isObject && elementRef.current.inputEl && elementRef.current.inputEl.current) {
        const inputEl = elementRef.current.inputEl.current;
        inputEl.focus();
    } else {
        env.window.console.error('Don\'t know how to focus to', elementRef.current);
    }
}

export default setFocusTo;
