import {__, Icon, api} from '@sivujetti-commons-for-edit-app';
import {getIcon} from '../block-types/block-types.js';

class BlockDnDSpawner extends preact.Component {
    // selectableBlockTypes;
    // dragStarted;
    // mouseExitedLeft;
    // rootEl;
    // rootElLeft;
    // mainDndEventReceiver;
    // onDragStart;
    // onDragEnd;
    // onMouseMove;
    /**
     * @param {{mainTreeDnd: BlockTreeDragDrop;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.selectableBlockTypes = Array.from(api.blockTypes.entries()).filter(([name, _]) =>
            name !== 'PageInfo' && name !== 'GlobalBlockReference'
        );
        this.dragStarted = false;
        this.mouseExitedLeft = false;
        this.rootEl = preact.createRef();
        this.rootElLeft = null;
        this.mainDndEventReceiver = null;
        this.onDragStart = this.handleDragStarted.bind(this);
        this.onDragEnd = this.handleDragEnded.bind(this);
        this.onMouseMove = e => {
            if (!this.dragStarted) return;
            if (!this.mouseExitedLeft && e.clientX < this.rootElLeft) {
                this.mouseExitedLeft = true;
                this.props.mainTreeDnd.setDragEventReceiver(this.mainDndEventReceiver);
            } else if (this.mouseExitedLeft && e.clientX > this.rootElLeft) {
                this.mouseExitedLeft = false;
                this.props.mainTreeDnd.setDragEventReceiver(null);
            }
        };
    }
    /**
     * @access protected
     */
    render(_, {isOpen}) {
        return <div
            class={ `new-block-spawner${!isOpen ? '' : ' open box'}` }
            ref={ this.rootEl }>
            <button
                onClick={ this.toggleIsOpen.bind(this) }
                class={ `btn d-flex with-icon ${!isOpen ? 'btn-primary' : 'btn-sm mr-1'}` }
                title={ __('Start adding content') }
                type="button">
                <Icon iconId={ !isOpen ? 'plus' : 'x' } className="mr-0"/>
            </button>
            { isOpen ? <div class="scroller"><ul class="block-tree">{ this.selectableBlockTypes.map(([_name, blockType]) =>
                <li class="page-block ml-0"><div class="d-flex">
                    <button
                        onDragStart={ this.onDragStart }
                        onDragEnd={ this.onDragEnd }
                        class="block-handle columns"
                        type="button"
                        draggable>
                        <Icon iconId={ getIcon(blockType) } className="size-xs mr-1"/>
                        { __(blockType.friendlyName) }
                    </button>
                </div></li>
            ) }
            </ul></div> : null }
        </div>;
    }
    /**
     * @access private
     */
    toggleIsOpen() {
        const currentlyIsOpen = this.isOpen;
        if (!currentlyIsOpen) {
            if (!this.mainDndEventReceiver) this.mainDndEventReceiver = {
                draggedOverFirstTime(li) {
                    // todo
                }
            };
            this.rootElLeft = this.rootEl.current.getBoundingClientRect().left;
            document.addEventListener('dragover', this.onMouseMove);
        } else {
            document.removeEventListener(this.onMouseMove);
        }
        this.setState({isOpen: !currentlyIsOpen});
    }
    /**
     * @param {DragEvent} _e
     * @access private
     */
    handleDragStarted(_e) {
        if (this.dragStarted) return;
        this.dragStarted = true;
    }
    /**
     * @param {DragEvent} _e
     * @access private
     */
    handleDragEnded(_e) {
        this.dragStarted = false;
    }
}

export default BlockDnDSpawner;
