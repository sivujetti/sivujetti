let counter = 0;

/**
 * Usage:
 * ```
 * class MyComponent extends preact.Component {
 *     componentWillMount() {
 *         ...
 *         this.sortable = new Sortable();
 *         ...
 *     }
 *     render() {
 *         return <ul ref={ el => this.sortable.register(el, {
 *             handle: '.drag-handle',
 *             onReorder: orderedIds => {
 *                 ...
 *             },
 *         }) }>...</ul>
 *     }
 * }
 * ```
 */
class Sortable {
    /**
     */
    constructor() {
        this.el = null;
        this.instance = null;
    }
    /**
     * @param {HTMLElement} el
     * @param {Object} options github.com/SortableJS/Sortable#options
     */
    register(el, options) {
        if (!el || this.el === el)
            return;
        this.el = el;
        if (options.onReorder && !options.onEnd) options.onEnd = e => {
            if (e.newIndex === e.oldIndex) return;
            options.onReorder(this.instance.toArray());
        };
        this.instance = window.Sortable.create(el, Object.assign({
            group: `instance-${++counter}`,
            animation: 100,
        }, options));
    }
    /**
     * @returns {Object}
     */
    getImpl() {
        return this.instance;
    }
}

export default Sortable;
