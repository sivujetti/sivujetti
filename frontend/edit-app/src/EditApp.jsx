import {__} from './temp.js';
import services from './services.js';
import {Block, createBlockData, tryToReRenderBlock, saveBlockToBackend} from './EditBox.jsx';

const TODO = 142;

class MainPanel extends preact.Component {
    constructor(props) {
        super(props);
        const makeTreeState = (blocks, out) => {
            for (const itm of blocks) {
                out[itm.data.id] = {isSelected: false, isNew: false,};
                if (itm.children.length)
                    makeTreeState(itm.children, out);
            }
        };
        const treeState = {};
        makeTreeState(props.blocks, treeState);
        this.selectedBlock = null;
        this.state = {treeState};
    }
    render({blocks, editApp}) {
        return <>
            { blocks.length
                ? this.renderBranch(blocks)
                : <p>{ __('No blocks on this page') }</p>
            }
            <button onClick={ this.appendNewBlockTypeSelector.bind(this) } title={ __('Add block to current page') } class="btn">{ __('Add block') }</button>
            <br/>
            <button onClick={ () => editApp.beginCreatePageMode() } title={ __('Add new page') } class="btn">{ __('Add page') }</button>
        </>;
    }
    appendNewBlockTypeSelector() {
        const s = this.selectedBlock || this.props.editApp.findLastBlock('main');
        const placeholderBlock = this.props.editApp.addBlock(s.ref);
        // note: mutates this.state.blocks
        s.children.push(placeholderBlock);

        const ref = this.state.treeState;
        ref[placeholderBlock.data.id] = {
            isSelected: true,
            isNew: true,
        };
        this.setState({treeState: ref, blocks: this.state.blocks});
    }
    renderBranch(blocks) {
        const editApp = this.props.editApp;
        const treeState = this.state.treeState;
        return <ul class="block-tree">{ blocks.map(b =>
        !treeState[b.data.id].isNew ?
            <li onClick={ () => this.setRowAsSelected(b) } key={ b.id } class={ treeState[b.data.id].isSelected ? 'selected' : '' }><div class="block">
                <button onClick={ () => editApp.props.inspectorPanel.show('block-details', {block: b}) } title={ __('Edit') } class="btn">{ services.blockTypes.get(b.data.type).friendlyName }{ !b.data.title ? null : <span>{ b.data.title }</span> }</button>
            </div>{ b.children.length ? this.renderBranch(b.children) : null }</li> :
        <li key={ b.id }>
            <BlockTypeSelector EditApp={ EditApp } after={ this.gsb() } onConfirmed={ this.confirmAdd.bind(this) } onCanceled={ this.clearAdd.bind(this) }/>
        </li>
        ) }</ul>;
    }
    confirmAdd(placeholderBlock) {
        this.clearAdd();
        this.props.editApp.confirmAdd(placeholderBlock);
    }
    gsb() {
        return this.selectedBlock || this.props.editApp.findLastBlock('main');
    }
    clearAdd() {
        // note: mutates this.state.blocks
        this.gsb().children.pop();
        const ref = this.state.treeState;
        for (const id in ref) ref[id].isNew = false;
        this.setState({treeState: ref, blocks: this.state.blocks});
    }
    setRowAsSelected(block, state = {}) {
        const ref = this.state.treeState;
        for (const id in ref)
            ref[id].isSelected = id === block.data.id;
        state.treeState = ref;
        this.setState(state);
        this.selectedBlock = block;
        this.props.onBlockRowSelected(block);
    }
}

class BlockTypeSelector extends preact.Component {
    /**
     * @param { } props
     */
    constructor(props) {
        super(props);
        const newBlockRef = this.props.EditApp.currentWebPage.addBlock(services.blockTypes.get('paragraph').getInitialData().text, props.after.ref);
        this.state = {newBlock: new Block(createBlockData({
                           type: 'paragraph',
                           section: 'main', // ??
                           id: newBlockRef.blockId
                        }), newBlockRef, [])};
    }
    /**
     * @acces protected
     */
    render(_, {newBlock}) {
        return <div>
                <div><select value={ newBlock.data.type } onChange={ this.handleBlockTypeChanged.bind(this) }>{ Array.from(services.blockTypes.entries()).map(([name, blockType]) =>
                    <option value={ name }>{ __(blockType.friendlyName) }</option>
                ) }</select></div>
                <button class="btn btn-sm btn-primary" onClick={ this.applyr.bind(this) } type="button">{ __('Ok') }</button>
                <button class="btn btn-sm btn-link" onClick={ this.discard.bind(this) } type="button">{ __('Cancel') }</button>
            </div>;
    }
    /**
     * @todo
     * @access private
     */
    handleBlockTypeChanged(e) {
        const newBlockData = createBlockData({
            type: e.target.value,
            section: this.state.newBlock.data.section,
            id: this.state.newBlock.data.id});
        tryToReRenderBlock(this.state.newBlock.ref, newBlockData, this.state.newBlock.data, newBlockData.type);
        this.setState({newBlock: Object.assign(this.state.newBlock, {data: newBlockData})});
    }
    /**
     * @todo
     * @access private
     */
    applyr() {
        this.props.onConfirmed(this.state.newBlock);
    }
    /**
     * @access private
     */
    discard() {
        this.state.newBlock.ref.destroy();
        this.props.onCanceled();
    }
}

class AddPagePanel extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {selectedLayout: null, title: '-', slug: '-', currentStep: 0};
    }
    componentDidMount() {
        const l = EditApp.currentWebPage.theme.defaultPageLayout.relFilePath;
        this.setState({currentStep: 0, selectedLayout: l, title: '-', slug: '-'});
    }
    render({blocks, editApp}, {selectedLayout, currentStep, title, slug}) {
        return <>
            <h2>Create page</h2>
            { currentStep === 0 ? [
            //
            <div>Step 1/2: Choose a layout.</div>,
            <div class="form-group">
            <select onChange={ this.changeNewPageLayout.bind(this) } value={ selectedLayout } class="form-select">{ this.props.editApp.layouts.map(layout =>
                <option value={ layout.relFilePath }>{ layout.friendlyName }</option>
            ) }</select>
            </div>,
            <button onClick={ this.goBack.bind(this) } class="btn btn-sm" disabled>{ __('Prev') }</button>,
            <button onClick={ this.advance.bind(this)} title={ __('Go to next step') } class="btn btn-primary btn-sm">{ __('Next') }</button>,
            <button onClick={ this.discardNewPage.bind(this) } title={ __('Cancel add page') } class="btn btn-sm btn-link">{ __('Cancel') }</button>
            ] : [
            //
            <div>Step 2/2: Choose a title and write the content.</div>,
            <div class="form-group">
            <input onInput={ this.qwe.bind(this) } value={ title } class="form-input"/>
            </div>,
            <div class="form-group">
            <input value={ slug } class="form-input" disabled/>
            </div>,
            <div class="form-group">
            <label class="form-label">Parent page</label>
            <select class="form-select">
                <option value="todo1">todo</option>
                <option value="todo2">todo</option>
            </select>
            </div>,
            blocks.map(b => <div class="block">
                <button onClick={ () => editApp.editBox.current.open(b, b.data) } title={ __('Edit') } class="btn">{ services.blockTypes.get(b.data.type).friendlyName }{ !b.data.title ? null : <span>{ b.data.title }</span> }</button>
            </div>),
            <button onClick={ () => { throw new Error('jj') } } title={ __('Add block to current page') } class="btn">{ __('Add block') }</button>,
            <br/>,
            <button onClick={ this.goBack.bind(this) } title={ __('Change design') } class="btn btn-sm">{ __('Prev') }</button>,
            <button onClick={ this.applyNewPage.bind(this) } title={ __('Confirm add page') } class="btn btn-primary btn-sm">{ __('Add the page') }</button>,
            <button onClick={ this.discardNewPage.bind(this) } title={ __('Cancel add page') } class="btn btn-sm btn-link">{ __('Cancel') }</button>
            ]}
        </>;
    }
    qwe(e) {
        const title = e.target.value;
        this.setState({title, slug: `/${slugify(title) || '-'}`});
        EditApp.currentWebPage.updateTitle(title);
    }
    changeNewPageLayout(e) {
        const w = e.target.value;
        this.setState({selectedLayout: w});
        this.props.onLayoutSelected(this.props.editApp.layouts.find(pl => pl.relFilePath === w));
        document.getElementById('kuura-site-iframe').contentWindow.location.href =
            `/kuura/index.php?q=/_placeholder-page/${EditApp.currentWebPage.id}/${encodeURIComponent(w)}`;
    }
    advance() {
        this.setState({currentStep: this.state.currentStep + 1});
    }
    goBack() {
        this.setState({currentStep: this.state.currentStep - 1});
    }
    applyNewPage() {
        services.http.put(`/api/pages/${EditApp.currentWebPage.id}`,
                          {slug: this.state.slug,
                           path: EditApp.currentWebPage.id.toString(),
                           level: 1,
                           title: this.state.title,
                           layout: this.state.selectedLayout,
                           status: 0})
            .then(resp => {
                if (!resp.ok) throw new Error();
                const todo = url => `index.php?q=${url}`;
                window.location.href = todo(`/_edit${this.state.slug}`);
            })
            .catch(window.console.error);
    }
    discardNewPage() {
        services.http.delete(`/api/pages/${EditApp.currentWebPage.id}`)
            .then(resp => {
                if (!resp.ok) throw new Error();
                document.getElementById('kuura-site-iframe').contentWindow.location.href = this.props.editApp.orig;
            })
            .catch(window.console.error);
    }
}

class EditApp extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {blocks: null, isCreatePageModeOn: false, selectedPageLayout: null, cog: {left: -10000, top: -10000}};
        this.mainView = preact.createRef(); // public
        EditApp.currentWebPage = null;
        this.loading = false;
        this.webpageEventHandlers = {
            onBlockHoverStarted: this._handleWebpageBlockHoverStarted.bind(this),
            onBlockHoverEnded: this._handleWebpageBlockHoverEnded.bind(this),
            onBlockClickedDuringHover: this._handleWebpageBlockClicked.bind(this),
            onBlur: () => null, // this._handleInlineWysiwygEditingEnded.bind(this),
            onHtmlInput: () => null, // debounce(this._handleInlineWysiwygInput.bind(this)),
        };
        // https://www.freecodecamp.org/news/javascript-debounce-example/
        function debounce(func, timeout = 200){
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => { func.apply(this, args); }, timeout);
            };
        }
        this.dirty = new Map;
    }
    /**
     * @param {string} name
     * @todo
     * @return todo
     * @access public
     */
    registerBlockType(name, blockType) {
        // @todo validate
        services.blockTypes.set(name, blockType);
    }
    /**
     * Kutsutaan ifamen sisältä joka kerta, kun siihen latautuu uusi sivu.
     * @todo
     * @todo
     */
    handleWebpageLoaded(currentWebPage, currentWebPageBlockData, isNewPage = false) {
        EditApp.currentWebPage = currentWebPage;
        //this.data = currentWebPageBlocks;
        this.layouts = currentWebPage.theme.pageLayouts;
        if (!isNewPage) {
            this.orig = document.getElementById('kuura-site-iframe').contentWindow.location.href; // ??
        }
        currentWebPage.setEventHandlers(this.webpageEventHandlers);
        this.setState({blocks: this.mb(currentWebPageBlockData, currentWebPage.getBlockRefs()),//,
                       selectedPageLayout: this.layouts.find(l => l.relFilePath === currentWebPage.layout),
                       isCreatePageModeOn: isNewPage});
    }
    mb(datas, refs) {
        return datas.map(d =>
            new Block(d, refs.find(br => br.blockId === d.id),
                d.children.length ? this.mb(d.children, refs) : [])
        );
    }
    confirmAdd(placeholderBlock) {
        this.props.inspectorPanel.show('block-details', {block: placeholderBlock});
        services.http.post('/api/blocks', Object.assign({
            pageId: EditApp.currentWebPage.id,
        }, placeholderBlock.data)).then(_resp => {
            // ??
        })
        .catch(err => {
            // ??
            window.console.error(err);
        });
    }
    /**
     * @acces protected
     */
    render(_, {blocks, isCreatePageModeOn, selectedPageLayout, cog}) {
        // The webpage iframe hasn't loaded yet
        if (blocks === null)
            return;
        return <>
            { !isCreatePageModeOn
                ? <MainPanel blocks={ blocks } editApp={ this } onBlockRowSelected={ row => { this.selectedBlockRow = row; } }/>
                : <AddPagePanel blocks={ blocks } editApp={ this } onLayoutSelected={ pageLayout => {
                    this.setState({selectedPageLayout: pageLayout});
                }}/>
            }
            <button class="cog" style={ `left: ${TODO+cog.left}px; top: ${cog.top}px; pointer-events:none` } type="button">E</button>
        </>;
    }
    beginCreatePageMode() {
        if (this.loading) return;
        this.loading = true;
        //
        const pl = EditApp.currentWebPage.theme.defaultPageLayout.relFilePath;
        services.http.post(`/api/pages`, {
            slug: '-',
            path: '',
            level: 1,
            title: '-',
            layout: pl,
            pageTypeName: 'Pages',
        }).then(resp => {
            if (resp.ok !== 'ok') throw new Error('');

            const initialBlocks = [
                createBlockData({
                    type: 'heading',
                    section: 'main',
                    id: 'new-2-1',
                }),
                createBlockData({
                    type: 'paragraph',
                    section: 'main',
                    id: 'new-2-2',
                }),
            ];
            // todo dry
            const seq = i => {
                if (!initialBlocks[i]) { // We're done
                    document.getElementById('kuura-site-iframe').contentWindow.location.href = `/kuura/index.php?q=/_placeholder-page/${resp.insertId}/${encodeURIComponent(pl)}`;
                    this.loading = false;
                    return;
                }
                services.http.post('/api/blocks', Object.assign({
                    pageId: resp.insertId,
                }, initialBlocks[i])).then(resp => {
                    if (resp.ok !== 'ok') throw new Error('');
                    seq(i + 1);
                })
                .catch(err => {
                    // ??
                    window.console.error(err);
                });
            };
            seq(0);
        });
    }
    addBlock(after) {
        const newBlockRef = EditApp.currentWebPage.addBlock(services.blockTypes.get('paragraph').getInitialData().text, after);
        return new Block(createBlockData({
            type: 'paragraph',
            section: 'main', // ??
            id: newBlockRef.blockId
        }), newBlockRef, []);
    }
    findLastBlock(sectionName) {
        return this.state.blocks.reduce((l, b) =>
            (b.data || {}).section === sectionName ? b : l
        , null);
    }
    _handleWebpageBlockHoverStarted(blockRef) {
        this.setState({cog: blockRef.position});
    }
    _handleWebpageBlockHoverEnded(_blockRef) {
        this.setState({cog: {left: -10000, top: -10000}});
    }
    _handleWebpageBlockClicked(blockRef) {
        const findBlock = (id, branch) => {
            for (const b of branch) {
                if (b.data.id === id) return b;
                if (b.children.length) {
                    const c = findBlock(id, b.children);
                    if (c) return c;
                }
            }
            return null;
        };
        this.props.inspectorPanel.show('block-details', {block: findBlock(blockRef.blockId, this.state.blocks)});
        return false;
    }
    _handleInlineWysiwygInput(b, value) {
        const d = {};
        if (b.data.type === 'heading') // ??
            d.text = value.substr('<h1>'.length, value.length - '<h1></h1>'.length); // ?? attrs
        else if (b.data.type === 'paragraph')
            d.text = value.substr('<p>'.length, value.length - '<p></p>'.length);
        else if (b.data.type === 'formattedText')
            d.html = value;
        else
            throw new Error();

        this.dirty.set(b.blockId, Object.assign({
        }, b.data, d));

        saveBlockToBackend(b.blockId, this.dirty.get(b.blockId));
    }
    _handleInlineWysiwygEditingEnded(b) {
        tryToReRenderBlock(
            b,
            this.dirty.get(b.blockId),
            {},
            b.data.type,
        );
        this.dirty.delete(b.blockId);
    }
}

/**
 * https://gist.github.com/mathewbyrne/1280286#gistcomment-2353812
 *
 * @param {string} text
 * @returns {string}
 */
function slugify(text) {
    // Use hash map for special characters
    const specialChars = {"à":'a',"ä":'a',"á":'a',"â":'a',"æ":'a',"å":'a',"ë":'e',"è":'e',"é":'e', "ê":'e',"î":'i',"ï":'i',"ì":'i',"í":'i',"ò":'o',"ó":'o',"ö":'o',"ô":'o',"ø":'o',"ù":'o',"ú":'u',"ü":'u',"û":'u',"ñ":'n',"ç":'c',"ß":'s',"ÿ":'y',"œ":'o',"ŕ":'r',"ś":'s',"ń":'n',"ṕ":'p',"ẃ":'w',"ǵ":'g',"ǹ":'n',"ḿ":'m',"ǘ":'u',"ẍ":'x',"ź":'z',"ḧ":'h',"·":'-',"/":'-',"_":'-',",":'-',":":'-',";":'-'};
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')    // Replace spaces with -
        .replace(/./g, (target) => specialChars[target] || target) // Replace special characters using the hash map
        .replace(/[^\w-]+/g, '') // Remove all non-word chars
        .replace(/--+/g, '-')    // Replace multiple - with single -
        .replace(/^-+/, '')      // Trim - from start of text
        .replace(/-+$/, '');     // Trim - from end of text
}

class MainView extends preact.Component {
    /**
     * @param {todo} props
     */
    constructor(props) {
        super(props);
        this.state = {isOpen: false};
        this.rendererProps = null;
    }
    /**
     * @todo
     * @acces public
     */
    open(Renderer, props) {
        this.rendererProps = Object.assign({view: this}, props);
        this.setState({isOpen: true, Renderer});
    }
    /**
     * @acces public
     */
    close() {
        this.setState({isOpen: false});
    }
    /**
     * @acces protected
     */
    render(_, {isOpen, Renderer}) {
        if (!isOpen)
            return;
        return <div id="view" class={ !isOpen ? '' : 'open' }>{
            preact.createElement(Renderer, this.rendererProps)
        }</div>;
    }
}

export default EditApp;
