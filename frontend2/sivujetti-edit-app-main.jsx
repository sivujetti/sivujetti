/*
An entry point for global file "public/v2/sivujetti-edit-app-main.js" that is
included in edit-app's template (edit-app-wrapper.tmpl.php).
*/
import {api} from '@sivujetti-commons-for-edit-app';
import EditApp from './edit-app/EditApp.jsx';
import WebPagePreviewIframe, {FooTemp} from './edit-app/main-column/Foo.jsx';

// <div id="inspector-panel"></div> todo
// <div id="view"></div> todo

preact.render(
    <EditApp
        dataFromAdminBackend={ window.dataFromAdminBackend }
        onMounted={ cmp => {
            api.saveButton.init(cmp.saveButtonRef);
        }}/>,
    document.getElementById('main-panel')
);

preact.render(
    <WebPagePreviewIframe urlToLoad="@currentUrl"/>,
    document.getElementById('webpage-preview-app')
);

/*const webPagePreview = new FooTemp;
webPagePreview.mount(':currentUrl');*/
