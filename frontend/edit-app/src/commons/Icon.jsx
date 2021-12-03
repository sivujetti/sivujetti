import {urlUtils} from './main.js';

class Icon extends preact.Component {
    /**
     * @param {{iconId: string; className?: string;}} props
     * @access protected
     */
    render({iconId, className}) {
        return <svg class={ 'icon-tabler' + (!className ? '' : ` ${className}`) } width="24" height="24">
            <use xlinkHref={ `${urlUtils.assetBaseUrl}public/sivujetti/assets/tabler-sprite-custom.svg#tabler-${iconId}` }/>
        </svg>;
    }
}

export default Icon;
