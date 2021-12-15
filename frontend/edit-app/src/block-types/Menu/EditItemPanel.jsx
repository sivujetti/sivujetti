import {__} from '../../commons/main.js';
import {useField, FormGroupInline, InputErrors} from '../../commons/Form2.jsx';
import {formValidation} from '../../constants.js';

/**
 * @type {preact.FunctionalComponent<{funcsOut: {doOpen: (item: MenuLink, tree: Array<MenuLink>) => void;}; panelAHeight: Number; api: {onTreeUpdated: (mutatedTree: Array<MenuLink>) => void; endEditMode: (mutatedTree: Array<MenuLink>): void;};}>}
 */
const EditItemPanel = ({funcsOut, panelAHeight, api}) => {
    const [cssClass, setCssClass] = preactHooks.useState('d-none');
    const tree = preactHooks.useRef(null);
    const onChange = preactHooks.useCallback((val, key) => {
        const mut = findLinkItem(tree.current.tree, tree.current.itemId);
        mut[key] = val; // Mutates tree.current.tree
        api.onTreeUpdated(tree.current.tree);
    });
    const linkText = useField('linkText', {validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Text'),
        onAfterValidation: (val, hasErrors) => { if (!hasErrors) onChange(val, 'text'); }});
    const linkSlug = useField('linkSlug', {validations: [['maxLength', formValidation.HARD_SHORT_TEXT_MAX_LEN]],
        label: __('Url'),
        onAfterValidation: (val, hasErrors) => { if (!hasErrors) onChange(val, 'slug'); }});
    //
    funcsOut.doOpen = preactHooks.useCallback((item, latestTree) => {
        setCssClass('reveal-from-right');
        tree.current = {tree: JSON.parse(JSON.stringify(latestTree)), itemId: item.id};
        linkText.setValue(item.text);
        linkSlug.setValue(item.slug);
    });
    //
    return <div class={ cssClass } style={ `top: -${panelAHeight + 8}px` }>{ linkText.value !== undefined ? [
        <button onClick={ () => {
            api.endEditMode(tree.current.tree);
            setCssClass('fade-to-right');
        } } class="btn btn-sm" type="button"> &lt; </button>,
        <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="linkText" class="form-label">{ __('Text') }</label>
                <input { ...linkText }/>
                <InputErrors errors={ linkText.getErrors() }/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="linkSlug" class="form-label">{ __('Url') }</label>
                <input { ...linkSlug } placeholder={ __('e.g. %s or %s', '/my-page', 'https://page.com') }/>
                <InputErrors errors={ linkSlug.getErrors() }/>
            </FormGroupInline>
        </div>
    ] : null }</div>;
};

/**
 * @param {Array<MenuLink>} branch
 * @param {String} id
 * @returns {MenuLink|null}
 */
function findLinkItem(branch, id) {
    for (const link of branch) {
        if (link.id === id) return link;
        if (link.children.length) {
            const sub = findLinkItem(link.children, id);
            if (sub) return sub;
        }
    }
    return null;
}

export default EditItemPanel;
