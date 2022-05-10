let env;
let inspectorPanelIsOpen = false;

// see also frontend/edit-app/main.js
const sectionRenderers = new Map;

class MainPanel {
    /**
     * @param {HTMLElement} el
     * @param {any} signals
     * @param {any} _env
     */
    constructor(el, signals, _env) {
        this.el = el;
        env = _env;
        signals.on('on-inspector-panel-revealed', () => { inspectorPanelIsOpen = true; });
        signals.on('on-inspector-panel-closed', () => { inspectorPanelIsOpen = false; });
    }
    /**
     * @param {Block} block
     * @param {Boolean} isNew = false
     * @param {'smooth'|'auto'} behavior = 'smooth'
     */
    scrollTo(block, isNew = false, behavior = 'smooth') {
        const subSelector = `data-${!isNew ? '' : 'placeholder-'}block-id="${block.id}"`;
        const target = env.document.querySelector(`.block-tree li[${subSelector}]`);
        const liHeight = 30;
        // Note: contains main.scrollTop
        const targetTop = (target.closest('.collapsed') || target).getBoundingClientRect().top - liHeight;
        const main = this.getEl();
        //
        const runAfterInspectorPanelHasOpened = fn => {
            if (inspectorPanelIsOpen) fn();
            else setTimeout(fn, 20);
        };
        runAfterInspectorPanelHasOpened(() => {
            const halfVisible = main.clientHeight / 2;
            const center = targetTop + main.scrollTop - halfVisible;
            main.scrollTo({
                top: center,
                behavior,
            });
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
