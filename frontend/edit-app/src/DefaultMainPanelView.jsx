import {__} from '../../commons/main.js';
import Icon from '../../commons/Icon.jsx';
import BlockTrees from './BlockTrees.jsx';

class DefaultMainPanelView extends preact.Component {
    /**
     * @param {{startAddPageMode: () => void;}} props
     * @access protected
     */
    render({startAddPageMode}) {
        return <>
            <section class="panel-section">
                <h2>{ __('On this page') }</h2>
                <BlockTrees containingView="DefaultMainPanelView"/>
            </section>
            <section class="panel-section">
                <h2>{ __('Pages') }</h2>
                <div>-</div>
                <button onClick={ startAddPageMode } class="btn btn-sm btn-link with-icon">
                    <Icon iconId="plus-circle" className="size-xs"/>
                    { __('Create page') }
                </button>
            </section>
            <section class="panel-section">
                <h2>{ __('My website') }</h2>
                todo
            </section>
        </>;
    }
}

export default DefaultMainPanelView;
