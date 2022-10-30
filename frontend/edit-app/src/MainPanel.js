let env;

// see also frontend/edit-app/main.js
const sectionRenderers = new Map;
const useNoUlBlockTree = false;

class MainPanel {
    // el;
    /**
     * @param {HTMLElement} el
     * @param {any} _env
     */
    constructor(el, _env) {
        this.el = el;
        env = _env;
    }
    /**
     * @param {RawBlock} block
     * @param {Boolean} isNew = false
     * @param {'smooth'|'auto'} behavior = 'smooth'
     */
    scrollTo(block, isNew = false, behavior = 'smooth') {
        const subSelector = `data-${!isNew ? '' : 'placeholder-'}block-id="${block.id}"`;
        const apdx = !useNoUlBlockTree ? '' : '2';
        const target = env.document.querySelector(`.block-tree${apdx} li[${subSelector}]`);
        const liHeight = 30;
        // Note: contains main.scrollTop
        const targetTop = (target.closest('.collapsed') || target).getBoundingClientRect().top - liHeight;
        const main = this.getEl();
        //
        const halfVisible = main.clientHeight / 2;
        const center = targetTop + main.scrollTop - halfVisible;
        main.scrollTo({
            top: center,
            behavior,
        });
    }
    /**
     * @param {'onThisPage'|'baseStyles'} section
     * @param {'smooth'|'auto'} behavior = 'smooth'
     */
    scrollToSection(section, behavior = 'smooth') {
        const nameToSelector = {
            onThisPage: '.panel-section.on-this-page',
            baseStyles: '.panel-section.base-styles',
        };
        const selector = nameToSelector[section];
        if (selector) {
            const main = this.getEl();
            const sectionTop = main.querySelector(selector).getBoundingClientRect().top;
            main.scrollTo({top: sectionTop + main.scrollTop, behavior});
        } else throw new Error(`Section name (${section}) must be ${Object.keys(nameToSelector).join(', ')}`);
    }
    /**
     * @returns {HTMLElement}
     */
    getEl() {
        return this.el;
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
     * @returns {preact.AnyComponent}
     * @throws {Error}
     * @access public
     */
    getSection(name) {
        const out = sectionRenderers.get(name);
        if (!out) throw new Error(`Renderer "${name}" not found.`);
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

export default MainPanel;
