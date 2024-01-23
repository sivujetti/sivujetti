import {urlUtils} from './web-page-commons-unified.js';

class Icon extends preact.Component {
    /**
     * @param {{iconId: String; className?: String;}} props
     * @access protected
     */
    render({iconId, className}) {
        return <svg class={ 'icon-tabler' + (!className ? '' : ` ${className}`) } width="24" height="24">
            <use xlinkHref={ hrefFull(iconId) }/>
        </svg>;
    }
}

/**
 * @param {String} iconId
 * @param {String?} className
 * @returns {String}
 */
function iconAsString(iconId, className) {
    return '<svg class="icon-tabler' + (!className ? '' : ` ${className}`) + '" width="24" height="24">' +
        `<use xlink:href="${hrefFull(iconId)}"/>` +
    '</svg>';
}

/**
 * @param {String} iconId
 * @returns {String} Example `/dir/public/sivujetti/assets/tabler-sprite-custom.svg?v=aaaaaaaa#tabler-hand-finger`
 */
function hrefFull(iconId) {
    return `${urlUtils.assetBaseUrl}public/sivujetti/assets/${urlUtils.withCacheBustStr('tabler-sprite-custom.svg')}#tabler-${iconId}`;
}

export {Icon, iconAsString};
