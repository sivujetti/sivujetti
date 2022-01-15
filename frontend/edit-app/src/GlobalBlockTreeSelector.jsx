import {http, __, env} from '@sivujetti-commons-for-edit-app';
import LoadingSpinner from './commons/LoadingSpinner.jsx';

class GlobalBlockTreeSelector extends preact.Component {
    /**
     * @param {{onItemSelected: (globalBlockTree: RawGlobalBlockTree) => void; isVisible: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.setState({globalBlockTrees: undefined, selectedGlobalBlockTreeId: '-'});
    }
    /**
     * @access protected
     */
    componentWillReceiveProps({isVisible}) {
        if (isVisible && this.state.globalBlockTrees === undefined)
            this.fetchGlobalBlockTreesAndPutToState();
    }
    /**
     * @access protected
     */
    render({isVisible}, {globalBlockTrees, selectedGlobalBlockTreeId}) {
        if (!isVisible || globalBlockTrees === undefined) return null;
        //
        if (globalBlockTrees !== null) return globalBlockTrees.length
            ? <select
                value={ selectedGlobalBlockTreeId }
                onChange={ e => this.changeSelectedGlobalBlockTree(e.target.value) }
                class="form-input form-select tight mb-2">
                <option value="-"> - </option>{ globalBlockTrees.map(gbt =>
                    <option value={ gbt.id }>{ gbt.name }</option>
                ) }
            </select>
            : <p>{ __('No %s found', __('global blocks')) }</p>;
        //
        return <LoadingSpinner className="mb-2 pb-2 ml-1"/>;
    }
    /**
     * @access private
     */
    fetchGlobalBlockTreesAndPutToState() {
        this.setState({globalBlockTrees: null});
        http.get('/api/global-block-trees')
            .then(globalBlockTrees => {
                if (globalBlockTrees.length) {
                    this.setState({globalBlockTrees: globalBlockTrees,
                                   selectedGlobalBlockTreeId: globalBlockTrees[0].id});
                    this.props.onItemSelected(globalBlockTrees[0]);
                } else {
                    this.setState({globalBlockTrees,
                                   selectedGlobalBlockTreeId: '-'});
                }
            })
            .catch(env.window.console.error);
    }
    /**
     * @param {String} globalBlockTreeId
     * @access private
     */
    changeSelectedGlobalBlockTree(globalBlockTreeId) {
        if (globalBlockTreeId === '-') return;
        this.setState({selectedGlobalBlockTreeId: globalBlockTreeId});
        this.props.onItemSelected(this.state.globalBlockTrees.find(({id}) => id === globalBlockTreeId));
    }
}

export default GlobalBlockTreeSelector;
