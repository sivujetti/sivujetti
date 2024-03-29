import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './include-internal/validation.en.js';

stringBundles.push({
    'Page': 'Page',
    'New page': 'New page',
    'Categories': 'Categories',
    'Services': 'Services',
    'Services#partitive': 'Services',
    'Service': 'Service',
    'No results for "%s"': 'No results for "%s"',
    // edit-app/src/commons/FileUploader.jsx
    'Images': 'Images',
    'Files': 'Files',
    'Drop files here': 'Drop files here',
    'No uploads yet.': 'No uploads yet.',
    // edit-app/src/commons/UploadButton.jsx
    'File #%s could not be uploaded because the file type is not supported.': 'File #%s could not be uploaded because the file type is not supported.',
    'File #%s could not be uploaded because its size exceeded the maximum %sMB': 'File #%s could not be uploaded because its size exceeded the maximum %sMB',
    'Failed to upload file #%s': 'Failed to upload file #%s',
    'Upload files': 'Upload files',
    'You can also drag files here\n from your computer.': 'You can also drag files here\n from your computer.',
    // edit-app/src/left-column/block/BlockDnDSpawner.jsx
    'Start adding content': 'Start adding content',
    'reusable content': 'reusable content',
    'Filter': 'Filter',
    'Reusables': 'Reusables',
    'Common': 'Common',
    'Specialized': 'Specialized',
    'Unique reusables': 'Uniques reusables',
    'duplicated': 'duplicated',
    // edit-app/src/left-column/block/CodeBasedStylesList|WidgetBasedStylesList.jsx.jsx
    'You can add and remove this content\'s styles in "Styles" tab': 'You can add and remove this content\'s styles in "Styles" tab',
    'This style does not have editable values.': 'This style does not have editable values.',
    'No own templates': 'No own templates',
    'Add style': 'Add style',
    'Select style': 'Select style',
    'create clone': 'create clone',
    'create new': 'create new',
    'reuse': 'reuse',
    'Create template': 'Create template',
    'Base template': 'Base template',
    'Show parent styles': 'Show parent styles',
    'Show parent templates': 'Show parent templates',
    'Edit name': 'Edit name',
    'Set as default': 'Set as default',
    'Copy styles': 'Copy styles',
    'Paste styles': 'Paste styles',
    'Edit details': 'Edit details',
    'Deactivate style': 'Deactivate style',
    'Deactivate': 'Deactivate',
    'Delete style': 'Delete style',
    'Css for the outermost %s (%s)': 'Css for the outermost %s (%s)',
    'element': 'element',
    'wrapper-element': 'wrapper-element',
    'Css for the inner elements': 'Css for the inner elements',
    'Other classes': 'Other classes',
    'Default': 'Default',
    'Style name': 'Style name',
    // edit-app/src/left-column/block/BlockStylesTab2.jsx
    'No editable styles.': 'No editable styles.',
    // edit-app/src/left-column/block/VisualStyles.jsx
    'Restore default': 'Restore default',
    // edit-app/src/left-column/block/createBlockTreeDndController.js
    'You lack permissions to edit this content.': 'You lack permissions to edit this content.',
    // edit-app/src/left-column/page/AddCategoryPanel.jsx
    'Category': 'Category',
    'New category name': 'New category name',
    'Create category': 'Create category',
    // edit-app/src/left-column/page/ManyToManyField.jsx
    'No %s found': 'No %s found',
    'category': 'category',
    // edit-app/src/left-column/page/PageCreatePanel.jsx
    'Create %s': 'Create %s',
    'Cancel create %s': 'Cancel create %s',
    'Back': 'Back',
    'Layout': 'Layout',
    'Add to menu': 'Add to menu',
    'Title': 'Title',
    'Slug': 'Slug',
    'Content': 'Content',
    'Page "%s" already exist.': 'Page "%s" already exist.',
    'Something unexpected happened.': 'Something unexpected happened.',
    // edit-app/src/right-column/page/PagesListView.jsx
    'Create new %s': 'Create new %s',
    'Edit page': 'Edit page',
    'Duplicate page': 'Duplicate page',
    'Delete page': 'Delete page',
    'Deleted page "%s".': 'Deleted page "%s".',
    'Failed to delete page.': 'Failed to delete page.',
    // edit-app/src/quill/*,
    'Image': 'Image',
    'File': 'File',
    'External': 'External',
    'website.com': 'website.com',
    'Choose link type': 'Choose link type',
    'Choose a link': 'Choose a link',
    'No link selected': 'No link selected',
    'Change': 'Change',
    'Jump in page': 'Jump in page',
    'Pick %s': 'Pick %s',
    'a page': 'a page',
    'Type an address': 'Type an address',
    'Link to a page: ': 'Link to a page: ',
    'Link to image/file: ': 'Link to image/file: ',
    'Link to an address: ': 'Link to an address: ',
    'Anchor': 'Anchor',
    // edit-app/src/left-column/block/BlockEditForm.jsx
    'Styles': 'Styles',
    'Styles (code)': 'Styles (code)',
    'Styles must contain at least one CSS-rule': 'Styles must contain at least one CSS-rule',
    'Only root styles may contain @imports': 'Only root styles may contain @imports',
    // edit-app/src/left-column/block/BlockTree.jsx
    'Add child content': 'Add child content',
    'Duplicate': 'Duplicate',
    'Duplicate content': 'Duplicate content',
    'Delete': 'Delete',
    'Delete content': 'Delete content',
    'Save as reusable': 'Save as reusable',
    'Save as reusable content': 'Save as reusable content',
    'Content tree': 'Content tree',
    // edit-app/src/left-column/panel-sections/BaseStylesSection.jsx
    'Colours and fonts': 'Colours and fonts',
    'Visual': 'Visual',
    'Code': 'Code',
    // edit-app/src/left-column/panel-sections/ContentManagementSection.jsx
    'Content management': 'Content management',
    'page': 'page',
    // edit-app/src/left-column/panel-sections/OnThisPageSection.jsx
    'Duplicate this page': 'Duplicate this page',
    'Delete this page': 'Delete this page',
    'Show without edit mode': 'Show without edit mode',
    'On this page': 'On this page',
    'Default content': 'Default content',
    'Content of page %s': 'Content of %s-page',
    'New page content': 'New page content',
    // edit-app/src/left-column/panel-sections/WebsiteSection.jsx
    'Website': 'Website',
    'Website\'s settings': 'Website\'s settings',
    'Settings': 'Settings',
    'Edit info': 'Edit info',
    'Updates': 'Updates',
    // edit-app/src/left-column/page-type/PageTypeCreatePanel.jsx
    'page type': 'page type',
    'Basic settings': 'Basic settings',
    'Fields': 'Fields',
    // _
    'Pages': 'Pages',
    'Pages#partitive': 'Pages',
    'Page categories': 'Page categories',
    'Page categories#partitive': 'Page categories',
    // edit-app/src/EditApp.jsx
    'Edit mode': 'Edit mode',
    'Hide edit menu': 'Hide edit menu',
    'Go to dashboard': 'Go to dashboard',
    'Log out': 'Log out',
    'You can add content by dragging': 'You can add content by dragging',
    'Cool!': 'Ok!',
    'Did you know?': 'Did you know?',
    'When you\'re in the edit mode, you still can navigate any website hyperlink by clicking on it holding Ctrl (Windows) or ⌘ (Mac) key.': 'When you\'re in the edit mode, you still can navigate any website hyperlink by clicking on it holding Ctrl (Windows) or ⌘ (Mac) key.',
    'Created new %s': 'Created new %s',
    'Page title': 'Page title',
    // edit-app/src/left-column/InspectorPanel.jsx
    'Close': 'Close',
    // edit-app/src/left-column/page-type/PageTypeBasicInfoConfigurationForm.jsx
    'Name (for computers)': 'Name (for computers)',
    'Name (plural)': 'Name (plural)',
    'Description': 'Description',
    'Listable': 'Listable',
    'Default layout': 'Default layout',
    // edit-app/src/popups/reusable-branch/SaveBlockAsReusableDialog.jsx
    'This function saves this content as reusable content, which can be easily added to other pages later on.': 'This function saves this content as reusable content, which can be easily added to other pages later on.',
    'Name': 'Name',
    'e.g. Text and image, Footer': 'e.g. Text and image, Footer',
    'Type': 'Tyyppi',
    'Duplicating': 'Duplicating',
    'todo12': 'todo12',
    'Unique': 'Unique',
    'todo13': 'todo13',
    'Cancel': 'Cancel',
    // edit-app/src/popups/styles/EditUnitOrSetAsDefaultDialog.jsx
    'Specifier': 'Specifier',
    'todo16 %s': 'todo16 %s', // Tämä toiminto merkitsee nämä tyylit tyyleihin, jota käytetään automaattisesti uusissa, sivuun lisätyissä  %s -sisällöissä.'
    'Visible for non-admins': 'Visible for non-admins',
    'Allow non-admin users to add these\nstyles to contents in visual styles': 'Allow non-admin users to add these\nstyles to contents in visual styles',
    'optional': 'optional',
    'Evaluates to\n`body [specifierHere] .%s`': 'Evaluates to\n`body [specifierHere] .%s`',
    'e.g. `>`, `div`, `.j-Button >`': 'e.g. `>`, `div`, `.j-Button >`',
    // edit-app/src/popups/BlockTreeShowHelpPopup.jsx
    'In Sivujetti, the content of pages is presented as a tree structure: each row or branch in the tree corresponds to a section or content of the page. You can ': 'In Sivujetti, the content of pages is presented as a tree structure: each row or branch in the tree corresponds to a section or content of the page. You can ',
    'arrange': 'arrange',
    ' the different sections of the page by dragging the rows in the content tree. You can start ': ' the different sections of the page by dragging the rows in the content tree. You can start ',
    'adding content': 'adding content',
    ' using the': ' using the',
    'button': 'button',
    ' on the left side of the page.': ' on the left side of the page.',
    'Colorless': 'Colorless',
    'Regular content, with no colored text, is ': 'Regular content, with no colored text, is ',
    'stored only to this page': 'stored only to this page',
    'Orange': 'Orange',
    'Unique content refers to ': 'Unique content refers to ',
    'separately stored data': 'separately stored data',
    '. When you edit unique content on one page, the information changes in all corresponding content across pages.': '. When you edit unique content on one page, the information changes in all corresponding content across pages.',
    'Violet': 'Violet',
    'Meta content contains ': 'Meta content contains ',
    'additional data / metadata': 'additional data / metadata',
    ', and otherwise act like ordinary content.': ', and otherwise act like ordinary content.',
    // edit-app/src/left-column/SaveButton.jsx
    'You have unsaved changes, do you want to navigate away?': 'You have unsaved changes, do you want to navigate away?',
    'Undo latest change': 'Undo latest change',
    'Save changes': 'Save changes',
    // edit-app/src/right-column/WebPageIframe.js
    'Copy': 'Copy',
    // edit-app/src/block-types/menu/EditForm.jsx
    'Create and add page': 'Create and add page',
    'Add link': 'Add link',
    'Edit': 'Edit',
    'Edit link': 'Edit link',
    'Delete link': 'Delete link',
    // edit-app/src/block-types/menu/EditItemPanel.jsx
    'Link text': 'Link text',
    'Url address': 'Url address',
    // edit-app/src/block-types/menu/menu.js
    'Menu': 'Menu',
    'Home': 'Home',
    'About': 'About',
    // edit-app/src/block-types/button.js
    'Button': 'Button',
    'Link element': 'Link element',
    'Normal button': 'Normal button',
    'Submit button': 'Submit button',
    'Link': 'Link',
    'Css classes': 'Css classes',
    'Tag type': 'Tag type',
    'Button text': 'Button text',
    // edit-app/src/block-types/code.js
    'My code ...': 'My code ...',
    'Waits for configuration ...': 'Waits for configuration ...',
    // edit-app/src/block-types/columns.js
    'Columns': 'Columns',
    'Num columns': 'Num columns',
    'Full width': 'Full width',
    // edit-app/src/block-types/heading.js
    'Heading': 'Heading',
    'Level': 'Level',
    'Add content after': 'Add content after',
    'Heading text': 'Heading text',
    // edit-app/src/block-types/listing/AdditionalFiltersBuilder.jsx
    'which are': 'which are',
    'which is': 'which is',
    'added to category': 'added to category',
    '%s %s starts with': '%s %s starts with',
    'which#nominative': 'which',
    'which': 'which',
    'whose': 'whose',
    'which#genitive': 'which',
    'blog': 'blog',
    'This value': 'This value',
    'and': 'and',
    'Delete filter': 'Delete filter',
    'Add filter': 'Add filter',
    // edit-app/src/block-types/listing/EditForm.jsx
    'List': 'List',
    'all': 'all',
    'single': 'single',
    'at most': 'at most',
    'Type amount': 'Type amount',
    'ordered by': 'ordered by',
    'newest to oldest': 'newest to oldest',
    'oldest to newest': 'oldest to newest',
    'randomly': 'randomly',
    'rendering %s using template': 'rendering %s using template',
    'it': 'it',
    'them': 'them',
    'Add new %s': 'Add new %s',
    '%s must be a number': '%s must be a number',
    // edit-app/src/block-types/listing/listing.js
    'Listing': 'Listing',
    // edit-app/src/block-types/image.js
    'Image file': 'Image file',
    'Alt text': 'Alt text',
    'The text that a browser displays\nif the image cannot be loaded': 'The text that a browser displays\nif the image cannot be loaded',
    // edit-app/src/block-types/pageInfo.js
    'PageInfo': 'Metadata',
    'Url (slug)': 'Url (slug)',
    'Social image': 'Social image',
    'Meta description': 'Meta description',
    // edit-app/src/block-types/paragraph.js
    'Paragraph': 'Paragraph',
    'Paragraph text': 'Paragraph text',
    // edit-app/src/block-types/richText.js
    'RichText': 'Rich text',
    'Rich text': 'Rich text',
    'Rich text content': 'Rich text content',
    // edit-app/src/block-types/section.js
    'Section': 'Section',
    'Background#image': 'Background',
    // edit-app/src/block-types/text.js
    'Text content': 'Text content',
    // edit-app/src/block-widget/ImagePicker.jsx
    'Choose a picture': 'Choose a picture',
    // edit-app/src/right-column/website/WebsiteApplyUpdatesView.jsx
    'No updates available.': 'No updates available.',
    // edit-app/src/right-column/website/WebsiteEditBasicInfoView.jsx
    'Edit website info': 'Edit website info',
    'These details are visible to search engines and when sharing pages on social media channels.': 'These details are visible to search engines and when sharing pages on social media channels.',
    'Language': 'Language',
    'Discourage search engines from indexing this site': 'Discourage search engines from indexing this site',
    'Saved website\'s basic info.': 'Saved website\'s basic info.',
    // ../std-styles.md
    'Text default': 'Text default',
    'Headings default': 'Headings default',
    'Background default': 'Background default',
    'Links default': 'Links default',
    'Links hover': 'Links hover',
    'Max width default': 'Max width default',
    // Listing
    'Gap': 'Gap',
    // Menu
    'List style type': 'List style type',
    'Items width': 'Items width',
    'Links normal': 'Links normal',
    'Links transform': 'Links transform',
    'Padding top': 'Padding top',
    'Padding right': 'Padding right',
    'Padding bottom': 'Padding bottom',
    'Padding left': 'Padding left',
    // Button
    'Background normal': 'Background normal',
    'Background hover': 'Background hover',
    'Text': 'Text',
    'Text hover': 'Text hover',
    'Border': 'Border',
    'Border hover': 'Border hover',
    'Align horizontal': 'Align horizontal',
    'Min width': 'Min width',
    'Radius': 'Radius',
    // Code
    'Display': 'Display',
    // Columns
    'Align items': 'Align items',
    // Image
    'Float': 'Float',
    'Min height': 'Min height',
    'Max height': 'Max height',
    'Max width': 'Max width',
    // Section
    'Align vertical': 'Align vertical',
    'Background': 'Background',
    'Cover': 'Cover',
    'Text align': 'Text align',
    // Text
    'Text normal': 'Text normal',
    'Text headings': 'Text headings',
    'Links': 'Links',
    'Line height': 'Line height',
    'Paragraphs margin': 'Paragraphs margin',
}, validationStrings);
