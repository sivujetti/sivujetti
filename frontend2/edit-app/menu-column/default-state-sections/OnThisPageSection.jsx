import {__, MenuSectionAbstract} from '../../../sivujetti-commons-unified.js';

class OnThisPageSection extends MenuSectionAbstract {
    /**
     */
    render(_, {isCollapsed}) {
        return <section class={ `on-this-page panel-section mt-0 pl-0 ${isCollapsed ? 'collapsed' : 'open'}` }>
            todo
        </section>;
    }
}

export default OnThisPageSection;
