import {env, http} from '@sivujetti-commons-for-web-pages';
import setFocusTo from './auto-focusers.js';
import {__} from './edit-app-singletons.js';
import {Icon} from './Icon.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import {timingUtils} from './utils.js';

const EMPTY_SLUG = '';
const INITIAL_PAGES_LIST_BACKEND_HARD_LIMIT = 200;

/** @extends {preact.Component<{createFilterablePages(from: Array<PageStub>, currentFilterStr: string): Array<PageStub>; filterDivMarginRight?: number;}, any>} */
class FilterablePagesList extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.filterInput = preact.createRef();
        this.backendSearchCache = {
            // '':            array, // initial
            // 'searchTerm1': array,
            // 'searchTerm2': array,
            // '...':         array,
        };
        this.useLocalSearch = true;
        this.handleBackendSearchThrottled = null;
        this.setState({allPages: null, filteredPages: null});
        //
        this.fetchOrGetPageSearchResults('')
            .then(pages => {
                this.useLocalSearch = pages.length < INITIAL_PAGES_LIST_BACKEND_HARD_LIMIT;
                this.handleBackendSearchThrottled = this.useLocalSearch ? null : timingUtils.debounce(async (input) => {
                    const results = await this.fetchOrGetPageSearchResults(input);
                    this.setState({allPages: results, filteredPages: results});
                }, env.normalTypingDebounceMillis);
                this.setState({allPages: pages, filteredPages: getFilteredPages(pages, '')});
            })
            .catch(env.window.console.error);
    }
    /**
     * @access protected
     */
    componentDidMount() {
        setFocusTo(this.filterInput);
    }
    /**
     * @access protected
     */
    render({children, createFilterablePages, filterDivMarginRight}, {filteredPages, currentFilterStr}) {
        const p = createFilterablePages ? createFilterablePages(filteredPages, currentFilterStr) : filteredPages;
        const filterInput = <input
            onInput={ this.handleFilterTyped.bind(this) }
            value={ currentFilterStr }
            class="form-input mb-2"
            placeholder={ __('Filter') }
            ref={ this.filterInput }/>;
        return [
            <div
                class={ !currentFilterStr ? '' : 'has-icon-right' }
                style={ !filterDivMarginRight ? '' : `margin-right: ${parseFloat(filterDivMarginRight)}rem` }>
                { !currentFilterStr
                    ? filterInput
                    : [
                        filterInput,
                        <button
                            onClick={ () => this.handleFilterTyped(null) }
                            class="sivujetti-form-icon btn no-color"
                            type="button">
                            <Icon iconId="x" className="size-xs color-dimmed"/>
                        </button>
                    ]
                }
            </div>,
            Array.isArray(p)
                ? children(p)
                : <LoadingSpinner/>
        ];
    }
    /**
     * @param {Event?} e
     * @access private
     */
    handleFilterTyped(e) {
        const input = e ? e.target.value : '';
        if (this.state.currentFilterStr === input ||
            !this.state.allPages) return;
        //
        if (this.useLocalSearch)
            this.setState({
                filteredPages: getFilteredPages(this.state.allPages, input),
                currentFilterStr: input,
            });
        else {
            this.setState({currentFilterStr: input});
            if (input)
                this.handleBackendSearchThrottled(input);
            else {
                const allPages = this.backendSearchCache[''];
                this.setState({allPages, filteredPages: getFilteredPages(allPages, ''), currentFilterStr: ''});
            }
        }
    }
    /**
     * @param {string} searchTerm = ''
     * @returns {Promise<UploadsEntry[]>}
     * @access private
     */
    async fetchOrGetPageSearchResults(searchTerm = '') {
        const k = searchTerm;
        const fetched = this.backendSearchCache[k];
        if (fetched) return Promise.resolve(fetched);
        //
        const searchTermPart = !searchTerm ? '' : `?searchTerm=${encodeURIComponent(searchTerm)}`;
        try {
            const files = await http.get(`/api/pages/Pages${searchTermPart}`);
            this.backendSearchCache[k] = files;
            return this.backendSearchCache[k];
        } catch (message) {
            env.window.console.error(message);
        }
    }
}

/**
 * @param {Array<PageStub>} from
 * @param {string} filterStr = ''
 * @returns {Array<PageStub>}
 */
function getFilteredPages(from, filterStr = '') {
    if (!filterStr) return from.slice(0, 20);
    //
    return window.fuzzysort
        .go(filterStr, from, {keys: ['title', 'slug']})
        .map(({obj}) => obj);
}

/**
 * @typedef {{slug: string; title: string;}} PageStub
 */

export default FilterablePagesList;
export {EMPTY_SLUG};
