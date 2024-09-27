import {urlUtils} from '@sivujetti-commons-for-web-pages';

class Icon extends preact.Component {
    /**
     * @param {{iconId: string; className?: string;}} props
     * @access protected
     */
    render({iconId, className}) {
        return <svg class={ 'icon-tabler' + (!className ? '' : ` ${className}`) } width="24" height="24">
            <use xlinkHref={ hrefFull(iconId) }/>
        </svg>;
    }
}

/**
 * @param {string} iconId
 * @param {string?} className
 * @returns {string}
 */
function iconAsString(iconId, className) {
    return '<svg class="icon-tabler' + (!className ? '' : ` ${className}`) + '" width="24" height="24">' +
        `<use xlink:href="${hrefFull(iconId)}"/>` +
    '</svg>';
}

/**
 * @param {string} iconId
 * @returns {string} Example `/dir/public/sivujetti/assets/tabler-sprite-custom.svg?v=aaaaaaaa#tabler-hand-finger`
 */
function hrefFull(iconId) {
    return `${urlUtils.assetBaseUrl}public/sivujetti/assets/${urlUtils.withCacheBustStr('tabler-sprite-custom.svg')}#tabler-${iconId}`;
}

export {Icon, iconAsString};
