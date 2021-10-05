import {__, urlUtils, http, env} from '@sivujetti-commons';
import Icon from '../../../commons/Icon.jsx';
import Tabs from '../../../commons/Tabs.jsx';
import LoadingSpinner from '../../../commons/LoadingSpinner.jsx';
import {timingUtils} from '../utils.js';
import UploadButton from './UploadButton.jsx';

const INITIAL_CACHE_KEY = '';
const UPLOADS_DIR_PATH = 'public/uploads/';

class UploadsManager extends preact.Component {
    // title;
    // tabs;
    // searchResultCache;
    // onSearchTermTypedDebounced;
    // searchTerm;
    // searchedAtLeastOnce;
    /**
     * @param {{onEntryClicked: (image: UploadsEntry) => void; onlyImages?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {files: null, currentTabIdx: 0, fetching: true, showEditButtons: false};
        this.title = props.onlyImages !== true ? __('Documents') : __('Images');
        this.tabs = preact.createRef();
        this.searchResultCache = new Map();
        this.onSearchTermTypedDebounced = timingUtils.debounce(
            this.onSearchTermTyped.bind(this), 200);
        this.fetchFilesAndSetToState(props.onlyImages, INITIAL_CACHE_KEY, true);
    }
    /**
     * @access protected
     */
    render(_, {files, currentTabIdx}) {
        return <div>
            <Tabs
                links={ [this.title, __('Upload')] }
                onTabChanged={ idx => this.setState({currentTabIdx: idx}) }
                ref={ this.tabs }/>
            <div class={ currentTabIdx === 0 ? 'mt-8' : 'd-none' }>
                <div class="container"><div class="columns mt-8 mb-8">
                    <div class="has-icon-right col-10">
                        <input class="form-input" placeholder={ __('Search') } onInput={ this.onSearchTermTypedDebounced }/>
                        <i class="sivujetti-form-icon"><Icon iconId="search" className="size-sm"/></i>
                    </div>
                </div></div>
                { files ? files.length
                    ? <div class="item-grid image-grid img-auto">{ files.map(entry =>
                        <button
                            onClick={ () => { this.props.onEntryClicked(entry); } }
                            className="btn btn-icon"
                            type="button">
                            { entry.mime.startsWith('image/')
                                ? <span class="img-ratio"><img src={ `${urlUtils.assetBaseUrl}${UPLOADS_DIR_PATH}${entry.baseDir}${entry.fileName}` }/></span>
                                : <span>{ entry.mime }</span> }
                            <span class="caption text-ellipsis">{ entry.fileName }</span>
                        </button>
                    ) }</div>
                    : <p class="my-0">{ this.searchTerm !== INITIAL_CACHE_KEY || this.searchedAtLeastOnce
                        ? __('No results for "%s"', this.searchTerm)
                        : __('No uploads yet')
                    }.</p>
                : <LoadingSpinner/> }</div>
            <div class={ currentTabIdx !== 1 ? 'd-none' : 'mt-8' }>
                <UploadButton onFileUploaded={ this.handleFileUploaded.bind(this) }/>
            </div>
        </div>;
    }
    /**
     * @param {UploadsEntry} entry
     * @access private
     */
    handleFileUploaded(entry) {
        this.setState({files: this.state.files.concat(entry), message: null});
        this.searchResultCache = new Map();
        this.tabs.current.changeTab(0);
    }
    /**
     * @param {String} term
     * @param {Boolean|undefined} onlyImages
     * @param {Boolean} isInitial
     * @returns {Promise<Array<UploadsEntry>>}
     * @access private
     */
    fetchFiles(term, onlyImages, isInitial) {
        if (this.searchResultCache.has(term))
            return Promise.resolve(this.searchResultCache.get(term));
        if (!isInitial)
            this.setState({fetching: true});
        //
        const filters = {};
        if (onlyImages) filters.mime = {$eq: 'image/*'};
        if (term) filters.fileName = {$contains: term};
        //
        return http.get('/api/uploads' + (filters.mime || filters.fileName
                                            ? `/${JSON.stringify(filters)}`
                                            : ''))
            .then(files => {
                this.searchResultCache.set(term, files);
                return this.searchResultCache.get(term);
            });
    }
    /**
     * @param {Boolean|undefined} onlyImages
     * @param {String} searchTerm
     * @param {Boolean} isInitial = false
     * @access private
     */
    fetchFilesAndSetToState(onlyImages, searchTerm, isInitial = false) {
        this.searchTerm = searchTerm;
        this.searchedAtLeastOnce = !isInitial;
        this.fetchFiles(searchTerm, onlyImages, isInitial)
            .then(files => { this.setState({files, fetching: false}); })
            .catch(env.window.console.error);
    }
    /**
     * @param {InputEvent} e
     * @access private
     */
    onSearchTermTyped(e) {
        if (!this.state.fetching)
            this.fetchFilesAndSetToState(this.props.onlyImages, e.target.value);
    }
}

export default UploadsManager;
export {UPLOADS_DIR_PATH};
