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

class PathIcon extends preact.Component {
    /**
     * @param {{className?: string;}} props
     * @access protected
     */
    render({children, className}) {
        return <svg xmlns="http://www.w3.org/2000/svg"
            class={ 'icon-tabler' + (!className ? '' : ` ${className}`) }
            width="24"
            height="24"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round">
            { children }
        </svg>;
    }
}

/**
 * @param {string} iconId
 * @param {string?} className
 * @returns {string}
 */
function iconAsString(iconId, className = null) {
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

export {Icon, iconAsString, PathIcon};
