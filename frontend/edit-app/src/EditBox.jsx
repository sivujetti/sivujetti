import {__} from './temp.js';
import services from './services.js';

const TODO = 142;

/**
 * https://gist.github.com/mikelehen/3596a30bd69384624c11
 */
const generatePushID = (function() {
  // Modeled after base64 web-safe chars, but ordered by ASCII.
  var PUSH_CHARS = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';

  // Timestamp of last push, used to prevent local collisions if you push twice in one ms.
  var lastPushTime = 0;

  // We generate 72-bits of randomness which get turned into 12 characters and appended to the
  // timestamp to prevent collisions with other clients.  We store the last characters we
  // generated because in the event of a collision, we'll use those same characters except
  // "incremented" by one.
  var lastRandChars = [];

  return function() {
    var now = new Date().getTime();
    var duplicateTime = (now === lastPushTime);
    lastPushTime = now;

    var timeStampChars = new Array(8);
    for (var i = 7; i >= 0; i--) {
      timeStampChars[i] = PUSH_CHARS.charAt(now % 64);
      // NOTE: Can't use << here because javascript will convert to int and lose the upper bits.
      now = Math.floor(now / 64);
    }
    if (now !== 0) throw new Error('We should have converted the entire timestamp.');

    var id = timeStampChars.join('');

    if (!duplicateTime) {
      for (i = 0; i < 12; i++) {
        lastRandChars[i] = Math.floor(Math.random() * 64);
      }
    } else {
      // If the timestamp hasn't changed since last push, use the same random number, except incremented by 1.
      for (i = 11; i >= 0 && lastRandChars[i] === 63; i--) {
        lastRandChars[i] = 0;
      }
      lastRandChars[i]++;
    }
    for (i = 0; i < 12; i++) {
      id += PUSH_CHARS.charAt(lastRandChars[i]);
    }
    if(id.length != 20) throw new Error('Length should be 20.');

    return id;
  };
})();

/**
 * Note: mutates props.block.data
 */
class EditBox extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {isOpen: false, block: null, innerBoxIsBelow: false};
        this.currentForm = preact.createRef();
        this.foo = null;
    }
    /**
     * @todo
     * @todo @todo combine these?
     * @acces public
     */
    open(block) {
        this.setState({isOpen: true, block, innerBoxIsBelow: false});
    }
    /**
     * @acces protected
     */
    render(_, {isOpen, block, innerBoxIsBelow}) {
        if (!isOpen)
            return;
        const Form = services.blockTypes.get(block.ref.blockType).EditFormImpl;
        const rect = block.ref.position;
        const st = el => {
            this.foo = {current: el};
            if (el && !innerBoxIsBelow) setTimeout(() => {
                this.setState({innerBoxIsBelow: rect.top - this.getHeight() < 0});
            }, 1);
        };
        return <form class="edit-box" style={ `left: ${TODO+rect.left}px; top: ${rect.top}px` }
            onSubmit={ this.applyChanges.bind(this) }>
            <div class={ `edit-box__inner${!innerBoxIsBelow ? '' : ' below'}` } style={ !innerBoxIsBelow ? '' : `top:${rect.height}px` } ref={ st }>
                <Form onValueChanged={ this.handleBlockValueChanged.bind(this) } block={ block } ref={ this.currentForm } getEditBoxHeight={ this.getHeight.bind(this) }/>
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
        tryToReRenderBlock(this.state.block.ref, newData, this.state.block.data);
    }
    /**
     * @todo
     * @access private
     */
    applyChanges(e) {
        e.preventDefault();
        this.currentForm.current.applyLatestValue();
        this.setState({isOpen: false});
        saveBlockToBackend(this.state.block.ref.blockId, this.state.block.data);
    }
    /**
     * @access private
     */
    discardChanges() {
        // @todo revert if changed
        this.setState({isOpen: false});
    }
}

function saveBlockToBackend(blockId, data) {
    services.http.put(`/api/blocks/${blockId}`, Object.assign({
    }, data)).then(_resp => {
        // ?
    })
    .catch(err => {
        // ??
        window.console.error(err);
    });
}

// todo
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
            path: '',
            level: 1,
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
    const d = t.getInitialData();
    for (const pname in d)
        d[`_propId_${pname}`] = generatePushID();
    return Object.assign({
        type: from.type,
        section: from.section,
        renderer: from.renderer || t.defaultRenderer,
        id: from.id,
        path: from.path || '?',
    }, d);
}

class Block {
    constructor(data, ref, children) {
        this.data = data;
        this.ref = ref; // aka. comment
        this.children = children;
    }
}

export default EditBox;
export {Block, createBlockData, CreateBlocksSequence, tryToReRenderBlock, saveBlockToBackend, generatePushID}; // ?
