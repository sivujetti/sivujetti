import {__} from './temp.js';
import services from './services.js';

const TODO = 282;

/**
 * Note: mutates props.blockData
 */
class EditBox extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false, blockRef: null, blockData: null, innerBoxIsBelow: false};
        this.currentForm = preact.createRef();
        this.foo = null;
    }
    /**
     * @todo
     * @todo @todo combine these?
     * @acces public
     */
    open(blockRef, blockData) {
        this.setState({isOpen: true, blockRef: blockRef, blockData, innerBoxIsBelow: false});
    }
    /**
     * @acces protected
     */
    render(_, {isOpen, blockRef, blockData, innerBoxIsBelow}) {
        if (!isOpen)
            return;
        const Form = services.blockTypes.get(blockRef.blockType).EditFormImpl;
        const rect = blockRef.position;
        const st = el => {
            this.foo = {current: el};
            if (el && !innerBoxIsBelow) setTimeout(() => {
                this.setState({innerBoxIsBelow: rect.top - this.getHeight() < 0});
            }, 1);
        };
        return <form class="edit-box" style={ `left: ${TODO+rect.left}px; top: ${rect.top}px` }
            onSubmit={ this.applyChanges.bind(this) }>
            <div class={ `edit-box__inner${!innerBoxIsBelow ? '' : ' below'}` } style={ !innerBoxIsBelow ? '' : `top:${rect.height}px` } ref={ st }>
                <Form onValueChanged={ this.handleBlockValueChanged.bind(this) } blockRef={ blockRef } blockData={ blockData } ref={ this.currentForm } getEditBoxHeight={ this.getHeight.bind(this) }/>
                <button class="btn btn-primary">{ __('Apply') }</button>
                <button class="btn btn-link" onClick={ this.discardChanges.bind(this) } type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @return todo
     * @acces public
     */
    getHeight() {
        return this.foo.current.getBoundingClientRect().height;
    }
    /**
     * @todo
     * @access private
     */
    handleBlockValueChanged(newData) {
        tryToReRenderBlock(this.state.blockRef, newData, this.state.blockData);
    }
    /**
     * @todo
     * @access private
     */
    applyChanges(e) {
        e.preventDefault();
        this.currentForm.current.applyLatestValue();
        this.setState({isOpen: false});
        services.http.put(`/api/blocks/${this.state.blockRef.blockId}`, Object.assign({
        }, this.state.blockData)).then(_resp => {
            // ?
        })
        .catch(err => {
            // ??
            window.console.error(err);
        });
    }
    /**
     * @access private
     */
    discardChanges() {
        // @todo revert if changed
        this.setState({isOpen: false});
    }
}

class CreateBlocksSequence extends preact.Component {
    /** @param {{title: string;, d: () => {left: umber; top: number;}; pageType: string;}} props */
    constructor(props) {
        super(props);
        this.state = {isOpen: false, blockRefs: null, blockDatas: null, currentStepIdx: null, numSteps: null};
        this.currentForm = preact.createRef();
    }
    /**
     * @todo
     * @todo @todo combine these?
     * @acces public
     */
    open(blockRefs, blockDatas) {
        this.setState({isOpen: true, blockRefs, blockDatas, currentStepIdx: 0, numSteps: blockRefs.length});
    }
    /**
     * @acces protected
     */
    render({title, d}, {isOpen, blockRefs, blockDatas, currentStepIdx, numSteps}) {
        if (!isOpen)
            return;
        const blockRef = blockRefs[currentStepIdx];
        const blockData = blockDatas[currentStepIdx];
        const Form = services.blockTypes.get(blockRef.blockType).EditFormImpl;
        const rect = blockRef.position;
        const relativeRect = d();
        return <form class="edit-box" style={ `left: ${rect.left-relativeRect.left}px; top: ${rect.top-relativeRect.top}px` }
            onSubmit={ this.applyChanges.bind(this) }>
            <div class="edit-box__inner">
                <h2>{ `${__(title)} ${currentStepIdx + 1}/${numSteps}` }</h2>
                <Form onValueChanged={ this.handleBlockValueChanged.bind(this) } blockRef={ blockRef } blockData={ blockData } ref={ this.currentForm }/>
                <button class="btn btn-sm btn-primary mr-1" onClick={  this.goBack.bind(this) } disabled={ currentStepIdx < 1 }>{ __('Prev') }</button>
                <button class="btn btn-sm btn-primary">{ __(!this.isLastStep() ? 'Next' : 'Apply') }</button>
                <button class="btn btn-sm btn-link" onClick={ this.discardChanges.bind(this) } type="button">{ __('Cancel') }</button>
            </div>
        </form>;
    }
    /**
     * @todo
     * @access private
     */
    handleBlockValueChanged(newData) {
        tryToReRenderBlock(
            this.state.blockRefs[this.state.currentStepIdx],
            newData,
            this.state.blockDatas[this.state.currentStepIdx]
        );
    }
    goBack() {
        this.setState({currentStepIdx: this.state.currentStepIdx - 1});
    }
    isLastStep() {
        return this.state.currentStepIdx + 1 === this.state.numSteps;
    }
    /**
     * @todo
     * @access private
     */
    applyChanges(e) {
        e.preventDefault();
        this.currentForm.current.applyLatestValue(); // Mutates this.state.blockDatas[]
        //
        const nth = this.state.currentStepIdx;
        if (!this.isLastStep()) {
            this.setState({currentStepIdx: nth + 1});
            return;
        }
        //
        this.setState({isOpen: false});
        services.http.post(`/api/pages`, {
            slug: '',
            title: '',
            layout: '',
            pageTypeName: this.props.pageType,
        }).then(resp => {
            if (resp.ok !== 'ok') throw new Error('');
            const seq = i => {
                if (!this.state.blockDatas[i]) { // We're done
                    window.location.reload();
                    return;
                }
                services.http.post('/api/blocks', Object.assign({
                    pageId: resp.insertId,
                }, this.state.blockDatas[i])).then(resp => {
                    if (resp.ok !== 'ok') throw new Error('');
                    seq(i + 1);
                })
                .catch(err => {
                    // ??
                    window.console.error(err);
                });
            };
            seq(0);
        })
        .catch(err => {
            // ??
            window.console.error(err);
        });
    }
    /**
     * @access private
     */
    discardChanges() {
        // @todo revert if changed
        this.setState({isOpen: false});
    }
}

function tryToReRenderBlock(blockRef, newData, currentData, type = currentData.type) {
    const blockType = services.blockTypes.get(type);
    if (!blockType)
        throw new Error('hoo');
    blockType.reRender(newData, blockRef, currentData);
}

function createBlockData(from) {
    const t = services.blockTypes.get(from.type);
    return Object.assign({
        type: from.type,
        section: from.section,
        renderer: from.renderer || t.defaultRenderer,
        id: from.id
    }, t.getInitialData());
}

export default EditBox;
export {createBlockData, CreateBlocksSequence, tryToReRenderBlock}; // ?
