import {__} from './temp.js';
import services from './services.js';
import {Block, createBlockData, tryToReRenderBlock, saveBlockToBackend} from './EditBox.jsx';

const TODO = 142;

class BlockTreePanel extends preact.Component {
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
    /**
     * @access public
     */
    setAsActive(block) {
        const ref = this.state.treeState;
        for (const id in ref)
            ref[id].isSelected = id === block.data.id;
        this.setState({treeState: ref});
        this.selectedBlock = block;
    }
    render({blocks, editApp}, {treeState}) {
        const grouped = blocks.reduce((arr, block) => {
            arr[block.data.section !== '<layout>' ? 0 : 1].push(block);
            return arr;
        }, [[], []]);
        const br = a => {
            return a.map(b =>
            !treeState[b.data.id].isNew ?
            <li key={ b.data.id } class={ `block${!treeState[b.data.id].isSelected ? '' : ' selected'}` }>
                <button onClick={ () => this.handleItemClicked(b) }>{ b.data.type }</button>
                { b.children.length ? <ul>{ br(b.children) }</ul> : null }
            </li> :
            <li key={ b.data.id } class="block">
                <BlockTypeSelector EditApp={ EditApp } b={ b } after={ this.gsb() } onConfirmed={ this.confirmAdd.bind(this) } onCanceled={ this.clearAdd.bind(this) }/>
            </li>
            );
        };
        return <>
            { grouped.map(group =>
                <ul class="block-tree">{ group.map(b =>
                    br([b])
                ) }</ul>
            ) }
            <button onClick={ this.appendNewBlockTypeSelector.bind(this) } title={ __('Add block to current page') } class="btn">{ __('Add block') }</button>
            <br/>
            <button onClick={ editApp.beginCreatePageMode.bind(editApp) } title={ __('Add new page') } class="btn">{ __('Add page') }</button>
        </>;
    }
    /**
     * @access private
    */
    handleItemClicked(block) {
        this.setAsActive(block);
        this.props.onBlockSelected(block);
    }
    appendNewBlockTypeSelector() {
        const s = this.gsb();
        const placeholderBlock = this.props.editApp.addBlock(s.children[s.children.length-1].ref, s);
        // note: mutates this.state.blocks
        s.children.push(placeholderBlock);

        const ref = this.state.treeState;
        ref[placeholderBlock.data.id] = {
            isSelected: true,
            isNew: true,
        };
        this.setState({treeState: ref, blocks: this.state.blocks});
    }
    confirmAdd(placeholderBlock) {
        const ref = this.state.treeState;
        ref[this.gsb().data.id].isSelected = false;
        ref[placeholderBlock.data.id].isSelected = true;
        for (const id in ref) ref[id].isNew = false;
        this.setState({treeState: ref, blocks: this.state.blocks});
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
}

class BlockTypeSelector extends preact.Component {
    /**
     * @param { } props
     */
    constructor(props) {
        super(props);
        this.state = {d: Object.assign({}, props.b.data)};
    }
    /**
     * @acces protected
     */
    render(_, {d}) {
        return <div>
            <div><select value={ d.type } onChange={ this.handleBlockTypeChanged.bind(this) }>{ Array.from(services.blockTypes.entries()).map(([name, blockType]) =>
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
            section: this.state.d.section,
            id: this.state.d.id,
            path: this.state.d.path});
        tryToReRenderBlock(this.props.b.ref, newBlockData, this.state.d, newBlockData.type);
        this.setState({d: Object.assign(this.state.d, newBlockData)});
    }
    /**
     * @todo
     * @access private
     */
    applyr() {
        Object.assign(this.props.b.data, this.state.d);
        this.props.onConfirmed(this.props.b);
    }
    /**
     * @access private
     */
    discard() {
        this.props.b.ref.destroy();
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
        this.state = {blocks: null, isCreatePageModeOn: false, selectedPageLayout: null, cog: {left: -10000, top: -10000}, refs: null, datas: null};
        this.blockTreePanel = preact.createRef(); // public
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
        this.layouts = currentWebPage.theme.pageLayouts;
        if (!isNewPage) {
            this.orig = document.getElementById('kuura-site-iframe').contentWindow.location.href; // ??
        }
        currentWebPage.setEventHandlers(this.webpageEventHandlers);
        this.setState({
            blocks: this.mb(currentWebPageBlockData, currentWebPage.getBlockRefs()),
            selectedPageLayout: this.layouts.find(l => l.relFilePath === currentWebPage.layout),
            isCreatePageModeOn: isNewPage
        });
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
    render(_, {blocks, isCreatePageModeOn, cog}) {
        // The webpage iframe hasn't loaded yet
        if (blocks === null)
            return;
        return <>
            { !isCreatePageModeOn
                ? <BlockTreePanel blocks={ blocks } editApp={ this } onBlockSelected={ this.handleBlockTreeBlockClicked.bind(this) }
                    ref={ this.blockTreePanel }/>
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
        const d = EditApp.currentWebPage.theme.defaultPageLayout;

        services.http.post(`/api/pages`, {
            slug: '-',
            path: '',
            level: 1,
            title: '-',
            layout: d.relFilePath,
            pageTypeName: 'Pages',
        }).then(resp => {
            if (resp.ok !== 'ok') throw new Error('');

            const initialBlocks = d.initialBlocks.map((bd, i) =>
                Object.assign({}, bd, {id: `new-2-${i+1}`})
            );
            // todo dry
            const seq = i => {
                if (!initialBlocks[i]) { // We're done
                    document.getElementById('kuura-site-iframe').contentWindow.location.href = `/kuura/index.php?q=/_placeholder-page/${resp.insertId}/${encodeURIComponent(d.relFilePath)}`;
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
    addBlock(after, parent) {
        const newBlockRef = EditApp.currentWebPage.addBlock(services.blockTypes.get('paragraph').getInitialData().text, after);
        return new Block(createBlockData({
            type: 'paragraph',
            section: '<inner>', // ??
            id: newBlockRef.blockId,
            path: parent.data.path,
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
    handleBlockTreeBlockClicked(block) {
        this.props.inspectorPanel.show('block-details', {block});
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
        const block = findBlock(blockRef.blockId, this.state.blocks);
        this.blockTreePanel.current.setAsActive(block);
        this.props.inspectorPanel.show('block-details', {block});
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
