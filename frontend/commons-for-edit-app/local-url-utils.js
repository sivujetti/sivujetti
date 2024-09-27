import {stringUtils} from './utils';

/**
 * @param {string} title
 * @returns {string}
 */
function makeSlug(title) {
    return `/${stringUtils.slugify(title) || '-'}`;
}

/**
 * @param {string} slug e.g. "/my-page"
 * @param {PageType} pageType
 * @returns {string} e.g. "my-page/", "articles/my-article/"
 */
function makePath(slug, pageType) {
    return `${((pageType.name === 'Pages' ? '' : pageType.slug) + slug).substring(1)}/`;
}

export {makePath, makeSlug};
