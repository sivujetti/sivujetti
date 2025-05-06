import {
    __,
    blockTreeUtils,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import AddContentPopup from '../../menu-column/block/AddContentPopup.jsx';
import {RowPicker} from './IncontextAddRowPopup.jsx';

/** @extends {preact.Component<IncontextAddContentPopupProps, {currentTabIdx: number;}>} */
class IncontextAddContentPopup extends preact.Component {
    /**
     * @access protected
     */
    componentWillMount() {
        this.setState({currentTabIdx: 0});
    }
    /**
     * @access protected
     */
    render({blockId, addAfter}, {currentTabIdx}) {
        return <div>
            <h6>{ __('Insert content') }</h6>
            <Tabs
                links={ [__('New Content'), __('New row')] }
                onTabChanged={ this.handleTabChanged.bind(this) }
                initialTabIdx={ 0 }
                className="text-tinyish mt-0"/>
            { currentTabIdx === 0
                ? <AddContentPopup
                        targetInfo={ {blockId, isStoredToTreeId: 'main', isGbtRefRoot: false, data: null} }
                        insertPos={ this.props.origin === 'Placeholder' ? 'as-child' : addAfter ? 'after' : 'before' }
                        isReplace={ this.props.origin === 'Placeholder' }
                        wasCurrentlySelectedBlock={ false }/>
                : <RowPicker
                        blockId={ blockId }
                        insertPos={ addAfter ? 'after' : 'before' }
                        isReplace={ false }
                        onAfterInsertedBlock={ this.props.onAfterInsertedBlock }/>
            }
        </div>;
    }
    /**
     * @param {number} toIdx
     * @access private
     */
    handleTabChanged(toIdx) {
        if (this.state.currentTabIdx !== toIdx)
            this.setState({currentTabIdx: toIdx});
    }
}

export default IncontextAddContentPopup;
