import {__} from '../../commons/main.js';
import {urlUtils} from '../../commons/utils.js';

class EditApp extends preact.Component {
    /**
     * @param {todo} dataFromWebPage
     * @param {todo} comments
     * @access public
     */
    handleWebPageLoaded(dataFromWebPage, comments) {
        //
    }
    /**
     * @acces protected
     */
    render() {
        return <>
            <header class="container">
                <a href={ urlUtils.makeAssetUrl('_edit') }>
                    <img src={ urlUtils.makeAssetUrl('/public/kuura/assets/logo-darkmode.png') }/>
                </a>
            </header>
            <section>
                <h2>{ __('On this page') }</h2>
                todo
            </section>
            <section>
                <h2>{ __('My website') }</h2>
                todo
            </section>
        </>;
    }
}

export default EditApp;
