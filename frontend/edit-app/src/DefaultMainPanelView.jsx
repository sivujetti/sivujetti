import {__} from '@kuura-commons';
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
                <h2 class="d-none">{ __('On this page') }</h2>
                <BlockTrees containingView="DefaultMainPanelView"/>
            </section>
            <section class="panel-section">
                <h2 class="d-none">{ __('My website') }</h2>
                <nav>
                    <a class="with-icon color-orange">
                        <Icon iconId="file" className="size-sm color-orange"/>
                        <span class="color-default">{ __('Pages') }</span>
                    </a>
                    <a onClick={ e => (e.preventDefault(), startAddPageMode()) } class="with-icon color-purple">
                        <Icon iconId="plus-circle" className="size-sm color-purple"/>
                        <span class="color-default">{ __('Create page') }</span>
                    </a>
                </nav>
            </section>
        </>;
    }
}

export default DefaultMainPanelView;
