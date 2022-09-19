import {__, urlUtils} from '@sivujetti-commons-for-edit-app';

let dialogTitleTranslations;
let previewTitleTranslations;

/**
 * @param {String} url
 * @returns {[String, String]} [mode, title]
 */
function determineModeFromPreview(url) {
    return determineModeFrom(url, 'previewTooltipTitles');
}

/**
 * @param {String} url '/base/page' or '/base/public/uploads/image.png' or <external>
 * @param {'dialogTitles'|'previewTooltipTitles'} translationsPool = 'dialogTitles'
 * @returns {[String, String]} [mode, label]
 */
function determineModeFrom(url, translationsPool = 'dialogTitles') {
    const mode = (function () {
        if (!url) return 'choose-link-type';
        //
        const isLocal = url.startsWith('/') && !url.startsWith('//');
        if (isLocal) {
            const pcs = url.split('/'); // ['base', 'pagename'] or ['base', 'public', 'uploads', 'filename.png']
            const isImage = pcs.length > 2 && pcs[pcs.length - 3] === 'public' && pcs[pcs.length - 2] === 'uploads';
            return !isImage ? 'pick-url' : 'pick-image';
        }
        //
        return 'type-external-url';
    })();
    return [mode, getLabel(mode, translationsPool)];
}

/**
 * @param {String} url '/pagename' or '/uploads/filename.png' or <external>
 * @returns {String} '/base/pagename' or '/base/public/uploads/filename.png' or <external>
 */
function getCompletedUrl(url) {
    const isAlreadyCompleted = url.startsWith(urlUtils.baseUrl);
    if (isAlreadyCompleted) return url;
    //
    const isLocal = url.startsWith('/') && !url.startsWith('//');
    if (isLocal) {
        const isImage = url.startsWith('/uploads/');
        return !isImage ? urlUtils.makeUrl(url) : urlUtils.makeAssetUrl(`/public${url}`);
    }
    //
    return `${url.startsWith('//') || url.startsWith('http') ? '' : '//'}${url}`;
}

/**
 * @param {String} mode
 * @param {'dialogTitles'|'previewTooltipTitles'} translationsPool = 'dialogTitles'
 * @returns {String}
 */
function getLabel(mode, translationsPool = 'dialogTitles') {
    let titles;
    if (translationsPool === 'dialogTitles') {
        if (!dialogTitleTranslations)
            dialogTitleTranslations = {
                'choose-link-type': __('Choose link type'),
                'pick-url': __('Pick a page'),
                'pick-image': __('Pick an image'),
                'type-external-url': __('Type an address'),
            };
        titles = dialogTitleTranslations;
    } else {
        if (!previewTitleTranslations)
            previewTitleTranslations = {
                'choose-link-type': '-',
                'pick-url': __('Link to a page: '),
                'pick-image': __('Link to an image: '),
                'type-external-url': __('Link to an address: '),
            };
        titles = previewTitleTranslations;
    }
    return titles[mode];
}

export {determineModeFromPreview, determineModeFrom, getCompletedUrl, getLabel};
