import {__, http, env, Icon, LoadingSpinner, urlUtils} from '@sivujetti-commons-for-edit-app';
import UploadButton from './UploadButton.jsx';

const placeholderImageSrc = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD6AQMAAAAho+iwAAAABlBMVEX19fUzMzO8wlcyAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAIElEQVRoge3BAQ0AAADCoPdPbQ8HFAAAAAAAAAAAAD8GJhYAATKiH3kAAAAASUVORK5CYII=';

const UPLOADS_DIR_PATH = 'public/uploads/';

const fetchedFiles = {
    nonImages: null,
    onlyImages: null,
};

class FileUploader extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({files: null});
        const {onlyImages} = this.props;
        this.fetchOrGetUploads(onlyImages)
            .then((fileGroup) => { this.setState({files: fileGroup}); });
    }
    /**
     * @param {{onEntryClicked?: (entry: UploadsEntry) => void; mode?: 'pick', numColumns?: Number, hideUploadButton?: Boolean;}} props
     * @param {Object} state
     * @access protected
     */
    render({mode, numColumns, hideUploadButton}, {files}) {
        const ItemEl = mode !== 'pick' ? 'span' : 'button';
        return <div>
            { hideUploadButton !== true
                ? <UploadButton
                    onUploadStarted={ this.addNewFile.bind(this) }
                    onUploadEnded={ this.markFileAsUploaded.bind(this) }/>
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
                    <p style="margin-top: 1rem">{ __('You don\'t have any documents.') }</p>
                </div>
            : <LoadingSpinner className="mt-2"/> }</div>
        </div>;
    }
    /**
     * @param {UploadsEntry} file
     * @access private
     */
    addNewFile(file) {
        const k = file.mime.startsWith('image/') ? 'onlyImages' : 'nonImages';
        if (fetchedFiles[k] === null) fetchedFiles[k] = [];
        fetchedFiles[k].push(file);
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
     * @param {Boolean} onlyImages
     * @returns {Promise<UploadsEntry[]>}
     * @access private
     */
    fetchOrGetUploads(onlyImages) {
        const [k, q] = onlyImages ? ['onlyImages', '$eq'] : ['nonImages', '$neq'];
        //
        const cached = fetchedFiles[k];
        if (cached) return Promise.resolve(cached);
        //
        return http.get(`/api/uploads/${JSON.stringify({mime: {[q]: 'image/*'}})}`)
            .then(files => {
                fetchedFiles[k] = files.map(completeBackendUploadsEntry);
                return fetchedFiles[k];
            })
            .catch(env.window.console.error);
    }
    /**
     * @param {UploadsEntry} i
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
