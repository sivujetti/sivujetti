import {Icon} from './interal-wrapper.js';

class MenuSection extends preact.Component {
    /**
     * @param {{title: String; subtitle: String; iconId: String; colorClass: String; outerClass?: String; buttonClass?: String; onIsCollapsedChanged?: (to: Boolean) => void; initiallyIsCollapsed?: Boolean;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isCollapsed: props.initiallyIsCollapsed !== false};
    }
    /**
     * @access public
     */
    collapseOrUncollapse() {
        const next = !this.state.isCollapsed;
        this.setState({isCollapsed: next});
        const {onIsCollapsedChanged} = this.props;
        if (onIsCollapsedChanged) onIsCollapsedChanged(next);
    }
    /**
     * @access protected
     */
    render({title, subtitle, iconId, colorClass, outerClass, buttonClass, children}, {isCollapsed}) {
        return <section class={ ['panel-section', outerClass ? ` ${outerClass}` : '', isCollapsed ? '' : ' open'].join('') }>
            <button class={ `flex-centered pr-2 section-title col-12${buttonClass || ''}` } onClick={ this.collapseOrUncollapse.bind(this) }>
                <Icon iconId={ iconId } className={ `p-absolute size-sm mr-2 ${colorClass}` }/>
                <span class="pl-1 d-block col-12 color-default">
                    { title }
                    <span class="text-ellipsis text-tiny col-12">{ subtitle }</span>
                </span>
                <Icon iconId="chevron-right" className="p-absolute size-xs"/>
            </button>
            { children }
        </section>;
    }
}

class MenuSectionAbstract extends preact.Component {
    /**
     * @param {{initiallyIsCollapsed?: Boolean; sections: Array<String>; startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;} && {loadedPageSlug?: String; loadingPageSlug*?: String;}} props
     */
    constructor(props) {
        super(props);
        this.state = {isCollapsed: props.initiallyIsCollapsed !== false};
    }
    /**
     * @access protected
     */
    // eslint-disable-next-line react/require-render-return
    render() {
        throw new Error('Abstract method not implemented.');
    }
}

export {MenuSection, MenuSectionAbstract};
