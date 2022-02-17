let env;

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
}

export default MainPanel;
