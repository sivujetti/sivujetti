import {__} from './temp.js';
import services from './services.js';
import EditBox, {createBlockData} from './EditBox.jsx';
import AddBox from './AddBox.jsx';

class MainPanel extends preact.Component {
    render({blocks, editApp}) {
        return <>
            { blocks.length
                ? blocks.map(b => <div class="block">
                    <button onClick={ () => editApp.editBox.current.open(b, editApp.findBlockData(b)) } title={ __('Edit') } class="btn">{ services.blockTypes.get(b.blockType).friendlyName }{ !editApp.findBlockData(b).title ? null : <span>{ editApp.findBlockData(b).title }</span> }</button>
                </div>)
                : <p>{ __('No blocks on this page') }</p>
            }
            <button onClick={ () => editApp.addBox.current.open(editApp.findLastBlock('main')) } title={ __('Add block to current page') } class="btn">{ __('Add block') }</button>
            <br/>
            <button onClick={ () => editApp.beginCreatePageMode() } title={ __('Add new page') } class="btn">{ __('Add page') }</button>
        </>;
    }
}

class AddPagePanel extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {layouts: null, selectedLayout: null, title: '-', slug: '-', currentStep: 0};
        setTimeout(() => {
            this.setState({layouts: [{friendlyName: 'Full width', relFilePath: 'layout.full-width', sections: ['main']}, // sections ??
                                     {friendlyName: 'With sidebar', relFilePath: 'layout.with-sidebar', sections: ['main','sidebar']}]});
        }, 100); // todo http
    }
    componentDidMount() {
        this.setState({currentStep: 0, selectedLayout: this.props.defaultLayout, title: '-', slug: '-'});
    }
    render({blocks, editApp}, {layouts, selectedLayout, currentStep, title, slug}) {
        return <>
            <h2>Create page</h2>
            { currentStep === 0 ? [
            //
            <div>Step 1/2: Choose a layout.</div>,
            <div class="form-group">
            <select onChange={ this.changeNewPageLayout.bind(this) } value={ selectedLayout } class="form-select">{ layouts ? layouts.map(layout =>
                <option value={ layout.relFilePath }>{ layout.friendlyName }</option>
            ) : null }</select>
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
            blocks.map(b => <div class="block">
                <button onClick={ () => editApp.editBox.current.open(b, editApp.findBlockData(b)) } title={ __('Edit') } class="btn">{ services.blockTypes.get(b.blockType).friendlyName }{ !editApp.findBlockData(b).title ? null : <span>{ editApp.findBlockData(b).title }</span> }</button>
            </div>),
            <button onClick={ () => editApp.addBox.current.open(editApp.findLastBlock('main')) } title={ __('Add block to current page') } class="btn">{ __('Add block') }</button>,
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
        document.getElementById('kuura-site-iframe').contentWindow.location.href =
            `/kuura/index.php?q=/_placeholder-page/${EditApp.currentWebPage.pageId}/${encodeURIComponent(w)}`;
    }
    advance() {
        this.setState({currentStep: this.state.currentStep + 1});
    }
    goBack() {
        this.setState({currentStep: this.state.currentStep - 1});
    }
    applyNewPage() {
        services.http.put(`/api/pages/${EditApp.currentWebPage.pageId}`,
                          {slug: this.state.slug,
                           title: this.state.title,
                           template: `${this.state.selectedLayout}.tmpl.php`,
                           status: 0})
            .then(resp => {
                if (!resp.ok) throw new Error();
                const todo = url => `index.php?q=${url}`;
                window.location.href = todo(`/_edit${this.state.slug}`);
            })
            .catch(window.console.error);
    }
    discardNewPage() {
        services.http.delete(`/api/pages/${EditApp.currentWebPage.pageId}`)
            .then(resp => {
                if (!resp.ok) throw new Error();
                document.getElementById('kuura-site-iframe').contentWindow.location.href = this.props.editApp.orig;
            })
            .catch(window.console.error);
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

class EditApp extends preact.Component {
    constructor(props) {
        super(props);
        this.state = {blocks: null, isCreatePageModeOn: false};
        this.editBox = preact.createRef();
        this.addBox = preact.createRef();
        this.mainView = preact.createRef(); // public
        EditApp.currentWebPage = null;
        this.loading = false;
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
    handleWebpageLoaded(currentWebPage, currentWebPageBlocks, isNewPage = false) {
        EditApp.currentWebPage = currentWebPage;
        this.data = currentWebPageBlocks;
        if (!isNewPage) {
            this.orig = document.getElementById('kuura-site-iframe').contentWindow.location.href; // ??
        }
        this.setState({blocks: currentWebPage.getBlockRefs(),
                       isCreatePageModeOn: isNewPage});
    }
    /**
     * @acces protected
     */
    render(_, {blocks, isCreatePageModeOn}) {
        // The webpage iframe hasn't loaded yet
        if (blocks === null)
            return;
        return <>
            { !isCreatePageModeOn
                ? <MainPanel blocks={ blocks } editApp={ this }/>
                : <AddPagePanel blocks={ blocks } editApp={ this } defaultLayout={ this.props.dataFromBackend.theme.defaultLayoutRelFilePath }/>
            }
            <EditBox ref={ this.editBox }/>
            <AddBox ref={ this.addBox } onBlockAdded={ this.addBlock.bind(this) }
                findLastBlock={ sectionName => this.findLastBlock(sectionName) }
                EditApp={ EditApp }/>
        </>;
    }
    beginCreatePageMode() {
        if (this.loading) return;
        this.loading = true;
        //
        services.http.post(`/api/pages`, {
            slug: '-',
            title: '-',
            template: this.props.dataFromBackend.theme.defaultLayoutRelFilePath, // todo http.get('layouts')[0].relFilePath ??
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
                    document.getElementById('kuura-site-iframe').contentWindow.location.href = `/kuura/index.php?q=/_placeholder-page/${resp.insertId}/${encodeURIComponent('layout.full-width')}`;
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
    /**
     * @todo
     * @return todo
     * @access private
     */
    findBlockData(blockRef) {
        return this.data.find(blockData => blockData.id === blockRef.blockId);
    }
    /**
     * @todo
     * @todo
     * @access private
     */
    addBlock(newBlockRef, blockData) {
        this.data.push(blockData);
        this.setState({blocks: this.state.blocks.concat(newBlockRef)});
    }
    findLastBlock(sectionName) {
        return this.state.blocks.reduce((l, b) =>
            (this.findBlockData(b) || {}).section === sectionName ? b : l
        , null);
    }
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
