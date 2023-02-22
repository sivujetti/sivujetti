import {__, http, env, urlUtils, Icon, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import Tabs from './Tabs.jsx';
import UploadButton from './UploadButton.jsx';

const placeholderImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=';

const UPLOADS_DIR_PATH = 'public/uploads/';

const fetchedFiles = {
    nonImages: null,
    onlyImages: null,
};

class FileUploader extends preact.Component {
    // dropAreaEl;
    // uploadButton;
    /**
     * @param {{onEntryClicked?: (entry: UploadsEntry) => void; mode?: 'pick'; onlyImages?: Boolean; numColumns?: Number; hideUploadButton?: Boolean;}} props
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
        const tabName = this.props.onlyImages ? 'onlyImages' : 'nonImages';
        this.setState({files: null, currentTab: tabName});
        this.fetchOrGetUploads(tabName)
            .then((fileGroup) => { this.setState({files: fileGroup}); });
    }
    /**
     * @access protected
     */
    render({mode, numColumns, hideUploadButton, onlyImages}, {files}) {
        const ItemEl = mode !== 'pick' ? 'span' : 'button';
        return [
        <div class="mb-2 pb-2">
        <Tabs
            links={ [__('Images'), __('Files')] }
            onTabChanged={ this.handleTabChanged.bind(this) }
            initialIndex={ onlyImages ? 0 : 1 }
            className="text-tinyish mt-0"/>
        </div>,
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
            <div>{ files ? files.length
                ? <div class={ `live-files-list item-grid mt-2 pt-2${!numColumns ? '' : ({'3': ' three'}[numColumns] || '')}` }>{ files.map(f => {
                    const {friendlyName, fileName, baseDir, ext, mime, createdAt} = f;
                    const isUploaded = createdAt > 0;
                    return <article class={ `box text-center${isUploaded ? '' : ' loading'}` } title={ fileName } key={ friendlyName }>
                        { !mime.startsWith('image/')
                            ? <div>
                                <Icon iconId="file" className="mb-2"/>
                                <div class="mb-2 text-ellipsis"><b>{ friendlyName }</b></div>
                                <div class="text-small text-uppercase text-dimmed">{ ext }</div>
                            </div>
                            : [
                                <ItemEl
                                    class={ `img-ratio ${mode === 'pick' ? ' btn btn-link pt-0 pl-0' : ''}` }
                                    onClick={ () => this.handleEntryClicked(f) }>
                                    <img src={ isUploaded ? `${urlUtils.assetBaseUrl}${UPLOADS_DIR_PATH}${baseDir}${fileName}` : placeholderImageSrc }/>
                                </ItemEl>,
                                <div class="text-ellipsis my-2 px-2"><b>{ friendlyName || fileName }</b></div>,
                            ]
                        }
                    </article>;
                }) }</div>
                : <div>
                    <p style="margin-top: 1rem">{ __('No uploads yet.') }</p>
                </div>
            : <LoadingSpinner className="mt-2"/> }</div>
        </div>
        ];
    }
    /**
     * @param {UploadsEntry} file
     * @access private
     */
    addNewFile(file) {
        const k = file.mime.startsWith('image/') ? 'onlyImages' : 'nonImages';
        if (fetchedFiles[k] === null) fetchedFiles[k] = [];
        fetchedFiles[k].unshift(file);
        //
        this.setState({files: cloneArrShallow(fetchedFiles[k])});
    }
    /**
     * @param {UploadsEntry|null} file
     * @param {Boolean} ok
     * @access private
     */
    markFileAsUploaded(file, ok) {
        const k = file.mime.startsWith('image/') ? 'onlyImages' : 'nonImages';
        fetchedFiles[k] = ok
            ? fetchedFiles[k].map(f => f.friendlyName !== file.friendlyName ? f : {...file})
            : fetchedFiles[k].filter(({friendlyName}) => friendlyName !== file.friendlyName);
        //
        this.setState({files: cloneArrShallow(fetchedFiles[k])});
    }
    /**
     * @param {'onlyImages'|'nonImages'} tabName
     * @returns {Promise<UploadsEntry[]>}
     * @access private
     */
    fetchOrGetUploads(tabName) {
        const cached = fetchedFiles[tabName];
        if (cached) return Promise.resolve(cached);
        //
        const q = tabName === 'onlyImages' ? '$eq' : '$neq';
        return http.get(`/api/uploads/${JSON.stringify({mime: {[q]: 'image/*'}})}`)
            .then(files => {
                fetchedFiles[tabName] = files.map(completeBackendUploadsEntry);
                return fetchedFiles[tabName];
            })
            .catch(env.window.console.error);
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
     * @returns {Boolean}
     * @access private
     */
    handleDragEvent(e, target = e.target) {
        if (target !== this.dropAreaEl.current) return false;
        e.preventDefault();
        e.stopPropagation();
        return true;
    }
    /**
     * @param {Number} toIdx
     * @access private
     */
    handleTabChanged(toIdx) {
        const next = ['onlyImages', 'nonImages'][toIdx];
        if (this.state.currentTab !== next) {
            this.setState({currentTab: next});
            this.fetchOrGetUploads(next)
                .then((fileGroup) => { this.setState({files: fileGroup}); });
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
}

/**
 * Note: mutates $entry.
 *
 * @param {{fileName: String; baseDir: String; mime: String; friendlyName: String; createdAt: Number; updatedAt: Number;}} entry
 * @returns {UploadsEntry}
 */
function completeBackendUploadsEntry(entry) {
    Object.assign(entry, {ext: entry.fileName.split('.').pop()});
    if (entry.createdAt === 0) entry.createdAt = Math.floor(Date.now() / 1000);
    if (entry.updatedAt === 0) entry.updatedAt = entry.createdAt;
    return entry;
}

/**
 * @param {Array<{[key: String]: any;}>} arr
 * @returns {Array<{[key: String]: any;}>}
 */
function cloneArrShallow(arr) {
    return arr.map(itm => ({...itm}));
}

export default FileUploader;
export {UPLOADS_DIR_PATH, placeholderImageSrc};
