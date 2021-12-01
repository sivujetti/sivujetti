import {http, __, env} from './commons/main.js';
import LoadingSpinner from './commons/LoadingSpinner.jsx';

/**
 * @param {{onItemSelected: (globalBlockTree: RawGlobalBlockTree) => void; isVisible: Boolean;}} props
 */
const GlobalBlockTreeSelector = ({onItemSelected, isVisible}) => {
    const [globalBlockTrees, setGlobalBlockTrees] = preactHooks.useState(null);
    const [selectedGlobalBlockTreeId, setSelectedGlobalBlockTreeId] = preactHooks.useState('-');
    //
    const fetchGlobalBlockTreesAndPutToState = () => {
        http.get('/api/global-block-trees')
            .then(globalBlockTrees => {
                if (globalBlockTrees.length) {
                    setGlobalBlockTrees(globalBlockTrees);
                    setSelectedGlobalBlockTreeId(globalBlockTrees[0].id);
                    onItemSelected(globalBlockTrees[0]);
                } else {
                    setGlobalBlockTrees(globalBlockTrees);
                    setSelectedGlobalBlockTreeId('-');
                }
            })
            .catch(env.window.console.error);
    };
    /**
     * @param {String} globalBlockTreeId
     * @access private
     */
    const changeSelectedGlobalBlockTree = globalBlockTreeId => {
        if (globalBlockTreeId === '-') return;
        setSelectedGlobalBlockTreeId(globalBlockTreeId);
        onItemSelected(globalBlockTrees.find(gbt => gbt.id === globalBlockTreeId));
    };
    //
    preactHooks.useEffect(() => {
        if (isVisible)
            fetchGlobalBlockTreesAndPutToState();
    }, [isVisible]);
    //
    if (!isVisible) return null;
    //
    if (globalBlockTrees !== null) return globalBlockTrees.length
        ? <select
            value={ selectedGlobalBlockTreeId }
            onChange={ e => changeSelectedGlobalBlockTree(e.target.value) }
            class="form-input form-select tight mb-2">
            <option value="-"> - </option>{ globalBlockTrees.map(gbt =>
                <option value={ gbt.id }>{ gbt.name }</option>
            ) }
        </select>
        : <p>{ __('No %s found', __('global blocks')) }</p>;
    //
    return <LoadingSpinner className="mb-2 pb-2 ml-1"/>;
};

export default GlobalBlockTreeSelector;
