import {urlUtils} from './main.js';

class FeatherSvg extends preact.Component {
    /**
     * @param {{iconId: string; className?: string;}} props
     * @access protected
     */
    render({iconId, className}) {
        return <svg class={ `feather${!className ? '' : ` ${className}`}` }>
            <use xlinkHref={ `${urlUtils.assetBaseUrl}public/sivujetti/assets/feather-sprite.svg#${iconId}` }/>
        </svg>;
    }
}

export default FeatherSvg;
