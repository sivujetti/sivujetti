import {__} from '@sivujetti-commons-for-edit-app';

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
 * @param {String} url
 * @param {'dialogTitles'|'previewTooltipTitles'} translationsPool = 'dialogTitles'
 * @returns {[String, String]} [mode, label]
 */
function determineModeFrom(url, translationsPool = 'dialogTitles') {
    const mode = (function () {
        if (!url) return 'choose-link-type';
        //
        const isLocal = url.startsWith('/') && !url.startsWith('//');
        if (isLocal) {
            const pcs = url.split('.');
            const isImage = pcs.length === 1 || !pcs[pcs.length - 1].startsWith('php');
            return !isImage ? 'pick-url' : 'pick-image';
        }
        //
        return 'type-external-url';
    })();
    return [mode, getLabel(mode, translationsPool)];
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

export {determineModeFromPreview, determineModeFrom, getLabel};
