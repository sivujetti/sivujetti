/**
 * @param {Block} block
 * @param {{[key: String]: any;}} props
 */
function writeBlockProps(block, props) {
    for (const key in props) {
        // b.*
        block[key] = props[key];
        if (['type', 'title', 'renderer', 'id', 'styleClasses', 'styleGroup'].indexOf(key) < 0) {
            // b.propsData[*]
            const idx = block.propsData.findIndex(p => p.key === key);
            if (idx > -1) block.propsData[idx].value = props[key];
            else block.propsData.push({key, value: props[key]});
        }
    }
}

export {writeBlockProps};
