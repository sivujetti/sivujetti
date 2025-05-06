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
    const clearRect = rect => {
        rect.style.cssText = '';
    };
    const hideBorder = rect => {
        rect.style.borderColor = 'transparent';
    };
    const getTargetType = blockType => {
        return blockType === 'RootSection' || blockType === 'Columns' ? blockType : 'Content';
    };
    return {
        /**
         * @param {string} blockId
         * @param {string} blockType
         * @param {{posRect: DOMRect;}} info
         * @access public
         */
        onBlockHoverStarted(blockId, blockType, {posRect}) {
            let rect = null;
            if (blockType === 'RootSection') {
                rect = rect1;
            } else if (blockType === 'Columns') {
                rect = rect2;
                hideBorder(rect1);
                if (posRect.height < 40)
                    rect2.classList.add('buttons2-tweak-up');
            } else {
                rect = rect3;
                hideBorder(rect2);
                const cr3 = posRect;
                const cr2 = rect2.getBoundingClientRect();
                if (cr3.x === cr2.x && cr3.y === cr2.y)
                    rect3.classList.add('buttons2-tweak-right');
            }
            showRect(rect, posRect);
            curHover = getTargetType(blockType);
            rect.setAttribute('data-block-id', blockId);
        },
        /**
         * @access public
         */
        onBlockHoverEnded() {
            if (curHover === 'RootSection') {
                clearRect(rect1);
            } else if (curHover === 'Columns') {
                clearRect(rect2);
                rect2.classList.remove('buttons2-tweak-up');
            } else if (curHover === 'Content') {
                clearRect(rect3);
                rect3.classList.remove('buttons2-tweak-right');
            }
        },
        /**
         * @access public
         */
        clearAll() {
            clearRect(rect1);
            clearRect(rect2);
            rect2.classList.remove('buttons2-tweak-up');
            clearRect(rect3);
            rect3.classList.remove('buttons2-tweak-right');
            curHover = '';
        },
        /**
         * @access public
         */
        beginPointerLock() {
            rect1.classList.add('nopoint');
            rect2.classList.add('nopoint');
            rect3.classList.add('nopoint');
        },
        /**
         * @returns {boolean}
         * @access public
         */
        getPointerLockIsOn() {
            return rect1.classList.contains('nopoint');
        },
        /**
         * @access public
         */
        endPointerLock() {
            rect1.classList.remove('nopoint');
            rect2.classList.remove('nopoint');
            rect3.classList.remove('nopoint');
            this.clearAll();
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

            [rect1, rect2, rect3] = [...shadow.querySelectorAll('.rect')];

            addButtonsHandlers(rect1);
            addButtonsHandlers(rect2);
            addButtonsHandlers(rect3);

            function addButtonsHandlers(rect) {
                const [addAboveBtn, editBtn, cloneBtn, delBtn, moreBtn, addBelowBtn] = [...rect.querySelectorAll('button')];
                const type = {rect1: 'RootSection', rect2: 'Row', rect3: 'Content'}[rect.id];
                addAboveBtn.addEventListener('click', e => {
                    console.log(`${type}: addAboveBtn clicked`);
                    e.stopPropagation();
                });
                editBtn.addEventListener('click', e => {
                    console.log(`${type}: editBtn clicked`);
                    e.stopPropagation();
                });
                cloneBtn.addEventListener('click', e => {
                    console.log(`${type}: cloneBtn clicked`);
                    e.stopPropagation();
                });
                delBtn.addEventListener('click', e => {
                    console.log(`${type}: delBtn clicked`);
                    e.stopPropagation();
                });
                moreBtn.addEventListener('click', e => {
                    console.log(`${type}: moreBtn clicked`);
                    e.stopPropagation();
                });
                addBelowBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    if (type === 'RootSection') {
                        const isAfter = true;
                        reRenderingWebPage.messagePortToEditApp.postMessage(['onAddRootSectionButtonClicked',
                            isAfter,
                            rect1.getAttribute('data-block-id')]);
                        return;
                    }
                    reRenderingWebPage.messagePortToEditApp.postMessage(['onAddContentOrRowButtonClicked',
                        {isContent: true, addAfter: true, origin: type},
                        rect.getAttribute('data-block-id'),
                        addBelowBtn.getBoundingClientRect()]);
                });
            }
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
    const dotsIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle>');
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
    .rect.nopoint {
        pointer-events: none;
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
    .rect.buttons2-tweak-up > button {
        transform: translateX(27px);
    }
    .rect > span > button {
        height: 21px;
        padding: 2px;
    }
    .rect.buttons2-tweak-right:not(.rect.buttons2-tweak-up + .rect.buttons2-tweak-right) > span {
        transform: translateX(73px);
    }
    .rect > span {
        display: flex;
    }
    .rect.buttons2-tweak-up > span {
        transform: translateY(-20px);
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
        padding-left: 0;
        padding-right: 0;
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
        <button>${dotsIcon}</button>
    </span>
    <button>${plusIcon}</button>
</span>
<span class="rect" id="rect2">
    <button>${plusIcon}</button>
    <span>
        <button>${editIcon}</button>
        <button>${cloneIcon}</button>
        <button>${deleteIcon}</button>
        <button>${dotsIcon}</button>
    </span>
    <button>${plusIcon}</button>
</span>
<span class="rect" id="rect3">
    <button>${plusIcon}</button>
    <span>
        <button>${editIcon}</button>
        <button>${cloneIcon}</button>
        <button>${deleteIcon}</button>
        <button>${dotsIcon}</button>
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
    rectSpan.style.borderColor = '';
}

/**
 * @typedef {{
 *   onBlockHoverStarted(blockId: string, blockType: string, info: {posRect: DOMRect;}): void;
 *   onBlockHoverEnded(): void;
 *   clearAll(): void;
 *   beginPointerLock(): void;
 *   getPointerLockIsOn(): boolean;
 *   endPointerLock(): void;
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
