import {
    __,
    api,
    determineModeFromPreview,
    doubleNormalizeUrl,
    events,
    getVisibleSlug,
    iconAsString,
    stringUtils,
} from '@sivujetti-commons-for-edit-app';
import openManageMiscStylesDialog from '../main-column/popups/QuillMiscStylesManageDialog/Dialog.jsx';
import {getRegisteredQuillMiscStyleOptions} from './quill-funcs.js';

const Quill = window.Quill;

class MySnowTheme extends Quill.import('themes/snow') {
    /**
     * @inheritdoc
     */
    constructor(quill, options) {
        super(quill, options);
        this.sivujettiApi = options.sivujettiApi;
        this.handleMouseUpOutsideWindow = () => {
            if (this.quill.selection.mouseDown)
                this.quill.selection.update(Quill.sources.USER);
        };
        window.addEventListener('mouseup', this.handleMouseUpOutsideWindow);
    }
    /**
     * @access public
     */
    destroy() {
        window.removeEventListener('mouseup', this.handleMouseUpOutsideWindow);
        if (this.unregisterRebuildListener)
            this.unregisterRebuildListener();
    }
    /**
     * @inheritdoc
     */
    extendToolbar(toolbar) {
        super.extendToolbar(toolbar);
        //
        const el = this.tooltip.root;
        const [editLink, deleteLink] = [el.lastChild.previousSibling, el.lastChild];
        if (!editLink.classList.contains('btn')) {
            editLink.textContent = __('Edit');
            deleteLink.textContent = __('Delete');
            editLink.classList.add('btn', 'btn-sm');
            deleteLink.classList.add('btn', 'btn-sm', 'ml-1');
        }

        const originalPreviewEl = this.tooltip.preview;
        originalPreviewEl.style.display = 'none';
        const myPreviewTitle = document.createElement('div');
        myPreviewTitle.className = 'flex-centered';
        const myPreviewLink = document.createElement('a');
        myPreviewLink.className = 'd-block text-ellipsis my-1';
        const altPreviewEl = document.createElement('span');
        altPreviewEl.className = `${myPreviewLink.className} d-none`;
        el.insertBefore(altPreviewEl, el.firstElementChild);
        el.insertBefore(myPreviewLink, el.firstElementChild);
        el.insertBefore(myPreviewTitle, el.firstElementChild);

        const origShow = this.tooltip.show;
        this.tooltip.show = (...args) => {
            const linkEl = this.tooltip.preview;
            let previewEl, noOrigin, urlPreview;

            if (linkEl.host === window.location.host) {
                const isHashOnly = linkEl.href.indexOf('/_edit#') > -1;
                if (isHashOnly || linkEl.href.endsWith('/_edit')) {
                    noOrigin = '/doesnt-matter';
                    urlPreview = isHashOnly
                        ? `#${linkEl.href.split('#')[1]}` // 'https://domain.com/index.php?q=/_edit#foo' -> '#foo'
                        : getVisibleSlug('');
                    //
                    previewEl = altPreviewEl;
                    showOrHideEls(previewEl, myPreviewLink);
                } else {
                    noOrigin = linkEl.href.substring(linkEl.origin.length);
                    urlPreview = doubleNormalizeUrl(noOrigin, determineModeFromPreview(noOrigin)[0]);
                    //
                    previewEl = myPreviewLink;
                    showOrHideEls(previewEl, altPreviewEl);
                }
            } else {
                previewEl = myPreviewLink;
                showOrHideEls(previewEl, altPreviewEl);
                noOrigin = doubleNormalizeUrl(linkEl.href, 'type-external-url');
                urlPreview = noOrigin;
            }
            const [mode, title] = determineModeFromPreview(noOrigin);
            const icon = {
                'pick-url': 'file',
                'pick-file': 'photo',
                'type-external-url': 'external-link',
            }[mode];
            myPreviewTitle.innerHTML = iconAsString(icon, 'size-xs color-dimmed3 mr-1') +
                `<span class="col-mr-auto">${title}</span>`;
            if (previewEl.nodeName === 'A') {
                previewEl.href = linkEl.href;
                previewEl.title = linkEl.href;
                previewEl.target = '_blank';
            }
            previewEl.textContent = urlPreview;
            return origShow.call(this.tooltip, ...args);
        };

        //
        const origEdit = this.tooltip.edit;
        this.tooltip.edit = (p1 = undefined, p2 = undefined, p3 = undefined) => {
            const mode = p1 || 'link';
            if (mode === 'link') {
                const linkEl = this.tooltip.preview;
                const url = p2 ? linkEl.host !== window.location.host
                    ? linkEl.href
                    : linkEl.href.substring(linkEl.origin.length) : '';
                const preview = p3 || null;
                this.tooltip.hide();
                this.sivujettiApi.openUrlPicker(preview, url);
                return;
            }
            return origEdit.call(this.tooltip, p1, p2);
        };

        const origPosition = this.tooltip.position;
        this.tooltip.position = reference =>
            origPosition.call(this.tooltip, Object.assign({}, reference, {left: 0}))
        ;
    }
    /**
     * @inheritdoc
     */
    buildPickers(selects, icons) {
        super.buildPickers(selects, icons);
        this.patchHeadingPicker();
        this.patchMiscStylesPicker();
        this.addIdPicker();
    }
    /**
     * @access private
     */
    patchHeadingPicker() {
        const picker = this.pickers.find(({select}) => select.classList.contains('ql-header'));
        if (!picker) return;

        const {label, options} = picker;
        label.setAttribute('data-h1-translated', `${__('Heading')} 1`);
        label.setAttribute('data-h2-translated', `${__('Heading')} 2`);
        label.setAttribute('data-h3-translated', `${__('Heading')} 3`);
        label.setAttribute('data-h4-translated', `${__('Heading')} 4`);
        label.setAttribute('data-h5-translated', `${__('Heading')} 5`);
        label.setAttribute('data-h6-translated', `${__('Heading')} 6`);
        label.setAttribute('data-p-translated', __('Paragraph'));
        Array.from(options.children).forEach(el => {
            const level = el.getAttribute('data-value');
            el.setAttribute('data-label-translated', level ? `${__('Heading')} ${level}` : __('Paragraph'));
        });
    }
    /**
     * @access private
     */
    patchMiscStylesPicker() {
        const picker = this.pickers.find(({select}) => select.classList.contains('ql-misc-style'));
        if (!picker) return;

        const tmp = document.createElement('div');
        tmp.innerHTML = '<div ' +
            'class="btn btn-link btn-xs p-0 c-pointer" ' +
            'style="position: absolute; top: 4px; right: 3px; height: 1rem" ' +
            'tabindex="0" ' +
            'role="button">' +
            iconAsString('settings', 'size-xs color-dimmed3').replace('<svg', '<svg style="position: static; margin: 0;"') +
        '</div>';
        if (!api.user.can('editWysiwygCssClassOptions')) return;
        const configBtn = tmp.firstElementChild;
        const doOpenManageMiscStylesDialog = e => {
            e.preventDefault();
            e.stopPropagation();
            openManageMiscStylesDialog();
            picker.close();
        };
        configBtn.addEventListener('click', doOpenManageMiscStylesDialog);
        configBtn.addEventListener('keydown', /** @param {KeyboardEvent} e */ e => {
            if (e.key === 'Enter')
                doOpenManageMiscStylesDialog(e);
        });
        picker.options.appendChild(configBtn);

        this.unregisterRebuildListener = events.on('misc-wysiwyg-styles-updated', _newOptions => {
            this.destroy();
            this.sivujettiApi.rebuild();
        });
    }
    /**
     * @access private
     */
    addIdPicker() {
        const mainToolbarButton = this.modules.toolbar?.container.querySelector('.ql-id-anchor');
        if (!mainToolbarButton) return; // not defined in toolbar config

        let appliedVal;
        let clearIdBtn;
        let input;
        const wrapperSpan = document.createElement('span');
        wrapperSpan.className = 'ql-picker ql-id-anchor-picker';
        const createElementUsing = html => {
            const tmp = document.createElement('div'); tmp.innerHTML = html; return tmp.firstElementChild;
        };
        const doClose = () => {
            if (wrapperSpan.classList.contains('ql-expanded')) wrapperSpan.classList.remove('ql-expanded');
        };
        const doApplyId = (wait = false) => {
            const val = input.value ? stringUtils.slugify(input.value) : '';
            if (val === appliedVal) { doClose(); return; }
            const applyNewVal = () => {
                this.quill.format('id-anchor', val || null);
                if (val) clearIdBtn.style.display = 'block';
                doClose();
            };
            if (!wait) applyNewVal(); else setTimeout(applyNewVal, 10);
        };

        // {
            const innerSpan = document.createElement('span');
            innerSpan.className = 'ql-picker-options';

            // {
                innerSpan.appendChild(createElementUsing(`<label class="d-block color-dimmed">${__('Anchor')}:</label>`));

                //
                const inputWrap = document.createElement('span');
                inputWrap.className = 'has-icon-right d-flex flex-centered my-1';

                inputWrap.appendChild(document.createTextNode('#'));

                input = document.createElement('input');
                input.className = 'form-input tight ml-1';
                input.style.minWidth = '7rem';
                inputWrap.appendChild(input);
                input.addEventListener('keydown', ({key}) => { if (key === 'Enter') doApplyId(true); });

                const svg = iconAsString('x', 'color-dimmed').replace('color-dimmed"', 'color-dimmed" style="margin: 0; position: static;"');
                clearIdBtn = createElementUsing(`<button class="sivujetti-form-icon btn no-color mr-1" type="button" style="display: none;top: 2px;">${svg}</button>`);
                clearIdBtn.addEventListener('click', () => {
                    input.value = '';
                    clearIdBtn.style.display = 'none';
                });
                inputWrap.appendChild(clearIdBtn);

                innerSpan.appendChild(inputWrap);
            // }

            const doApplyIdSpanBtn = createElementUsing('<input type="button" class="btn btn-sm" value="Ok">');
            doApplyIdSpanBtn.addEventListener('click', doApplyId);
            innerSpan.appendChild(doApplyIdSpanBtn);

            const cancelChangesSpanBtn = createElementUsing(`<input type="button" class="btn btn-sm btn-link" value="${__('Peruuta')}">`);
            cancelChangesSpanBtn.addEventListener('click', doClose);
            innerSpan.appendChild(cancelChangesSpanBtn);

            wrapperSpan.appendChild(innerSpan);
        // }

        mainToolbarButton.parentNode.insertBefore(wrapperSpan, mainToolbarButton);

        mainToolbarButton.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            const curval = this.quill.getFormat()['id-anchor'];
            if (!window.sivujettiUserFlags?.useBlockIdPickerScope &&
                !this.quill.selection.getRange()[0]?.length) {
                window.alert(__(!curval
                    ? 'First, select the text you want to mark as an anchor.'
                    : 'First, highlight the entire text of the anchor you want to edit.'
                ));
                return false;
            }
            input.value = curval || '';
            if (curval) clearIdBtn.style.display = 'block';
            appliedVal = curval;
            wrapperSpan.classList.add('ql-expanded');
            input.focus();
            return false;
        }, true);

        // Add fake picker so quill can close it
        this.pickers.push({
            container: wrapperSpan,
            close: doClose,
            update() {
                // Do nothing
            }
        });
    }
}
MySnowTheme.DEFAULTS.modules.toolbar.handlers.link = function (value) {
    const {quill} = this;
    if (value) {
        const range = quill.getSelection();
        if (range == null || range.length == 0) return;
        const preview = quill.getText(range);
        quill.theme.tooltip.edit('link', '', preview);
    } else {
        quill.format('link', false);
    }
};

/**
 * @param {HTMLElement} toShow
 * @param {HTMLElement} toHide
 */
function showOrHideEls(toShow, toHide) {
    toShow.classList.remove('d-none');
    toHide.classList.add('d-none');
}

////////////////////////////////////////////////////////////////////////////////

const Delta = Quill.import('delta');
class MyClipboard extends Quill.import('modules/clipboard') {
    /**
     * @inheritdoc
     */
    onPaste(range, {text}) {
        // https://github.com/quilljs/quill/issues/1184#issuecomment-891859468
        const delta = new Delta()
            .retain(range.index)
            .delete(range.length)
            .insert(text);
        this.quill.updateContents(delta, Quill.sources.USER);
        this.quill.setSelection(
            delta.length() - range.length,
            Quill.sources.SILENT,
        );
        this.quill.scrollSelectionIntoView();
    }
}

////////////////////////////////////////////////////////////////////////////////

const Keyboard = Quill.import('modules/keyboard');
class MyKeyboard extends Keyboard {}
// https://stackoverflow.com/a/67308854
MyKeyboard.DEFAULTS = Object.assign({}, Keyboard.DEFAULTS, {
    bindings: Object.assign({}, Keyboard.DEFAULTS.bindings, {
        ['list autofill']: undefined,
    })
});

////////////////////////////////////////////////////////////////////////////////

// https://codepen.io/anon/pen/GNMXZa
class MyLink extends Quill.import('formats/link') {
    /**
     * @inheritdoc
     */
    static create(value) {
        const node = super.create(value);
        const isEmpty = value === '-';
        const isLocalJump = value.startsWith('#');
        const isLocal = isEmpty || isLocalJump || (
            value.startsWith('/') &&
            !value.startsWith('//') &&
            node.host === window.location.host
        );
        if (isLocal) {
            node.removeAttribute('rel');
            node.removeAttribute('target');
            if (!isEmpty && !isLocalJump)
                addOrReplaceHrefAttrsPatch(node);
        }
        return node;
    }
    /**
     * @inheritdoc
     */
    static sanitize(url) {
        const anchor = document.createElement('a');
        const norm = url !== '-' ? url : '';
        anchor.href = url;
        if (norm === '') return norm;
        const protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
        return protocol ? url : this.SANITIZED_URL;
    }
    /**
     * @inheritdoc
     */
    format(name, value) {
        super.format(name, value);
        const isLocal = this.domNode.host === window.location.host;
        // Local link turned to external -> clear 'data-href-original'
        if (this.domNode.getAttribute('data-href-original') && !isLocal) {
            this.domNode.removeAttribute('data-href-original');
        } else if (value && value.startsWith('/') && !value.startsWith('//') && isLocal) {
            addOrReplaceHrefAttrsPatch(this.domNode);
        }
    }
}

/**
 * @param {HTMLAnchorElement} linkEl
 */
function addOrReplaceHrefAttrsPatch(linkEl) {
    const urlNoOrigin = linkEl.getAttribute('href');
    linkEl.setAttribute('data-href-original', urlNoOrigin);
    linkEl.setAttribute('href', linkEl.origin + urlNoOrigin);
}

////////////////////////////////////////////////////////////////////////////////

const Parchment = Quill.import('parchment');
const IdAttributor = new Parchment.Attributor('id-anchor', 'id', {
    scope: window.sivujettiUserFlags?.useBlockIdPickerScope
        ? Parchment.Scope.BLOCK
        : Parchment.Scope.INLINE_ATTRIBUTE
});

////////////////////////////////////////////////////////////////////////////////

/**
 * @param {Array<WysiwygMiscStyleOption>} options
 * @param {Object} Quill = window.Quill
 */
function registerMiscStylePicker(options, Quill = window.Quill) {
    const Parchment = Quill.import('parchment');

    const {ClassAttributor, Scope} = Parchment;
    const MiscStyleClass = new ClassAttributor('misc-style', 'ql-misc-style', {
        scope: Scope.INLINE,
        whitelist: options.map(({cssClass}) => cssClass),
    });

    Quill.register({
        'attributors/class/misc-style': MiscStyleClass,
        'formats/misc-style': MiscStyleClass,
    }, true);

    const el = getOrCreateHeadStyleEl();
    el.innerHTML = createMiscClassQuillCss(options);
}

/**
 * @returns {HTMLStyleElement}
 */
function getOrCreateHeadStyleEl() {
    /** @type {HTMLStyleElement} */
    let el = document.head.querySelector('style[data-injected-by="quill-misc-style-func"]');
    if (!el) {
        el = document.createElement('style');
        el.setAttribute('data-injected-by', 'quill-misc-style-func');
        document.head.appendChild(el);
    }
    return el;
}

const defClors = [
    '#e8f7fe', // hsl(199.09deg 91.67% 95.29%);
    '#e9ffe9', // hsl(120deg 100% 95.69%);
    '#feeae8', // hsl(5.45deg 91.67% 95.29%);
    '#f2e9ff', // hsl(264.55deg 100% 95.69%);
    '#ffffea', // hsl(60deg 100% 95.88%);
    '#f7ebe2', // hsl(25.71deg 56.76% 92.75%);

    // --hue: 0.9, --sat: 0.8, --light: 0.8
    '#96efee', // hsl(calc(199.09deg * var(--hue)) calc(91.67% * var(--sat)) calc(95.29% * var(--light)));
    '#a7f394', // hsl(calc(120deg * var(--hue)) calc(100% * var(--sat)) calc(95.69% * var(--light)));
    '#ef9d96', // hsl(calc(5.45deg * var(--hue)) calc(91.67% * var(--sat)) calc(95.29% * var(--light)));
    '#9397f3', // hsl(calc(264.55deg * var(--hue)) calc(100% * var(--sat)) calc(95.69% * var(--light)));
    '#f2e993', // hsl(calc(60deg * var(--hue)) calc(100% * var(--sat)) calc(95.88% * var(--light)));
    '#dbb69f', // hsl(calc(25.71deg * var(--hue)) calc(56.76% * var(--sat)) calc(92.75% * var(--light)));
];

/**
 * @param {Array<WysiwygMiscStyleOption>} options
 * @returns {string}
 */
function createMiscClassQuillCss(options) {
    return (
`:root {
    ${options.map((v, i) => `--col${i + 1}: ${v.color || defClors[i]};`).join('\n  ')}
}
.ql-snow .ql-picker.ql-misc-style .ql-picker-label:before,
.ql-snow .ql-picker.ql-misc-style .ql-picker-item:before {
    content: "${__('No style')}";
}
${options.map((v, i) =>
`.ql-snow .ql-picker.ql-misc-style .ql-picker-item[data-value="${v.cssClass}"] {
    background: var(--col${i + 1});
}
.ql-snow .ql-picker.ql-misc-style .ql-picker-label[data-value="${v.cssClass}"]:before,
.ql-snow .ql-picker.ql-misc-style .ql-picker-item[data-value="${v.cssClass}"]:before {
    content: "${v.name}";
}
.ql-editor .ql-misc-style-${v.cssClass} {
    background: var(--col${i + 1});
}`
).join('\n')}`
    );
}

/** @typedef {string[] | Array<string | Record<string, unknown>>} QuillToolbarConfigItem */

export default () => {
    Quill.debug('error');
    //
    Quill.register('themes/snow', MySnowTheme);
    Quill.register('modules/clipboard', MyClipboard);
    Quill.register('modules/keyboard', MyKeyboard);
    Quill.register('formats/id-anchor', IdAttributor);
    Quill.register(MyLink);
    api.addFilter('quillCreateToolbarConfig',
    /**
     * @param {Array<QuillToolbarConfigItem>} cfg
     * @param {string} type
     * @returns {Array<QuillToolbarConfigItem>}
     */
    (cfg, type) => {
        if (type === 'longText') return cfg.map(line => {
                // @ts-ignore
                if (line.at(-1).list === 'bullet') {
                    const options = getRegisteredQuillMiscStyleOptions();
                    if (options.length || api.user.can('editWysiwygCssClassOptions')) {
                        registerMiscStylePicker(options, Quill);
                        return [...line, {'misc-style': [false, ...options.map(({cssClass}) => cssClass)]}];
                    }
                }
                return line;
            });
        return cfg;
    });
};
