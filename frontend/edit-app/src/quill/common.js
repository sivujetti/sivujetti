// ## import {__, urlUtils} from '@sivujetti-commons-for-edit-app';
// ## 
// ## let dialogTitleTranslations;
// ## let previewTitleTranslations;
// ## 
// ## /**
// ##  * @param {String} url
// ##  * @returns {[urlMode, String]} [mode, title]
// ##  */
// ## function determineModeFromPreview(url) {
// ##     return determineModeFrom(url, 'previewTooltipTitles');
// ## }
// ## 
// ## /**
// ##  * @param {String} url '/base/page' or '/base/public/uploads/image.png' or <external>
// ##  * @param {'dialogTitles'|'previewTooltipTitles'} translationsPool = 'dialogTitles'
// ##  * @returns {[urlMode, String]} [mode, label]
// ##  */
// ## function determineModeFrom(url, translationsPool = 'dialogTitles') {
// ##     const mode = (function () {
// ##         //
// ##         if (url === '' || url.startsWith('#')) return 'pick-url';
// ##         //
// ##         const isLocal = url.startsWith('/') && !url.startsWith('//');
// ##         if (isLocal) {
// ##             const pcs = url.split('/'); // ['', 'base', 'pagename'] or ['', 'base', 'public', 'uploads', 'filename.png']
// ##             const isLocalFile = pcs.length > 2 && pcs.at(-3) === 'public' && pcs.at(-2) === 'uploads';
// ##             return !isLocalFile ? 'pick-url' : 'pick-file';
// ##         }
// ##         //
// ##         if (url === '-') return 'choose-link-type';
// ##         //
// ##         return 'type-external-url';
// ##     })();
// ##     return [mode, getLabel(mode, translationsPool)];
// ## }
// ## 
// ## /**
// ##  * @param {String} url '/pagename' or '/public/uploads/filename.png' or <external>
// ##  * @returns {String} '/base/pagename' or '/base/public/uploads/filename.png' or <external>
// ##  */
// ## function getCompletedUrl(url) {
// ##     if (!url.length || url.startsWith('#')) return url;
// ##     //
// ##     const isAlreadyCompleted = url.startsWith(urlUtils.baseUrl);
// ##     if (isAlreadyCompleted) return url;
// ##     //
// ##     const isLocal = url.startsWith('/') && !url.startsWith('//');
// ##     if (isLocal) {
// ##         const isImage = url.startsWith('/public/uploads/');
// ##         return !isImage ? urlUtils.makeUrl(url) : urlUtils.makeAssetUrl(url);
// ##     }
// ##     //
// ##     return normalizeExternalUrl(url);
// ## }
// ## 
// ## /**
// ##  * @param {String} url
// ##  * @returns {String}
// ##  */
// ## function normalizeExternalUrl(url) {
// ##     if (/^[a-zA-Z]+:.+$/.test(url)) // http://foo.com, mailto:foo, steam://store/1151640, not foo.com/path:1
// ##         return url;
// ##     // No protocol ('foo.com', '//foo.com', foo.com/path:1)
// ##     return `http://${url}`;
// ## }
// ## 
// ## /**
// ##  * @param {urlMode} mode
// ##  * @param {'dialogTitles'|'previewTooltipTitles'} translationsPool = 'dialogTitles'
// ##  * @returns {String}
// ##  */
// ## function getLabel(mode, translationsPool = 'dialogTitles') {
// ##     let titles;
// ##     if (translationsPool === 'dialogTitles') {
// ##         if (!dialogTitleTranslations)
// ##             dialogTitleTranslations = {
// ##                 'choose-link-type': __('Choose link type'),
// ##                 'pick-url': __('Pick %s', __('a page')),
// ##                 'pick-file': __('Pick %s', `${__('Image')} / ${__('File')}`.toLowerCase()),
// ##                 'type-external-url': __('Type an address'),
// ##             };
// ##         titles = dialogTitleTranslations;
// ##     } else {
// ##         if (!previewTitleTranslations)
// ##             previewTitleTranslations = {
// ##                 'choose-link-type': '-',
// ##                 'pick-url': __('Link to a page: '),
// ##                 'pick-file': __('Link to image/file: '),
// ##                 'type-external-url': __('Link to an address: '),
// ##             };
// ##         titles = previewTitleTranslations;
// ##     }
// ##     return titles[mode];
// ## }
// ## 
// ## /**
// ##  * @param {String} url
// ##  * @param {urlMode} mode
// ##  * @returns {String}
// ##  */
// ## function normalizeUrl(url, mode) {
// ##     if (mode !== 'type-external-url') {
// ##         return mode === 'pick-url'
// ##             ? url.substring(urlUtils.baseUrl.length - 1)
// ##             : `public/uploads/${url.split('/public/uploads/')[1]}`;
// ##     } else {
// ##         return !url.startsWith('//') ? url : url.substring('//'.length);
// ##     }
// ## }
// ## 
// ## /**
// ##  * @param {String} slug
// ##  * @returns {String}
// ##  */
// ## function getVisibleSlug(slug) {
// ##     if (slug === '')
// ##         return `(${__('This page').toLowerCase()})`;
// ##     if (slug.startsWith('#'))
// ##         return slug;
// ##     return slug;
// ## }
// ## 
// ## export {determineModeFromPreview, determineModeFrom, getCompletedUrl, getLabel,
// ##         normalizeExternalUrl, normalizeUrl, getVisibleSlug};
