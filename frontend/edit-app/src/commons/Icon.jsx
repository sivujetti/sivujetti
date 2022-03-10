import {urlUtils} from '@sivujetti-commons-for-edit-app';

class Icon extends preact.Component {
    /**
     * @param {{iconId: String; className?: String;}} props
     * @access protected
     */
    render({iconId, className}) {
        return <svg class={ 'icon-tabler' + (!className ? '' : ` ${className}`) } width="24" height="24">
            <use xlinkHref={ `${urlUtils.assetBaseUrl}public/sivujetti/assets/tabler-sprite-custom.svg#tabler-${iconId}` }/>
        </svg>;
    }
}

/**
 * @param {String} iconId
 * @param {String?} className
 * @returns {String}
 */
function asString(iconId, className) {
    return '<svg class="icon-tabler' + (!className ? '' : ` ${className}`) + '" width="24" height="24">' +
        `<use xlink:href="${urlUtils.assetBaseUrl}public/sivujetti/assets/tabler-sprite-custom.svg#tabler-${iconId}"/>` +
    '</svg>';
}

export default Icon;
export {asString};
