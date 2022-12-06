import {__, env, urlUtils, iconAsString} from '@sivujetti-commons-for-edit-app';
import {determineModeFromPreview} from './common.js';

const Quill = window.Quill;

class MySnowTheme extends Quill.import('themes/snow') {
    // sivujettiApi;
    /**
     * @inheritdoc
     */
    constructor(quill, options) {
        super(quill, options);
        this.sivujettiApi = options.sivujettiApi;
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
        el.insertBefore(myPreviewLink, el.firstElementChild);
        el.insertBefore(myPreviewTitle, el.firstElementChild);

        const origShow = this.tooltip.show;
        this.tooltip.show = (...args) => {
            const linkEl = this.tooltip.preview;
            let noOrigin, urlPreview;
            if (linkEl.host === window.location.host) {
                noOrigin = linkEl.href.substring(linkEl.origin.length);
                urlPreview = determineModeFromPreview(noOrigin)[0] === 'pick-url'
                    ? noOrigin.substring(urlUtils.baseUrl.length - 1)
                    : `public/uploads/${noOrigin.split('/public/uploads/')[1]}`;
            } else {
                noOrigin = !linkEl.href.startsWith('//') ? linkEl.href : linkEl.href.substring('//'.length);
                urlPreview = noOrigin;
            }
            const [mode, title] = determineModeFromPreview(noOrigin);
            const icon = {
                'pick-url': 'file',
                'pick-image': 'photo',
                'type-external-url': 'external-link',
            }[mode];
            myPreviewTitle.innerHTML = iconAsString(icon, 'size-xs color-dimmed3 mr-1') +
                `<span class="col-mr-auto">${title}</span>`;
            myPreviewLink.href = linkEl.href;
            myPreviewLink.title = linkEl.href;
            myPreviewLink.target = '_blank';
            myPreviewLink.textContent = urlPreview;
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

////////////////////////////////////////////////////////////////////////////////

const Delta = Quill.import('delta');
class MyClipboard extends Quill.import('modules/clipboard') {
    /**
     * @inheritdoc
     */
    onPaste(e) {
        // https://github.com/quilljs/quill/blob/d462f8000ffbaa3aab853809fb08f7809f828475/modules/clipboard.js#L178
        if (e.defaultPrevented || !this.quill.isEnabled()) return;
        e.preventDefault();
        const range = this.quill.getSelection(true);
        if (range == null) return;
        // https://github.com/quilljs/quill/issues/1298#issuecomment-403657657
        const text = e.clipboardData.getData('text/plain');
        const delta = new Delta()
            .retain(range.index)
            .delete(range.length)
            .insert(text);
        const index = text.length + range.index;
        const length = 0;
        this.quill.updateContents(delta, Quill.sources.USER);
        this.quill.setSelection(index, length, Quill.sources.SILENT);
        this.quill.scrollIntoView();
    }
}

////////////////////////////////////////////////////////////////////////////////

const Keyboard = Quill.import('modules/keyboard');
class MyKeyboard extends Keyboard { }
MyKeyboard.DEFAULTS = Object.assign({}, Keyboard.DEFAULTS, {
    bindings: Object.assign({}, Keyboard.DEFAULTS.bindings, {
        ['list autofill']: undefined
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
        const isLocal = value.startsWith('/') && !value.startsWith('//');
        if (isLocal && node.host === env.window.location.host) {
            node.removeAttribute('rel');
            node.removeAttribute('target');
            addOriginToHrefOf(node);
        }
        return node;
    }
    /**
     * @inheritdoc
     */
    static sanitize(url) {
        const anchor = document.createElement('a');
        anchor.href = url;
        const protocol = anchor.href.slice(0, anchor.href.indexOf(':'));
        return protocol ? url : this.SANITIZED_URL;
    }
    /**
     * @inheritdoc
     */
    format(name, value) {
        super.format(name, value);
        if (value && value.startsWith('/') && !value.startsWith('//') && this.domNode.host === env.window.location.host) {
            addOriginToHrefOf(this.domNode);
        }
    }
}

/**
 * @param {HTMLAnchorElement} linkEl
 */
function addOriginToHrefOf(linkEl) {
    const urlNoOrigin = linkEl.getAttribute('href');
    linkEl.setAttribute('data-href-original', urlNoOrigin);
    linkEl.setAttribute('href', linkEl.origin + urlNoOrigin);
}

export {MySnowTheme, MyClipboard, MyKeyboard, MyLink};
