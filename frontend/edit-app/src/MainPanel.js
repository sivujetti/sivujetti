let env;

// see also frontend/edit-app/main.js
const sectionRenderers = new Map;

class MainPanel {
    /**
     * @param {HTMLElement} el
     * @param {any} _env
     */
    constructor(el, _env) {
        this.el = el;
        env = _env;
    }
    /**
     * @param {Block|null} block = null
     * @param {'smooth'|'auto'} behavior = 'smooth'
     */
    scrollTo(block = null, behavior = 'smooth') {
        const main = this.getEl();
        const mainBottom = main.offsetHeight;
        const subSelector = !block ? 'data-placeholder-block-id' : `data-block-id="${block.id}"`;
        const target = env.document.querySelector(`.block-tree li[${subSelector}]`);
        const targetTop = (target.closest('.collapsed') || target).getBoundingClientRect().top;
        if (targetTop > mainBottom)
            main.scrollTo({
                top: targetTop,
                behavior,
            });
        else if (targetTop < 0)
            main.scrollTo({
                top: main.scrollTop - Math.abs(targetTop) - 20,
                behavior,
            });
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
