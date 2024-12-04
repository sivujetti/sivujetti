import {env, http, urlUtils} from '@sivujetti-commons-for-web-pages';
import {placeholderImageSrc} from '../shared-inline.js';
import setFocusTo from './auto-focusers.js';
import {__, api} from './edit-app-singletons.js'; // ctrl + f edit-app-singletons.js'
import UploadButton from './UploadButton.jsx';
import {Icon} from './Icon.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import {getAndPutAndGetToLocalStorage, putToLocalStorage} from './local-storage-utils.js';
import Tabs from './Tabs.jsx';
import {timingUtils} from './utils.js';

const UPLOADS_DIR_PATH = 'public/uploads/';

const fetchedFiles = {
    // 'onlyImages':             array,
    // 'onlyImages:searchTerm1': array,
    // 'onlyImages:searchTerm2': array,
    // 'onlyImages:...':         array,
    // 'nonImages':              array,
    // 'nonImages:searchTerm1':  array,
    // 'nonImages:searchTerm2':  array,
    // 'nonImages:...':          array,
};

class FileUploader extends preact.Component {
    // initialTabIdx;
    // dropAreaEl;
    // uploadButton;
    // fetchOrGetUploadsThrottled;
    /**
     * @param {{onEntryClicked?: (entry: UploadsEntry|null) => void; mode?: 'pick'; showInitially?: 'images'|'files'; onlyImages?: boolean; numColumns?: number; hideUploadButton?: boolean; showClearItem?: boolean; autoFocusToFilterInput?: boolean;}} props
     */
    constructor(props) {
        super(props);
        this.dropAreaEl = preact.createRef();
        this.uploadButton = preact.createRef();
    }
    /**
     * @access protected
     */
    componentWillMount() {
        this.initialTabIdx = (this.props.showInitially || 'images') === 'images' ? 0 : 1;
        const tabName = tabIdxToName(this.initialTabIdx);
        this.setState({
            files: null,
            currentTabName: tabName,
            displayAsGrid: getAndPutAndGetToLocalStorage('grid', 'sivujettiDisplayImageListAs') === 'grid',
            currentFilterStr: '',
            fetchingResults: false,
        });
        this.fetchSelectedFileGroupAndSetToState(tabName);
        this.fetchOrGetUploadsThrottled = timingUtils.debounce(async (input) => {
            this.setState({fetchingResults: true});
            const files = await this.fetchOrGetUploads(this.state.currentTabName, input);
            this.setState({files, fetchingResults: false});
        }, env.normalTypingDebounceMillis);
    }
    /**
     * @access protected
     */
    render({mode, hideUploadButton, onlyImages, showClearItem}, {files, displayAsGrid, currentFilterStr}) {
        const itemSettings = getListItemSettings(displayAsGrid, mode);
        const showCrudButtons = mode !== 'pick';
        return [
        !onlyImages
            ? <div class="mb-2 pb-2">
                <Tabs
                    links={ [__('Images'), __('Files')] }
                    onTabChanged={ this.handleTabChanged.bind(this) }
                    initialTabIdx={ this.initialTabIdx }
                    className="text-tinyish mt-0"/>
            </div>
            : null,
        <div
            class="file-drop-area"
            { ...(hideUploadButton !== true
                ? {
                    'onDragOver': this.handleDragEnter.bind(this),
                    'onDragEnter': this.handleDragEnter.bind(this),
                    'onDragLeave': this.handleDragLeave.bind(this),
                    'onDrop': e => {
                        this.handleDragLeave(e);
                        this.uploadButton.current.handleFilesSelected(Array.from(e.dataTransfer.files));
                    },
                    'data-drop-files-here-text': __('Drop files here'),
                }
                : {}
            ) }
            ref={ this.dropAreaEl }>
            { hideUploadButton !== true
                ? <UploadButton
                    onUploadStarted={ this.addNewFile.bind(this) }
                    onUploadEnded={ this.markFileAsUploaded.bind(this) }
                    ref={ this.uploadButton }/>
                : null
            }
            <div class="p-absolute" style={ `right: 0; top: ${hideUploadButton !== true ? '0' : '-1.36rem'}` }>
                <button
                    onClick={ () => this.setGetDisplayAsGrid(false) }
                    class={ `btn btn-sm with-icon-inline${displayAsGrid ? '' : ' btn-selected'}` }><Icon iconId="list" className="size-sm"/></button>
                <button
                    onClick={ () => this.setGetDisplayAsGrid(true) }
                    class={ `btn btn-sm with-icon-inline${displayAsGrid ? ' btn-selected' : ''} ml-1` }><Icon iconId="layout-grid" className="size-sm"/></button>
            </div>
            <div style={ hideUploadButton !== true ? '' : 'margin-top: 1rem;' }>{ files
                ? [
                    files.length || currentFilterStr
                        ? this.printFilterInput(files)
                        : null,
                    files.length
                        ? displayAsGrid
                            ? this.printItemsAsGrid(itemSettings, showClearItem, showCrudButtons)
                            : this.printItemsAsList(mode, itemSettings, showClearItem, showCrudButtons):
                        null,
                    !files.length
                        ? <div>
                            <p style="margin-top: 1rem">{ !currentFilterStr
                                ? __('No uploads yet.')
                                : __('No results found for the term "%s".', currentFilterStr)
                            }</p>
                        </div>
                        : null
                ]
                : <LoadingSpinner className="mt-2"/>
            }</div>
        </div>,
        ];
    }
    /**
     * @param {tabName} tabName
     * @access private
     */
    async fetchSelectedFileGroupAndSetToState(tabName) {
        const fileGroup = await this.fetchOrGetUploads(tabName);
        this.setState({files: fileGroup});
    }
    /**
     * @param {Array<UploadsEntry>} files
     * @returns {preact.ComponentChild}
     * @access private
     */
    printFilterInput(files) {
        const {currentFilterStr} = this.state;
        if (!currentFilterStr && files.length < 5)
            return null;

        const filterInput = <input
            onInput={ this.handleFilterTyped.bind(this) }
            value={ currentFilterStr }
            class="form-input mb-2"
            placeholder={ __('Filter') }
            ref={ el => {
                if (!el || !this.props.autoFocusToFilterInput || this.filterAutofocusedPerformed)
                    return;
                this.filterAutofocusedPerformed = true;
                setTimeout(() => { setFocusTo({current: el}); }, 40);
            } }/>;

        return <div class={ `my-2${!currentFilterStr ? '' : ' has-icon-right'}` }>
            { !currentFilterStr
                ? filterInput
                : [
                    filterInput,
                    <button
                        onClick={ this.clearFilter.bind(this) }
                        class="sivujetti-form-icon btn no-color"
                        type="button">
                        <Icon iconId="x" className="size-xs color-dimmed"/>
                    </button>
                ]
            }
        </div>;
    }
    /**
     * @param {ListItemSettings} settings
     * @param {boolean} showClearItem
     * @param {boolean} showCrudButtons
     * @returns {preact.VNode}
     * @access private
     */
    printItemsAsGrid([imgItemCfg, fileItemCfg], showClearItem, showCrudButtons) {
        const {numColumns} = this.props;
        const cls1 = !numColumns ? '' : ({'3': ' three'}[numColumns] || '');
        const cls2 = this.state.currentTabName !== 'onlyImages' ? '' : ' only-images';
        const createAttrs = (fileName, friendlyName = null, isUploaded = true) => ({
            class: `box text-center p-relative list-item${isUploaded ? '' : ' loading'}`,
            title: fileName,
            key: friendlyName || fileName
        });
        return <div class={ `live-files-list item-grid p-relative mt-2 pt-2${cls1}${cls2}` }>{ [
            this.printFetchLoadSpinner(),
            !showClearItem ? null : <article { ...createAttrs(__('No image')) }>
                <button
                    class="img-ratio btn pt-0"
                    onClick={ () => this.props.onEntryClicked(null) }
                    style="background: var(--color-bg-very-light); border-color: transparent;">
                    <span class="d-inline-block p-absolute flex-centered" style="height: 100%;">
                        <Icon iconId="ban"/>
                    </span>
                </button>
                <div class="text-ellipsis my-2 px-2"><b>({ __('No image').toLowerCase() })</b></div>
            </article>,
            this.state.files.map(f => {
                const {friendlyName, fileName, baseDir, ext, mime, createdAt} = f;
                const isUploaded = createdAt > 0;
                const isImage = mime.startsWith('image/');
                const Elem = isImage ? imgItemCfg.el : fileItemCfg.el;
                return <article { ...createAttrs(fileName, friendlyName, isUploaded) }>
                    { !isImage
                        ? <Elem { ...fileItemCfg.props } onClick={ () => this.handleEntryClicked(f) }>
                            <Icon iconId="file" className="mb-2"/>
                            <b class="d-block my-1 text-ellipsis" style="font-weight: 400;">{ friendlyName }</b>
                            <span class="d-block color-dimmed text-small text-uppercase" style="font-weight: 300;">{ ext }</span>
                        </Elem>
                        : [
                            <Elem
                                class={ `img-ratio${imgItemCfg.classes}` }
                                onClick={ () => this.handleEntryClicked(f) }>
                                <img src={ isUploaded ? `${urlUtils.assetBaseUrl}${UPLOADS_DIR_PATH}${baseDir}${fileName}` : placeholderImageSrc }/>
                            </Elem>,
                            <div class="text-ellipsis my-2 px-2"><b>{ friendlyName || fileName }</b></div>,
                        ]
                    }
                    { showCrudButtons
                        ? <button
                            onClick={ e => this.openMoreMenu(f, e) }
                            class="btn btn-sm with-icon-inline p-absolute focus-default more-menu-btn"
                            type="button">
                            <Icon iconId="dots" className="size-sm"/>
                        </button>
                        : null
                    }
                </article>;
            })
        ] }</div>;
    }
    /**
     * @param {'pick'|null} mode
     * @param {ListItemSettings} settings
     * @param {boolean} showClearItem
     * @param {boolean} showCrudButtons
     * @returns {preact.VNode}
     * @access private
     */
    printItemsAsList(mode, [imgItemCfg, fileItemCfg], showClearItem, showCrudButtons) {
        const createAttrs = (f, classes = 'btn btn-link col-12 my-0 px-0', fileName, friendlyName) => ({
            class: `list-item text-ellipsis text-left with-icon p-relative pl-1 ${classes}`,
            onClick: () => this.handleEntryClicked(f),
            style: 'height: 3.4rem',
            title: fileName,
            key: friendlyName || fileName,
        });
        const clses = 'list with-more-menu-links table-list selectable-items live-files-list mt-2 pt-1';
        return <div class="p-relative">{ this.printFetchLoadSpinner() }<ul class={ clses }>{ [
            !showClearItem ? null : <li class="p-0">
                <button { ...createAttrs(null, undefined, __('No image')) }>
                    <span class="ml-1 mr-2">
                        <span class="img-ratio" style="min-width: 4.8rem; background: var(--color-bg-very-light);">
                            <span class="d-inline-block p-absolute flex-centered" style="height: 100%;">
                                <Icon iconId="ban" className="mr-0"/>
                            </span>
                        </span>
                    </span>
                    <span class="h6 text-ellipsis mx-1 my-0 pr-0">({ __('No image').toLowerCase() })</span>
                </button>
            </li>,
            this.state.files.map(f => {
                const {friendlyName, fileName, baseDir, ext, mime, createdAt} = f;
                const isUploaded = createdAt > 0;
                const isImage = mime.startsWith('image/');
                const cfgItem = isImage ? imgItemCfg : fileItemCfg;
                const Elem = cfgItem.el;
                const titleCls = mode !== 'pick' ? '' : ' pr-0';
                return <li class={ `p-0${isUploaded ? '' : ' loading'}` }>
                    <Elem { ...createAttrs(f, cfgItem.classes, fileName, friendlyName) }>
                        { isImage
                            ? [
                                <span class="ml-1 mr-2">
                                    <span class="img-ratio" style="min-width: 4.8rem;">
                                        <img src={ isUploaded ? `${urlUtils.assetBaseUrl}${UPLOADS_DIR_PATH}${baseDir}${fileName}` : placeholderImageSrc }/>
                                    </span>
                                </span>,
                                <span class={ `h6 text-ellipsis mx-1 my-0${titleCls}` }>{ friendlyName || fileName }</span>,
                            ]
                            : [
                                <span class="mr-2">
                                    <Icon iconId="file" className="mb-2 mr-1"/>
                                </span>,
                                <span class="text-ellipsis mr-1 my-0">
                                    <b class="d-block">{ friendlyName }</b>
                                    <span class="d-block color-dimmed text-small text-uppercase" style="font-weight: 300;">{ ext }</span>
                                </span>,
                            ]
                        }
                        { showCrudButtons
                            ? <button
                                onClick={ e => this.openMoreMenu(f, e) }
                                class="btn btn-sm with-icon-inline p-absolute focus-default p-0 pl-1 more-menu-btn"
                                type="button">
                                <Icon iconId="dots" className="size-sm mr-1"/>
                            </button>
                            : null
                        }
                    </Elem>
                </li>;
            })
        ] }</ul></div>;
    }
    /**
     * @returns {preact.ComponentChild}
     * @access private
     */
    printFetchLoadSpinner() {
        return this.state.fetchingResults
            ? <div class="loading-spinner-cover p-absolute pt-2 col-12" style="z-index: 2; height: 100%;">
                <div class="loading mt-8"></div>
            </div>
            : null;
    }
    /**
     * @param {UploadsEntry} file
     * @access private
     */
    addNewFile(file) {
        const fileType = this.props.onlyImages || file.mime.startsWith('image/') ? 'onlyImages' : 'nonImages';
        const k = `${fileType}:${this.state.currentFilterStr}`;
        if (fetchedFiles[k]) fetchedFiles[k].unshift(file);

        if (this.state.currentTabName === fileType)
            this.setState({files: cloneArrShallow(fetchedFiles[k])});
    }
    /**
     * @param {UploadsEntry} file
     * @param {boolean} ok
     * @access private
     */
    markFileAsUploaded(file, ok) {
        const fileType = this.props.onlyImages || file.mime.startsWith('image/') ? 'onlyImages' : 'nonImages';
        const k = `${fileType}:${this.state.currentFilterStr}`;
        if (fetchedFiles[k])
            fetchedFiles[k] = ok
                ? fetchedFiles[k].map(f => f.friendlyName !== file.friendlyName ? f : {...file})
                : fetchedFiles[k].filter(({friendlyName}) => friendlyName !== file.friendlyName);

        if (this.state.currentTabName === fileType)
            this.setState({files: cloneArrShallow(fetchedFiles[k])});
    }
    /**
     * @param {tabName} tabName
     * @param {string} searchTerm = ''
     * @returns {Promise<UploadsEntry[]>}
     * @access private
     */
    async fetchOrGetUploads(tabName, searchTerm = '') {
        const k = `${tabName}:${searchTerm}`;
        const fetched = fetchedFiles[k];
        if (fetched) return Promise.resolve(fetched);
        //
        const type = tabName === 'onlyImages' ? 'images' : 'files';
        const fileNameFilterSeg = !searchTerm ? '' : `/${encodeURIComponent(searchTerm)}`;
        try {
            const files = await http.get(`/api/uploads/${type}${fileNameFilterSeg}`);
            fetchedFiles[k] = files.map(completeBackendUploadsEntry);
            return fetchedFiles[k];
        } catch (message) {
            return env.window.console.error(message);
        }
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleDragEnter(e) {
        const target = e.target === this.dropAreaEl.current ? e.target : e.target.closest('.file-drop-area');
        if (this.handleDragEvent(e, target)) this.dropAreaEl.current.classList.add('hovering');
    }
    /**
     * @param {Event} e
     * @access private
     */
    handleDragLeave(e) {
        // todo if this.escPressed return
        if (this.handleDragEvent(e)) this.dropAreaEl.current.classList.remove('hovering');
    }
    /**
     * @param {Event} e
     * @param {HTMLElement} target = e.target
     * @returns {boolean}
     * @access private
     */
    handleDragEvent(e, target = e.target) {
        if (target !== this.dropAreaEl.current) return false;
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    /**
     * @param {number} toIdx
     * @access private
     */
    async handleTabChanged(toIdx) {
        const next = tabIdxToName(toIdx);
        if (this.state.currentTabName !== next) {
            this.setState({currentTabName: next});
            const fileGroup = await this.fetchOrGetUploads(next);
            this.setState({files: fileGroup});
        }
    }
    /**
     * @param {UploadsEntry} f
     * @access private
     */
    handleEntryClicked(f) {
        if (this.props.mode !== 'pick') return;
        this.props.onEntryClicked(f);
    }
    /**
     * @param {boolean} to
     * @access private
     */
    setGetDisplayAsGrid(to) {
        putToLocalStorage(to ? 'grid' : 'list', 'sivujettiDisplayImageListAs');
        this.setState({displayAsGrid: to});
    }
    /**
     * @param {UploadsEntry} f
     * @param {Event} e
     * @access private
     */
    openMoreMenu(f, e) {
        this.setState({entryWithNavOpened: f});
        api.contextMenu.open(e, {
            getLinks: () => [
                {text: __('Edit'), title: __('Edit item'), id: 'edit'},
                {text: __('Delete'), title: __('Delete item'), id: 'delete'},
            ],
            onItemClicked: this.handleContextMenuLinkClicked.bind(this),
            onMenuClosed: () => this.setState({entryWithNavOpened: null}),
        });
    }
    /**
     * @param {ContextMenuLink} link
     * @access private
     */
    handleContextMenuLinkClicked(link) {
        if (link.id === 'edit')
            alert(__('This feature is not implemented yet.'));
        else if (link.id === 'delete')
            alert(__('This feature is not implemented yet.'));
    }
    /**
     * @param {UploadsEntry} file
     * @access private
     */
    deleteFile(file) {
        http.delete('/api/uploads/' +
                    encodeURIComponent(file.fileName) + '/' +
                    encodeURIComponent(file.baseDir || '-'))
            .then(info => {
                if (info.ok) {
                    this.setState({files: this.state.files.filter(file2 => file2 !== file)});
                    this.searchResultCache = new Map();
                } else throw new Error(info);
            })
            .catch(err => {
                env.console.error(err);
                // toasters.main('Tiedoston poistaminen ei onnistunut.', 'error');
            });
    }
    /**
     * @param {Event?} e
     * @access private
     */
    handleFilterTyped(e) {
        if (this.fetchingResults)
            return;

        const input = e ? e.target.value : '';
        if (this.state.currentFilterStr !== input)
            this.setState({currentFilterStr: input});

        this.fetchOrGetUploadsThrottled(input);
    }
    /**
     * @access private
     */
    clearFilter() {
        this.setState({currentFilterStr: '', fetchingResults: false});
        this.fetchSelectedFileGroupAndSetToState(this.state.currentTabName);
    }
}

/**
 * Note: mutates $entry.
 *
 * @param {{fileName: string; baseDir: string; mime: string; friendlyName: string; createdAt: number; updatedAt: number;}} entry
 * @returns {UploadsEntry}
 */
function completeBackendUploadsEntry(entry) {
    Object.assign(entry, {ext: entry.fileName.split('.').pop()});
    if (entry.createdAt === 0) entry.createdAt = Math.floor(Date.now() / 1000);
    if (entry.updatedAt === 0) entry.updatedAt = entry.createdAt;
    return entry;
}

/**
 * @param {Array<{[key: string]: any;}>} arr
 * @returns {Array<{[key: string]: any;}>}
 */
function cloneArrShallow(arr) {
    return arr.map(itm => ({...itm}));
}

/**
 * @param {number} idx
 * @returns {tabName}
 */
function tabIdxToName(idx) {
    return idx === 0 ? 'onlyImages' : 'nonImages';
}

/**
 * @param {boolean} displayAsGrid
 * @param {'pick'=} mode
 * @returns {ListItemSettings} [ImgListItemElSettings, FileListItemElSettings]
 */
function getListItemSettings(displayAsGrid, mode) {
    if (displayAsGrid)
        return mode !== 'pick'
            ? [{el: 'span', classes: ''}, {el: 'div', props: {}}]
            : [{el: 'button', classes: ' btn btn-link pt-0 pl-0'}, {el: 'button', props: {class: 'btn btn-link pt-2', style: 'height: 100%;'}}];
    return mode !== 'pick'
        ? [{el: 'span', classes: ''}, {el: 'span', classes: 'text-ellipsis text-left with-icon'}]
        : [{el: 'button', classes: 'btn btn-link col-12 my-0 px-0 '}, {el: 'button', props: {class: 'btn btn-link pt-2', style: 'height: 100%;'}}];
}

/**
 * @typedef {[{el: string; classes: string;}, {el: string; props?: Object; classes?: string;}]} ListItemSettings
 * @typedef {'onlyImages'|'nonImages'} tabName
 */

export default FileUploader;
