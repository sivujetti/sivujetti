const plusIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>');

const sectionColor = 'hsl(223deg 91.84% 61.57%)';
const sectionColorHover = 'hsl(223deg 91.84% 55.57%)';

const rowColor = 'hsl(165.54deg 89.04% 42.94%)';
const rowColorHover = 'hsl(165.54deg 89.04% 36.94%)';

const contentColor = 'hsl(0deg 0% 25.1%)';
const contentColorHover = 'hsl(0deg 0% 19.1%)';

const buttonCommonCss = 'border: transparent; color: #fff; cursor: pointer;';

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
    let hoverLockIsOn = false;
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
            if (hoverLockIsOn)
                return;
            let rect = null;
            if (blockType === 'RootSection') {
                rect = rect1;
            } else if (blockType === 'Columns') {
                rect = rect2;
                hideBorder(rect1);
                if (posRect.height < 40)
                    rect2.classList.add('buttons2-tweak-up');
            } else {
                if (blockType === 'Wrapper') return;
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
            if (hoverLockIsOn)
                return;
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
            if (hoverLockIsOn)
                return;
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
        // @ts-ignore
        _init(reRenderingWebPage, toEl) {
            const el = document.createElement('style');
            el.setAttribute('data-injected-by', 'sivujetti-in-context-editing-app');
            el.innerHTML = [
                '.j-Wrapper.is-cell {',
                '  pointer-events: none;',
                '}',
                '.j-Wrapper.is-cell > * {',
                '  pointer-events: all;',
                '}',
            ].join('\n');
            document.head.appendChild(el);

            const host = document.createElement('div');
            host.className = 'incontext-app-container';
            toEl.appendChild(host);
            const shadow = host.attachShadow({mode: 'open'});

            const template = document.createElement('template');
            template.innerHTML = createTemplateHtml();
            shadow.appendChild(template.content);

            // @ts-ignore Type 'Element' is missing the following properties from type 'HTMLElement'
            [rect1, rect2, rect3] = [...shadow.querySelectorAll('.rect')];

            addButtonsHandlers(rect1, this);
            addButtonsHandlers(rect2, this);
            addButtonsHandlers(rect3, this);

            function addButtonsHandlers(rect, self) {
                const [addAboveBtn, editBtn, cloneBtn, delBtn, moreBtn, addBelowBtn] = [...rect.querySelectorAll('button')];
                const type = {rect1: 'RootSection', rect2: 'Row', rect3: 'Content'}[rect.id];
                addAboveBtn.addEventListener('click', e => {
                    console.log(`${type}: addAboveBtn clicked`);
                    e.stopPropagation();
                });
                editBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    reRenderingWebPage.messagePortToEditApp.postMessage(['onClicked',
                        rect.getAttribute('data-block-id'),
                        1,
                        {x: e.clientX, y: e.clientY}]);
                });
                cloneBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    reRenderingWebPage.messagePortToEditApp.postMessage(['onCloneButtonClicked',
                        rect.getAttribute('data-block-id')]);
                });
                delBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    waitForEditAppEvent('onDeleteButtonClickHandled', () => {
                        self.clearAll();
                    });
                    reRenderingWebPage.messagePortToEditApp.postMessage(['onDeleteButtonClicked',
                        rect.getAttribute('data-block-id'),
                        type]);
                });
                moreBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    hoverLockIsOn = true;
                    waitForEditAppEvent('onMoreMenuClosed', e => {
                        /** @type {[any, string]} */
                        const [_, clickedLinkId] = e.data;
                        hoverLockIsOn = false;
                        if (['save-to-library', 'move-up', 'move-down'].indexOf(clickedLinkId) > -1)
                            self.clearAll();
                    });
                    reRenderingWebPage.messagePortToEditApp.postMessage(['onMoreButtonClicked',
                        rect.getAttribute('data-block-id'),
                        moreBtn.getBoundingClientRect()]);
                });
                addBelowBtn.addEventListener('click', e => {
                    e.stopPropagation();
                    const addAfter = true;
                    const commonArgs = [rect.getAttribute('data-block-id'), addBelowBtn.getBoundingClientRect()];
                    if (type === 'RootSection') {
                        reRenderingWebPage.messagePortToEditApp.postMessage(['onAddRootSectionButtonClicked',
                            addAfter,
                            ...commonArgs]);
                    } else {
                        reRenderingWebPage.messagePortToEditApp.postMessage(['onAddContentOrRowButtonClicked',
                            {addAfter, insertType: type === 'Content' ? 'contentOrRow' : 'row'},
                            ...commonArgs]);
                    }
                });
            }
            function waitForEditAppEvent(eventName, withFn) {
                const {messagePortToEditApp} = reRenderingWebPage;
                const listener = e => {
                    if (e.data[0] === eventName) {
                        withFn(e);
                        messagePortToEditApp.removeEventListener('message', listener);
                    }
                };
                messagePortToEditApp.addEventListener('message', listener);
            }
        }
    };
}

/**
 * @returns {string}
 */
function createTemplateHtml() {
    return (
`<style>
    .rect {
        --color: ${sectionColor};
        display: none;
        border: 1px solid var(--color);
        position: absolute;
        top: 0;
        left: 0;
        width: 0;
        height: 0;
        pointer-events: none;
    }
    #rect2 { --color: ${rowColor}; }
    #rect3 { --color: ${contentColor}; }
    .rect button {
        background: var(--color);
        ${buttonCommonCss}
        pointer-events: all;
        display: flex;
        align-items: center;
        padding: 2px;
    }
    #rect1 button:hover { --color: ${sectionColorHover}; }
    #rect2 button:hover { --color: ${rowColorHover}; }
    #rect3 button:hover { --color: ${contentColorHover}; }
    .rect.nopoint {
        pointer-events: none;
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
${createRectHtml('1')}
${createRectHtml('2')}
${createRectHtml('3')}
`
    );
}

/**
 * @param {string} nth
 * @returns {string}
 */
function createRectHtml(nth) {
    const editIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z"></path><circle cx="12" cy="12" r="3"></circle>');
    const cloneIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><rect x="8" y="4" width="12" height="12" rx="2"></rect><path d="M16 16v2a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-8a2 2 0 0 1 2 -2h2"></path>');
    const deleteIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><line x1="4" y1="7" x2="20" y2="7"></line><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"></path><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"></path>');
    const dotsIcon = pathIcon('<path stroke="none" d="M0 0h24v24H0z" fill="none"></path><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="19" r="1"></circle><circle cx="12" cy="5" r="1"></circle>');
    const s = {'1': 'section', '2': 'row', '3': 'content'}[nth];
    const s2 = s === 'content' ? 'content or row' : s;
    return (
`<span class="rect" id="rect${nth}">
    <button title="Add new ${s2} above">${plusIcon}</button>
    <span>
        <button title="${capitalize(s)} settings">${editIcon}</button>
        <button title="Clone ${s}">${cloneIcon}</button>
        <button title="Delete ${s}">${deleteIcon}</button>
        <button title="More options">${dotsIcon}</button>
    </span>
    <button title="Add new ${s2} below">${plusIcon}</button>
</span>`
    );
}

/**
 * @param {string} str
 * @returns {string}
 */
function capitalize(str) {
    return `${str.charAt(0).toUpperCase()}${str.substring(1, str.length)}`;
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
    contentColor,
    contentColorHover,
    plusIcon,
    rowColor,
    rowColorHover,
    sectionColorHover,
};
