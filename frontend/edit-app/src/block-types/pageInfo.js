import {__, api, env, http, urlUtils, hookForm, unhookForm, reHookValues, Input,
        InputErrors, FormGroupInline, FormGroup, Textarea, signals} from '@sivujetti-commons-for-edit-app';
import ImagePicker from '../block-widget/ImagePicker.jsx';
import {cloneObjectDeep, overrideData} from '../block/theBlockTreeStore.js';
import toasters from '../commons/Toaster.jsx';
import {objectUtils} from '../commons/utils.js';
import {updateBlockProps} from '../left-column/block/BlockEditForm.jsx';
import blockTreeUtils from '../left-column/block/blockTreeUtils.js';
import {makeSlug, makePath} from '../left-column/page/AddCategoryPanel.jsx';
import ManyToManyField from '../left-column/page/ManyToManyField.jsx';
import store, {observeStore, pushItemToOpQueue, selectCurrentPageDataBundle, setCurrentPageDataBundle} from '../store.js';
import {urlValidatorImpl} from '../validation.js';
import setFocusTo from './auto-focusers.js';
import {CountingLinkItemFactory} from './menu/EditForm.jsx';

/** @type {[String, String, String]} [blockId, isStoredToTreeId, pageId] */
let linkedMenuBlockInfo;
let doReRenderLinkedMenu;
const undoStack = [];

class PageInfoBlockEditForm extends preact.Component {
    // currentPageIsPlaceholder;
    // pageType;
    // ownFields;
    // titleEl;
    // descriptionEl;
    // imagePicker;
    // boundPushOpQueueOp;
    // pushOpQueueOpTimeout;
    /**
     * @access protected
     */
    componentWillMount() {
        const curPage = selectCurrentPageDataBundle(store.getState()).page;
        this.currentPageIsPlaceholder = curPage.isPlaceholderPage;
        this.pageType = api.getPageTypes().find(({name}) => name === curPage.type);
        this.ownFields = this.pageType.ownFields.filter(({dataType}) => dataType.type === 'many-to-many');
        this.titleEl = preact.createRef();
        this.descriptionEl = preact.createRef();
        this.imagePicker = preact.createRef();
        const createSlugAndPath = slug => ({slug, path: makePath(slug, this.pageType)});
        const createSlugAndPathFromTitle = !this.currentPageIsPlaceholder
            ? (_ => ({}))
            : createSlugAndPath;
        this.setState(hookForm(this, [
            {name: 'title', value: curPage.title, validations: [['required'], ['maxLength', 92]],
             label: __('Page title'), onAfterValueChanged: (value, hasErrors) => {
                if (!hasErrors) this.emitChanges(mut => {
                    Object.assign(
                        mut,
                        {title: value},
                        createSlugAndPathFromTitle(makeSlug(value)),
                    );
                });
            }},
            {name: 'slug', value: curPage.slug, validations: [['required'], ['maxLength', 92],
                [urlValidatorImpl, {allowExternal: false, allowEmpty: true}]],
             label: __('Url (slug)'), onAfterValueChanged: (value, hasErrors) => {
                if (!hasErrors) this.emitChanges(mut => { Object.assign(
                    mut,
                    createSlugAndPath(value),
                ); });
            }},
            {name: 'description', value: getNormalizedDescription(curPage.meta.description), validations: [['maxLength', 206]],
             label: __('Meta description'), onAfterValueChanged: (value, hasErrors) => {
                if (!hasErrors) this.emitChanges(mut => { mut.meta.description = value; });
             }},
        ], {
            socialImageSrc: (curPage.meta.socialImage || {src: null}).src
        }));
        observeStore(selectCurrentPageDataBundle, ({page}) => {
            if (this.state.values.title !== page.title ||
                this.state.values.slug !== page.slug ||
                this.state.values.description !== getNormalizedDescription(page.meta.description)) {
                reHookValues(this, [{name: 'title', value: page.title},
                                    {name: 'slug', value: page.slug},
                                    {name: 'description', value: getNormalizedDescription(page.meta.description)}]);
                if (doReRenderLinkedMenu) reRenderLinkedMenu(page);
            } else {
                const {src} = (page.meta.socialImage || {src: null});
                if (this.state.socialImageSrc !== src)
                    this.setState({socialImageSrc: src});
            }
        });
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.titleEl);
        window.autosize(this.descriptionEl.current.inputEl.current);
    }
    /**
     * @access protected
     */
    componentWillUnmount() {
        unhookForm(this);
        linkedMenuBlockInfo = null;
        doReRenderLinkedMenu = false;
    }
    /**
     * @access protected
     */
    render(_, {socialImageSrc}) {
        const wrap = input => !this.pageType || this.pageType.name === 'Pages'
            ? input
            : <div class="input-group">
                <span class="input-group-addon addon-sm">{ this.pageType.slug }</span>
                { input }
            </div>;
        return <div class="form-horizontal pt-0">
            <FormGroupInline>
                <label htmlFor="pageTitle" class="form-label">{ __('Page title') }</label>
                <Input vm={ this } prop="title" id="pageTitle" ref={ this.titleEl }/>
                <InputErrors vm={ this } prop="title"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="pageSlug" class="form-label">{ __('Url (slug)') }</label>
                { wrap(<Input vm={ this } prop="slug" id="pageSlug"/>) }
                <InputErrors vm={ this } prop="slug"/>
            </FormGroupInline>
            <FormGroupInline>
                <label htmlFor="socialImageSrc" class="form-label">{ __('Social image') }</label>
                <ImagePicker
                    onImageSelected={ this.handleSocialImageChanged.bind(this) }
                    initialImageFileName={ socialImageSrc }
                    inputId="socialImageSrc"
                    ref={ this.imagePicker }/>
            </FormGroupInline>
            <FormGroup>
                <label htmlFor="pageDescription" class="form-label">{ __('Meta description') }</label>
                <Textarea vm={ this } prop="description" id="pageDescription" ref={ this.descriptionEl }/>
                <InputErrors vm={ this } prop="description"/>
            </FormGroup>
            { this.ownFields ? this.ownFields.map(field =>
                <ManyToManyField
                    field={ field }
                    emitChanges={ this.emitChanges.bind(this) }
                    key={ field.name }/>
            ) : null }
        </div>;
    }
    /**
     * @param {(pageToMutate: Page) => void} mutateProps
     */
    emitChanges(mutateProps) {
        const mut = selectCurrentPageDataBundle(store.getState());
        const orig = !this.emitChangesTimeout ? JSON.parse(JSON.stringify(mut)) : null;
        mutateProps(mut.page);

        if (orig)
            undoStack.push(orig);
        else // keep undoStack[undoStack.length - 1]
            clearTimeout(this.emitChangesTimeout);

        this.emitChangesTimeout = setTimeout(() => {
            store.dispatch(setCurrentPageDataBundle(mut));
            store.dispatch(pushItemToOpQueue('update-page-basic-info', {
                doHandle: !this.currentPageIsPlaceholder ? savePageToBackend : null,
                doUndo: () => {
                    const last = undoStack.pop(); // Note: mutates undoStack
                    store.dispatch(setCurrentPageDataBundle(last));
                },
                args: [],
            }));
            this.emitChangesTimeout = null;
        }, env.normalTypingDebounceMillis);
    }
    /**
     * @param {UploadsEntry|null} img
     */
    handleSocialImageChanged(img) {
        if (img) {
            const tmp = new Image();
            tmp.onload = () => {
                this.emitChanges(mut => {
                    mut.meta.socialImage = {src: img.fileName, mime: img.mime,
                        width: tmp.naturalWidth, height: tmp.naturalHeight};
                });
            };
            tmp.src = urlUtils.makeAssetUrl(`/public/uploads/${img.fileName}`);
        } else {
            this.emitChanges(mut => {
                mut.meta.socialImage = null;
            });
        }
    }
}

/**
 * @returns {Promise<Boolean>}
 */
function savePageToBackend() {
    const data = toTransferable(selectCurrentPageDataBundle(store.getState()).page, ['blocks', 'isPlaceholderPage']);
    //
    return http.put(`/api/pages/${data.type}/${data.id}`, data)
        .then(resp => {
            if (resp.ok !== 'ok') throw new Error('-');
            signals.emit('page-saved-to-backend');
            return true;
        })
        .catch(err => {
            window.console.error(err);
            toasters.editAppMain(__('Something unexpected happened.'), 'error');
            return false;
        });
}

/**
 * @param {[String, String, String]} triplet [blockId, isStoredToTreeId, pageId]
 * @param {PartialMenuLink} linkToAdd = null
 * @returns {Boolean|void} wasLinkToAddPresentInCurrentPage
 */
function setUpdatableMenuBlockInfo(triplet, linkToAdd = null) {
    linkedMenuBlockInfo = triplet;
    doReRenderLinkedMenu = false;
    if (!linkToAdd) return;
    const [menuBlockId, _menuBlockIsStoredToTreeId, _pageSlug] = triplet;
    updateBlockProps(menuBlockId, block => {
        if (!block) return; // $menuBlockId not present in current page block tree
        doReRenderLinkedMenu = true;
        const linkCreator = new CountingLinkItemFactory();
        const parsed = linkCreator.setGetCounterUsingTreeOf(block);
        return {changes: {
            tree: JSON.stringify([...parsed, linkCreator.makeLinkItem(linkToAdd)])
        }};
    });
    return doReRenderLinkedMenu;
}

/**
 * @param {PartialMenuLink} link
 * @param {String} menuBlockId
 * @param {String} menuBlockIsStoredToTreeId
 * @param {Array<RawBlock} blocks
 * @returns {Array<RawBlock}
 */
function addLinkToMenu(link, menuBlockId, menuBlockIsStoredToTreeId, blocks) {
    const out = cloneObjectDeep(blocks);
    const linkCreator = new CountingLinkItemFactory();
    const rootOrInnerTree = blockTreeUtils.findTree(menuBlockIsStoredToTreeId, out);
    const [menuBlock] = blockTreeUtils.findBlock(menuBlockId, rootOrInnerTree);
    const parsed = linkCreator.setGetCounterUsingTreeOf(menuBlock);
    // Mutates $out
    overrideData(menuBlock, {
        tree: JSON.stringify([...parsed, linkCreator.makeLinkItem(link)])
    });
    return out;
}

/**
 * @param {Page} page
 */
function reRenderLinkedMenu(page) {
    const [menuBlockId, _menuBlockIsStoredToTreeId, _pageId] = linkedMenuBlockInfo;
    updateBlockProps(menuBlockId, block => {
        if (!block) return; // $menuBlockId not present in current page block tree
        const tree = JSON.parse(block.tree);
        const allButLast = tree.slice(0, tree.length - 1);
        const last = tree.at(-1);
        return {changes: {tree: JSON.stringify([...allButLast, {...last, ...{
            text: page.title,
            slug: page.slug,
        }}])}};
    });
}

/**
 * @param {Page & {[additionalProps: String]: any;}} page
 * @param {Array<keyof Page|String>} notTheseKeys = [] Example: ['id', 'blocks' ...]
 * @return {{[key: String]: any;}} Clean object
 */
function toTransferable(page, notTheseKeys = []) {
    const allKeys = Object.keys(page);
    const onlyTheseKeys = allKeys.filter(key =>
        !key.startsWith('__') && notTheseKeys.indexOf(key) < 0
    );
    return objectUtils.clonePartially(onlyTheseKeys, page);
}

/**
 * @param {String|undefined} value
 * @return {String}
 */
function getNormalizedDescription(value) {
    return value || '';
}

export default () => {
    const initialData = {overrides: '[]'};
    return {
        name: 'PageInfo',
        friendlyName: 'PageInfo',
        ownPropNames: Object.keys(initialData),
        initialData,
        defaultRenderer: 'sivujetti:block-auto',
        icon: 'file-info',
        reRender: () => '', // Do nothing
        createSnapshot: () => ({}),
        editForm: PageInfoBlockEditForm,
    };
};

/**
 * @typedef PageInfoSnapshot
 *
 * @prop {String} title
 * @prop {String} slug
 * @prop {String} path
 * @prop {String} description
 * ... possibly more props (Own fields)
 */

export {makeSlug, makePath, setUpdatableMenuBlockInfo, addLinkToMenu, toTransferable};
