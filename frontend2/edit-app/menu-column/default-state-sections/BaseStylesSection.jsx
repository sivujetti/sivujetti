import {__, MenuSection} from '../../../sivujetti-commons-unified.js';

class BaseStylesSection extends preact.Component {
    /**
     * @access protected
     */
    render() {
        return <MenuSection
            title={ __('Styles') }
            subtitle={ __('Colours and fonts') }
            iconId="palette"
            colorClass="color-pink"
            outerClass="base-styles">
            todo
        </MenuSection>;
    }
}

export default BaseStylesSection;
