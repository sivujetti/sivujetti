import {env} from '@sivujetti-commons-for-web-pages';

/**
 * @param {preact.Ref} ref
 */
function setFocusTo(ref) {
    const elOrCmp = ref.current;
    if (!elOrCmp || typeof elOrCmp !== 'object')
        return;
    // <Input/>, <Textarea/> (from ./Form.jsx) etc.
    if (elOrCmp.inputEl?.current) {
        setFocusTo(elOrCmp.inputEl);
    // native <input>, <textarea>
    } else if (elOrCmp instanceof HTMLElement) {
        elOrCmp.focus();
    // <QuillEditor/>
    } else if (elOrCmp.quill) {
        const quill = elOrCmp.quill;
        quill.setSelection(quill.getLength(), 0);
    // <ImagePicker/>
    } else if (elOrCmp.srcInput?.current) {
        setFocusTo(elOrCmp.srcInput);
    } else {
        env.window.console.error('Don\'t know how to focus to', elOrCmp);
    }
}

export default setFocusTo;
