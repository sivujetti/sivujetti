import {Icon} from './Icon.jsx';

class MenuSection extends preact.Component {
    /**
     * @param {{title: string; subtitle: string; iconId: string; colorClass: string; outerClass?: string; buttonClass?: string; onIsCollapsedChanged?: (to: boolean) => void; initiallyIsCollapsed?: boolean;}} props
     */
    constructor(props) {
        super(props);
        this.el = preact.createRef();
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
     * @returns {HTMLElement}
     * @access public
     */
    getEl() {
        return this.el.current;
    }
    /**
     * @access protected
     */
    render({title, subtitle, iconId, colorClass, outerClass, buttonClass, children}, {isCollapsed}) {
        return <section class={ ['panel-section', outerClass ? ` ${outerClass}` : '', isCollapsed ? '' : ' open'].join('') } ref={ this.el }>
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
     * @param {{initiallyIsCollapsed?: boolean; sections: Array<string>; startAddPageMode: () => void; startAddPageTypeMode: () => void; blockTreesRef: preact.Ref; currentWebPage: EditAppAwareWebPage;} && {loadedPageSlug?: string; loadingPageSlug*?: string;}} props
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
