const plusIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>');

const rowColor = '#0ccfa0';

const contentColor = '#404040';

const buttonCommonCss = 'border: transparent; color: #fff; cursor: pointer;';

const buttonHoverCss = 'opacity: 0.8;';

const addButtonCommonCss = 'border-radius: 3px;';

/**
 * @returns {InContextEditingApp}
 */
function createInContextEditingApp() {
    /** @type {HTMLElement} */
    let rect1 = null;
    /** @type {HTMLElement} */
    let rect2 = null;
    /** @type {HTMLElement} */
    let rect3 = null;
    /** @type {'RootSection'|'Columns'|'Content'|''} */
    let curHover = null;
    const clearRect = (rect, isSoftClear) => {
        if (!isSoftClear)
            rect.style.cssText = '';
        else
            rect.style.borderColor = '';
    };
    return {
        /**
         * @param {string} blockType
         * @param {{posRect: DOMRect;}} info
         * @access public
         */
        onBlockHoverStarted(blockType, {posRect}) {
            if (blockType === 'RootSection') {
                showRect(rect1, posRect);
                rect2.style.cssText = '';
                rect3.style.cssText = '';
                curHover = blockType;
            } else if (blockType === 'Columns') {
                rect1.style.borderColor = 'transparent';
                showRect(rect2, posRect);
                rect3.style.cssText = '';
                curHover = blockType;
            } else {
                rect2.style.borderColor = 'transparent';
                showRect(rect3, posRect);
                curHover = 'Content';
            }
        },
        /**
         * @param {boolean} isSoftClear = false
         * @access public
         */
        onBlockHoverEnded(isSoftClear = false) {
            if (curHover === 'RootSection') {
                clearRect(rect1, isSoftClear);
                curHover = '';
            } else if (curHover === 'Columns') {
                rect1.style.borderColor = '';
                clearRect(rect2, isSoftClear);
                curHover = 'RootSection';
            } else if (curHover === 'Content') {
                rect2.style.borderColor = '';
                clearRect(rect3, isSoftClear);
                curHover = 'Columns';
            }
        },
        /**
         * @access public
         */
        clearAll() {
            rect1.style.cssText = '';
            rect2.style.cssText = '';
            rect3.style.cssText = '';
            curHover = '';
        },
        /**
         * @param {ReRenderingWebPage} reRenderingWebPage
         * @param {HTMLElement} toEl
         */
        _init(reRenderingWebPage, toEl) {
            const host = document.createElement('div');
            host.className = 'incontext-app-container';
            toEl.appendChild(host);
            const shadow = host.attachShadow({mode: 'open'});

            const template = document.createElement('template');
            template.innerHTML = getTemplateContent();
            shadow.appendChild(template.content);

            /** @type {Array<HTMLElement>} */
            const [r1, r2, r3] = [...shadow.querySelectorAll('.rect')];

            { // RootSection
            const [addAboveBtn, editBtn, delBtn, cloneBtn, addBelowBtn] = [...r1.querySelectorAll('button')];
            addAboveBtn.addEventListener('click', e => {
                console.log('stru add above cliekd');
                e.stopPropagation();
            });
            editBtn.addEventListener('click', e => {
                console.log('stru edit cliekd');
                e.stopPropagation();
            });
            delBtn.addEventListener('click', e => {
                console.log('stru del cliekd');
                e.stopPropagation();
            });
            cloneBtn.addEventListener('click', e => {
                console.log('stru clone cliekd');
                e.stopPropagation();
            });
            addBelowBtn.addEventListener('click', e => {
                console.log('stru add below cliekd');
                e.stopPropagation();
            });
            }
            { // Columns
            const [addAboveBtn, editBtn, delBtn, cloneBtn, addBelowBtn] = [...r2.querySelectorAll('button')];
            addAboveBtn.addEventListener('click', e => {
                console.log('cols add above cliekd');
                e.stopPropagation();
            });
            editBtn.addEventListener('click', e => {
                console.log('cols edit cliekd');
                e.stopPropagation();
            });
            delBtn.addEventListener('click', e => {
                console.log('cols del cliekd');
                e.stopPropagation();
            });
            cloneBtn.addEventListener('click', e => {
                console.log('cols clone cliekd');
                e.stopPropagation();
            });
            addBelowBtn.addEventListener('click', e => {
                console.log('cols add below cliekd');
                e.stopPropagation();
            });
            }
            { // Content
            const [addAboveBtn, editBtn, delBtn, cloneBtn, addBelowBtn] = [...r3.querySelectorAll('button')];
            addAboveBtn.addEventListener('click', e => {
                console.log('content add above cliekd');
                e.stopPropagation();
            });
            editBtn.addEventListener('click', e => {
                console.log('content edit cliekd');
                e.stopPropagation();
            });
            delBtn.addEventListener('click', e => {
                console.log('content del cliekd');
                e.stopPropagation();
            });
            cloneBtn.addEventListener('click', e => {
                console.log('content clone cliekd');
                e.stopPropagation();
            });
            addBelowBtn.addEventListener('click', e => {
                console.log('content add below cliekd');
                e.stopPropagation();
            });
            }

            rect1 = r1;
            rect2 = r2;
            rect3 = r3;
        }
    };
}

/**
 * @returns {string}
 */
function getTemplateContent() {
    const editIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path><circle cx="12" cy="12" r="3"></circle>');
    const cloneIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><rect x="8" y="4" width="12" height="12" rx="2"></rect><path d="M16 16v2a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2h2"></path>');
    const deleteIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>');
    return (
`<style>
    .rect {
        --col: #4376f7;
        display: none;
        border: 1px solid var(--col);
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        pointer-events: none;
    }
    #rect2 {
      --col: ${rowColor};
    }
    #rect3 {
      --col: ${contentColor};
    }
    .rect button {
        background: var(--col);
        ${buttonCommonCss}
        pointer-events: all;
        display: flex;
        align-items: center;
        padding: 2px;
    }
    .rect button:hover {
        ${buttonHoverCss}
    }
    .rect button svg {
        --rectIconSize: 15px;
        width: var(--rectIconSize);
        height: var(--rectIconSize);
    }
    .rect > button {
        height: 14px;
        padding: 2px 6px;
        ${addButtonCommonCss}
        position: absolute;
        left: 50%;
    }
    .rect > span > button {
        height: 21px;
        padding: 2px;
    }
    .rect > span {
        display: flex;
    }
    .rect-adj > span {
        transform: translateX(60px);
    }
    .rect > button:nth-of-type(1) {
        top: 0;
    }
    .rect > span > button:first-of-type {
        border-top-left-radius: 3px;
        border-bottom-left-radius: 3px;
    }
    .rect > span > button:last-of-type {
        border-top-right-radius: 3px;
        border-bottom-right-radius: 3px;
    }
    .rect > button:nth-of-type(2) {
        bottom: 0;
    }
</style>
<span class="rect" id="rect1">
    <button>${plusIcon}</button>
    <span>
        <button>${editIcon}</button>
        <button>${cloneIcon}</button>
        <button>${deleteIcon}</button>
    </span>
    <button>${plusIcon}</button>
</span>
<span class="rect" id="rect2">
    <button>${plusIcon}</button>
    <span>
        <button>${editIcon}</button>
        <button>${cloneIcon}</button>
        <button>${deleteIcon}</button>
    </span>
    <button>${plusIcon}</button>
</span>
<span class="rect" id="rect3">
    <button>${plusIcon}</button>
    <span>
        <button>${editIcon}</button>
        <button>${cloneIcon}</button>
        <button>${deleteIcon}</button>
    </span>
    <button>${plusIcon}</button>
</span>`
    );
}

/**
 * @param {string} path
 * @returns {string}
 */
function pathIcon(path) {
    return [
        '<svg xmlns="http://www.w3.org/2000/svg"',
        ' class="icon-tabler"',
        ' width="24"',
        ' height="24"',
        ' viewBox="0 0 24 24"',
        ' stroke-width="2"',
        ' stroke="currentColor"',
        ' fill="none"',
        ' stroke-linecap="round"',
        ' stroke-linejoin="round">',
        path,
        '</svg>',
    ].join('');
}

/**
 * @param {HTMLSpanElement} rectSpan
 * @param {DOMRect} posRect
 */
function showRect(rectSpan, posRect) {
    rectSpan.style.cssText = [
        'display: block;',
        'top:', posRect.y + window.scrollY, 'px;',
        'left:', posRect.x + window.scrollX, 'px;',
        'width:', posRect.width - 4, 'px;',
        'height:', posRect.height, 'px;',
    ].join('');
}

/**
 * @typedef {{
 *   onBlockHoverStarted(blockType: string, info: {posRect: DOMRect;}): void;
 *   onBlockHoverEnded(isSoftClear?: boolean): void;
 *   clearAll(): void;
 * }} InContextEditingApp
 */

export default createInContextEditingApp;
export {
    addButtonCommonCss,
    buttonCommonCss,
    buttonHoverCss,
    contentColor,
    plusIcon,
    rowColor,
};
