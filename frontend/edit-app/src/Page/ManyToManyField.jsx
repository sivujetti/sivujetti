import {__, http, env, FormGroupInline, LoadingSpinner} from '@sivujetti-commons-for-edit-app';
import store, {observeStore, selectCurrentPageDataBundle} from '../store.js';

class ManyToManyField extends preact.Component {
    // k;
    /**
     * @param {{field: PageTypeField; emitChanges: (setChanges: (pageToMutate: Page) => void) => void;}} props
     */
    constructor(props) {
        super(props);
        if (props.field.dataType.type !== 'many-to-many')
            throw new Error('Not implemented yet');
        this.k = props.field.name; // e.g. 'categories'
        this.state = {
            currentManyToManyIdList: getManyToManyValue(selectCurrentPageDataBundle(store.getState()).page, this.k),
            manyToManyPages: undefined,
        };
        observeStore(s => selectCurrentPageDataBundle(s), ({page}) => {
            if (this.state.currentManyToManyIdList.toString() !== page[this.k].toString())
               this.setState({currentManyToManyIdList: getManyToManyValue(page, this.k)});
        });
        this.fetchManyToManyPages(props.field.dataType.rel);
    }
    /**
     * @access protected
     */
    render({field}, {currentManyToManyIdList, manyToManyPages}) {
        return <FormGroupInline className="prop-widget-many-to-many">
            <label class="form-label" htmlFor="layout">{ __(field.friendlyName) }</label>
            { Array.isArray(manyToManyPages) ? manyToManyPages.length
                ? manyToManyPages.map(({id, title}) => <label class="form-checkbox mt-0 text-ellipsis" key={ id }>
                    <input
                        value={ id }
                        onClick={ this.emitManyToManyIdSelectedOrUnselected.bind(this) }
                        checked={ currentManyToManyIdList.indexOf(id) > -1 }
                        type="checkbox"
                        class="form-input"/><i class="form-icon"></i> <span>{ title }</span>
                    </label>)
                : <p>{ __('No %s found', __(field.friendlyNamePlural)) }</p>
            : <LoadingSpinner/> }
        </FormGroupInline>;
    }
    /**
     * @param {String} pageTypeName
     * @access private
     */
    fetchManyToManyPages(pageTypeName) {
        http.get(`/api/pages/${pageTypeName}`)
            .then(pages => { this.setState({manyToManyPages: pages}); })
            .catch(env.window.console.error);
    }
    /**
     * @param {Event} e
     * @access private
     */
    emitManyToManyIdSelectedOrUnselected(e) {
        const val = e.target.checked ? 1 : 0;
        const manyToManyPageId = e.target.value;
        const bundle = selectCurrentPageDataBundle(store.getState());
        const cur = bundle.page[this.k].indexOf(manyToManyPageId) > -1 ? 1 : 0;
        let newManyToManyIdList; // e.g. categories
        if (cur === 0 && val === 1) {
            newManyToManyIdList = bundle.page[this.k].concat([manyToManyPageId]);
        } else if (cur === 1 && val === 0) {
            newManyToManyIdList = bundle.page[this.k].filter(manyToManyPageId2 => manyToManyPageId2 !== manyToManyPageId);
        } else return;
        this.props.emitChanges(mut => {
            mut[this.k] = newManyToManyIdList;
        });
    }
}

/**
 * @param {Page} from
 * @param {String} propName
 * @returns {Array<String>}
 */
function getManyToManyValue(from, propName) {
    return from[propName].slice(0);
}

export default ManyToManyField;
