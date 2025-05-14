import {
    __,
    Tabs,
} from '@sivujetti-commons-for-edit-app';
import AddContentPopup from '../../menu-column/block/AddContentPopup.jsx';
import {RowPicker} from './IncontextAddRowPopup.jsx';
/** @typedef {import('./IncontextAddRowPopup.jsx').IncontextAddRowPopupProps} IncontextAddRowPopupProps */

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
    render({blockId, insertPos, isReplace}, {currentTabIdx}) {
        const commonProps = {
            insertPos: insertPos,
            isReplace: isReplace,
            onCreateBlock: this.props.onCreateBlock,
            onAfterInsertedBlock: this.props.onAfterInsertedBlock,
        };
        return <div>
            <h6>{ __('Insert content') }</h6>
            <Tabs
                links={ [__('New Content'), __('New row')] }
                onTabChanged={ this.handleTabChanged.bind(this) }
                initialTabIdx={ 0 }
                className={ `text-tinyish mt-0${!this.props.onlyContent ? '' : ' d-none'}` }/>
            { currentTabIdx === 0
                ? <AddContentPopup
                    targetInfo={ {blockId, isStoredToTreeId: 'main', isGbtRefRoot: false, data: null} }
                    wasCurrentlySelectedBlock={ false }
                    { ...commonProps }/>
                : <RowPicker
                    blockId={ blockId }
                    { ...commonProps }/>
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

/**
 * @typedef {{
 *   onlyContent?: boolean;
 * } & IncontextAddRowPopupProps} IncontextAddContentPopupProps
 */

export default IncontextAddContentPopup;
