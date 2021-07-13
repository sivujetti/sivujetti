import {__} from '../../commons/main.js';
import {urlUtils} from '../../commons/utils.js';
import {Toaster} from '../../commons/Toaster.jsx';
import BlockTrees from './BlockTrees.jsx';

class EditApp extends preact.Component {
    // blockTrees;
    /**
     * @param {Object} props
     */
    constructor(props) {
        super(props);
        this.blockTrees = preact.createRef();
    }
    /**
     * @param {CurrentPageData} dataFromWebPage
     * @param {Array<BlockRefComment>} comments
     * @param {EditAppAwareWebPage} webPage
     * @access public
     */
    handleWebPageLoaded(dataFromWebPage, comments, webPage) {
        this.blockTrees.current.setBlocks(dataFromWebPage.page.blocks,
                                          dataFromWebPage.layoutBlocks,
                                          comments,
                                          webPage);
    }
    /**
     * @access protected
     */
    render() {
        return <>
            <header class="container">
                <a href={ urlUtils.makeUrl('_edit') }>
                    <img src={ urlUtils.makeAssetUrl('/public/kuura/assets/logo-darkmode.png') }/>
                </a>
            </header>
            <section>
                <h2>{ __('On this page') }</h2>
                <BlockTrees ref={ this.blockTrees }/>
            </section>
            <section>
                <h2>{ __('My website') }</h2>
                todo
            </section>
            <Toaster id="editAppMain"/>
        </>;
    }
}

export default EditApp;
