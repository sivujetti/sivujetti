import {env} from '../commons/main.js';
import QuillEditor from '../commons/QuillEditor.jsx';
import {Input} from '../commons/Form.jsx';
import ImagePicker from '../BlockWidget/ImagePicker.jsx';

/**
 * @param {preact.Ref} elementRef
 */
function setFocusTo(elementRef) {
    if (!elementRef.current)
        return;
    if (elementRef.current instanceof QuillEditor) {
        const quill = elementRef.current.quill;
        quill.setSelection(quill.getLength(), 0);
    } else if (elementRef.current instanceof Input) {
        const inputEl = elementRef.current.inputEl;
        inputEl.focus();
    } else if (elementRef.current instanceof HTMLElement) {
        const inputEl = elementRef.current;
        inputEl.focus();
    } else if (elementRef.current instanceof ImagePicker) {
        const inputEl = elementRef.current.inputEl.current;
        inputEl.focus();
    } else {
        env.window.console.error('Don\'t know how to focus to', elementRef.current);
    }
}

export default setFocusTo;
