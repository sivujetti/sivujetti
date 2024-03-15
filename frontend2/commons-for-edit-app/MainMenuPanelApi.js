import {env} from '@sivujetti-commons-for-web-pages';

const sectionRenderers = new Map;

class MainMenuPanelApi {
    // outerEl;
    /**
     * @param {HTMLElement} outerEl = env.document.getElementById('edit-app')
     */
    constructor(outerEl = env.document.getElementById('edit-app')) {
        this.outerEl = outerEl;
    }
    /**
     * @param {String} blockId
     * @param {'smooth'|'auto'} behavior = 'smooth'
     */
    scrollTo(blockId, behavior = 'smooth') {
        const subSelector = `data-block-id="${blockId}"`;
        const target = env.document.querySelector(`.block-tree li[${subSelector}]`);
        const liHeight = 30;
        // Note: contains main.scrollTop
        const targetTop = (target.closest('.collapsed') || target).getBoundingClientRect().top - liHeight;
        const main = this.getOuterEl();
        //
        const halfVisible = main.clientHeight / 2;
        const center = targetTop + main.scrollTop - halfVisible;
        main.scrollTo({
            top: center,
            behavior,
        });
    }
    /**
     * @param {mainPanelSectionElName} name
     * @returns {HTMLElement}
     * @access public
     */
    getSectionEl(name) {
        const nameToSelector = {
            onThisPage: '.panel-section.on-this-page',
            baseStyles: '.panel-section.base-styles',
        };
        const selector = nameToSelector[name];
        if (selector) return this.getOuterEl().querySelector(selector);
        throw new Error(`Section name (${name}) must be ${Object.keys(nameToSelector).join(', ')}`);
    }
    /**
     * @param {mainPanelSectionElName} name
     * @param {'smooth'|'auto'} behavior = 'smooth'
     * @access public
     */
    scrollToSection(name, behavior = 'smooth') {
        const sectionTop = this.getSectionEl(name).getBoundingClientRect().top;
        const main = this.getOuterEl();
        main.scrollTo({top: sectionTop + main.scrollTop, behavior});
    }
    /**
     * @returns {HTMLElement} #edit-app by default
     * @access public
     */
    getOuterEl() {
        return this.outerEl;
    }
    /**
     * @param {String} name
     * @param {preact.AnyComponent} Cls
     * @access public
     */
    registerSection(name, Cls) {
        if (sectionRenderers.has(name))
            throw new Error(`Renderer named "${name}" already exists.`);
        sectionRenderers.set(name, Cls);
    }
    /**
     * @param {String} name
     * @param {Boolean} doThrowIfNotFound = false
     * @returns {preact.AnyComponent}
     * @throws {Error}
     * @access public
     */
    getSection(name, doThrowIfNotFound = false) {
        const out = sectionRenderers.get(name);
        if (!out && doThrowIfNotFound) throw new Error(`Renderer "${name}" not found.`);
        return out;
    }
    /**
     * @returns {Map<preact.AnyComponent>}
     * @access public
     */
    getSections() {
        return sectionRenderers;
    }
}

export default MainMenuPanelApi;
