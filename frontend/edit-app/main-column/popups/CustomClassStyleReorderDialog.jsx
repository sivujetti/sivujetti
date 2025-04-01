import {
    __,
    floatingDialog,
    handleSubmit,
    Icon,
    Sortable,
} from '@sivujetti-commons-for-edit-app';

/** @extends {preact.Component<CustomClassStyleReorderDialogProps, any>} */
class CustomClassStyleReorderDialog extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.sortable = new Sortable();
        this.boundDoHandleSubmit = this.doHandleSubmit.bind(this);
        const state = createState(this.props);
        this.initialStyleIdsJson = state.styleIdsJson;
        this.setState(state);
    }
    /**
     * @param {CustomClassStyleReorderDialogProps} props
     * @access protected
     */
    componentWillReceiveProps(props) {
        if (props.styleChunks !== this.props.styleChunks) {
            this.sortable.el = null;
            const state = createState(props);
            this.initialStyleIdsJson = state.styleIdsJson;
            this.setState(state);
        }
    }
    /**
     * @access protected
     */
    render({styleChunks}, {styleIdsJson}) {
        return <form onSubmit={ e => handleSubmit(this, this.boundDoHandleSubmit, e) }>
            <ul
                class="list mb-2 style-tweak-settings-list styles-list icon-narrower"
                ref={ this.activateSorting.bind(this) }>{ styleChunks.map(chunk => {
                const cls = extractClassName(chunk);
                const title = chunk.data?.title ? classify(chunk.data.title) : cls;
                return <li data-id={ chunk.id } class="mt-1">
                    <button class="drag-handle with-icon" title={ __('Drag') } type="button">
                        <Icon iconId="grid-dots" className="size-xs mr-0"/>
                    </button>
                    <span class="ͼ1 text-ellipsis">
                        <span class="ͼj cm-scroller text-ellipsis" title={ title + (title !== cls ? ` / ${cls}` : '') }>{ title }</span>
                    </span>
                </li>
            }) }</ul>
            <div class="mt-8">
                <button
                    class="btn btn-primary mr-2"
                    type="submit"
                    disabled={ this.initialStyleIdsJson === styleIdsJson }>{ __('Save order') }</button>
                <button
                    onClick={ () => floatingDialog.close() }
                    class="btn btn-link"
                    type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @returns {Promise<void>}
     * @access private
     */
    doHandleSubmit() {
        this.props.onOrderSaved(this.state.styleIds.map(asStr => parseInt(asStr, 10)));
        floatingDialog.close();
        return Promise.resolve();
    }
    /**
     * @param {HTMLUListElement} ulEl
     * @access private
     */
    activateSorting(ulEl) {
        this.sortable.register(ulEl, {
            handle: '.drag-handle',
            onReorder: orderedDataIds => {
                const newIdList = [...orderedDataIds];
                this.setState({styleIds: newIdList, styleIdsJson: JSON.stringify(newIdList)});
            },
        });
    }
}

/**
 * @param {CustomClassStyleReorderDialogProps} props
 * @returns {{styleIds: Array<string>; styleIdsJson: string;}}
 */
function createState({styleChunks}) {
    const styleIds = styleChunks.map(({id}) => id.toString());
    return {styleIds, styleIdsJson: JSON.stringify(styleIds)};
}

/**
 * @param {StyleChunk} scss
 * @param {boolean} withDot = true
 * @returns {string}
 */
function extractClassName({scss}, withDot = true) {
    const s1 = scss.split(' {')[0];
    return withDot ? s1 : s1.substring(1);
}

/**
 * 'My class' -> '.my-class'
 *
 * @param {string} input
 * @returns {string}
 */
function classify(input) {
    const pcs = input.split('.');
    return `.${pcs.at(-1).toLocaleLowerCase().trim().replaceAll(' ', '-')}`;
}

/**
 * @typedef {{
 *   styleChunks: Array<StyleChunk>;
 *   onOrderSaved: (orderedIds: Array<string>) => void;
 * }} CustomClassStyleReorderDialogProps
 */

export default CustomClassStyleReorderDialog;
export {classify, extractClassName};
