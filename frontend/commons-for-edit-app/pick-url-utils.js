import {urlUtils} from '@sivujetti-commons-for-web-pages';
import {__} from './edit-app-singletons.js';

let dialogTitleTranslations;
let previewTitleTranslations;

/**
 * @param {string} slug
 * @returns {string}
 */
function getVisibleSlug(slug) {
    if (slug === '')
        return `(${__('This page').toLowerCase()})`;
    if (slug.startsWith('#'))
        return slug;
    return slug;
}

/**
 * @param {string} url
 * @returns {[urlMode, string]} [mode, title]
 */
function determineModeFromPreview(url) {
    return determineModeFrom(url, 'previewTooltipTitles');
}

/**
 * @param {string} url '/base/page' or '/base/public/uploads/image.png' or <external>
 * @param {'dialogTitles'|'previewTooltipTitles'} translationsPool = 'dialogTitles'
 * @returns {[urlMode, string]} [mode, label]
 */
function determineModeFrom(url, translationsPool = 'dialogTitles') {
    const mode = (function () {
        //
        if (url === '' || url.startsWith('#')) return 'pick-url';
        //
        const isLocal = url.startsWith('/') && !url.startsWith('//');
        if (isLocal) {
            const pcs = url.split('/'); // ['', 'base', 'pagename'] or ['', 'base', 'public', 'uploads', 'filename.png']
            const isLocalFile = pcs.length > 2 && pcs.at(-3) === 'public' && pcs.at(-2) === 'uploads';
            return !isLocalFile ? 'pick-url' : 'pick-file';
        }
        //
        if (url === '-') return 'choose-link-type';
        //
        return 'type-external-url';
    })();
    return [mode, getLabel(mode, translationsPool)];
}

/**
 * @param {urlMode} mode
 * @param {'dialogTitles'|'previewTooltipTitles'} translationsPool = 'dialogTitles'
 * @returns {string}
 */
function getLabel(mode, translationsPool = 'dialogTitles') {
    let titles;
    if (translationsPool === 'dialogTitles') {
        if (!dialogTitleTranslations)
            dialogTitleTranslations = {
                'choose-link-type': __('Choose link type'),
                'pick-url': __('Pick %s', __('a page')),
                'pick-file': __('Pick %s', `${__('Image')} / ${__('File')}`.toLowerCase()),
                'type-external-url': __('Type an address'),
            };
        titles = dialogTitleTranslations;
    } else {
        if (!previewTitleTranslations)
            previewTitleTranslations = {
                'choose-link-type': '-',
                'pick-url': __('Link to a page: '),
                'pick-file': __('Link to image/file: '),
                'type-external-url': __('Link to an address: '),
            };
        titles = previewTitleTranslations;
    }
    return titles[mode];
}


/**
 * @param {string} url
 * @param {urlMode} mode
 * @returns {string}
 */
function doubleNormalizeUrl(url, mode) {
    if (mode !== 'type-external-url') {
        return mode === 'pick-url'
            ? url.substring(urlUtils.baseUrl.length - 1)
            : `public/uploads/${url.split('/public/uploads/')[1]}`;
    } else {
        return !url.startsWith('//') ? url : url.substring('//'.length);
    }
}

export {
    determineModeFrom,
    determineModeFromPreview,
    doubleNormalizeUrl,
    getLabel,
    getVisibleSlug,
};
