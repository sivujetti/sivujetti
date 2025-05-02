import {
    __,
} from '@sivujetti-commons-for-edit-app';
import AddContentPopup from '../../menu-column/block/AddContentPopup.jsx';

/** @extends {preact.Component<{blockId: string; insertPos?: 'after'|'before';}, any>} */
class IncotextAddContentPopup extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        //
    }
    /**
     * @access protected
     */
    render({insertPos}) {
        return <div>
            <h6>{ __('Insert content') }</h6>
            <AddContentPopup
                targetInfo={ {blockId: this.props.blockId, isStoredToTreeId: 'main', isGbtRefRoot: false, data: null} }
                wasCurrentlySelectedBlock={ false }
                { ...(!insertPos ? {insertPos: 'as-child', isReplace: true} : {insertPos, isReplace: false}) }/>
        </div>;
    }
}

export default IncotextAddContentPopup;
