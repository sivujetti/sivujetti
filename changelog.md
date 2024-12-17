# Changelog

...

# 0.16.1 (2024-12-18)

_Translated by ChatGPT._

## Added
- Files can now be filtered in the "Choose a picture" popup and the files view
- New "Behaviours" submenu to the context menu of content blocks
  - Behaviours (e.g., lightbox gallery, image carousel) can now be added directly in the edit mode
  - Behaviours can be registered from plugins

## Changed
-

## Fixed
- An issue where the frontend threw an error if an empty string was set as the text for a menu link
- An issue where empty ("This page") links saved in the Quill editor's content were not stored in the database
- An issue where list items in the Quill editor (ul/li) were not correctly saved in the database
- An issue where the text in the "Excerpt" part of a listing block was sometimes printed with incorrect encoding
- An issue where the code block's code was only executed on page load but not when editing the block

# 0.16.0 (2024-11-25)

_Translated by ChatGPT._

## Added
- Content Templates Concept
    - Pages can now include pre-built content types, such as headers, content blocks, and footers.
    - Templates have preview images and are organized into separate tabs.
- Automatic Updater
    - All Sivujetti sites now periodically check for updates from the central server at sivujetti.org when logging into edit mode.
    - If updates are available, they can be installed with a single click.
    - The installation process first verifies that the server has everything needed for the update.
- Redo Support
    - All actions that could previously be undone (Undo) can now also be redone.
- External Image Support
    - Images for content, section backgrounds, and metadata social images can now be linked from external sources (e.g., `https://example-cdn.com/pic.jpg`).
- Image Captions
    - Captions (`<figcaption>`) can now be added to image content.
    - By default, captions appear below the image but can be repositioned using styles.
- Custom HTML Injection
    - Admin users can now define custom HTML code to be added to the `<head>` tag or at the end of the `<body>` tag of the final site.
    - This code is executed only in non-editing mode, making it suitable for analytics scripts and similar use cases.
- Improved Page Selection Filtering
    - Pages can now be filtered in the page selection widget.
- Wrapper Block Type
    - A new "Wrapper" block type has been added for grouping content.
- [JetForms plugin] Form submissions now support CAPTCHA methods (JetCaptcha, Google reCAPTCHA).
- [JetForms plugin] Admin users can configure site-wide CAPTCHA settings directly in editing mode.

## Changed
- Reverted Style System
    - Simplified to a system similar to version 0.14.0.
    - Content no longer has default styles by default; developers can create styles in code and configure widgets for customization by non-developers.
    - All content templates come with preconfigured widgets.
- Content Added via Popups
    - Content is now added through popups accessed from context menus in the content tree, replacing the previous drag-and-drop mechanism.
- Reusable Content
    - Any content can now be saved as reusable, not just sections or columns.
- Page Visibility
    - Pages can now be set as hidden or published.
    - Hidden pages are visible only to logged-in admin users.
- Enhanced Listing Block
    - The default template for listing blocks now allows customization of displayed sections (e.g., title, link, article image).
- Nested Global Reusable Content
    - Global reusable blocks can now be nested within other content, such as using the same contact information block in both a page and a footer.
- Updated Visual Style Tools
    - The color picker now uses the [Coloris](https://github.com/mdbassit/Coloris) library instead of [pickr](https://github.com/Simonwep/pickr).
- Quill Editor Improvements
    - Clicking on text content now focuses directly on the clicked position instead of defaulting to the beginning.
    - Hovering over text content now highlights elements such as paragraphs and headers, not just the outermost element.
- Improved Image Listings
    - Image listings now support both grid and list views.
- Enhanced Links
    - Links can now point to the current page or be empty (e.g., only an anchor #anchor).
    - This allows anchor-only links without a path (`/path`).
- Menus
    - Submenus can now be added to menu links.
    - Menu links can now be reordered via drag-and-drop and duplicated.
- Improved Anchors
    - Anchors are now applied to individual words instead of entire paragraphs or header elements in the Quill editor.
- Drag-and-Drop Updates
    - Page previews are now updated only when content is dropped (onDrop), not continuously during dragging (onSwap).
- CSS Class Autocompletion
    - The text field for CSS classes now supports autocomplete using the [Tagify](https://yaireo.github.io/tagify/) library.

## Fixed
- Resolved issues where the save button appeared unnecessarily when no changes were made.
- Fixed a bug where the image upload animation would get stuck if a server error occurred.
- Eliminated various `Incorrect use of <label for=FORM_ELEMENT>` warnings.
- Several other 🐛s

## Other
- Virtual DOM Rendering
    - Sivujetti now uses a virtual DOM-based rendering system (Preact), replacing the custom system.
    - This makes it easier for developers to add custom content block types, as they are now standard Preact components.
    - The backend still supports the older string/template-file-based system alongside the new one.
- Added an experimental ShortIdGenerator, which can generate block IDs that are 55–60% shorter than before.
    - Example before/after `-NrLtInpvP0ZfQcbylf-` -> `u585XQVD`

# 0.15.0 (2023-09-13)

_Translated by ChatGPT._

## Added
- All content block types now have "standard styles" that every Sivujetti theme includes at a minimum.
    - These include items such as button colors, image height and width, section background colors, etc.
    - The complete list can be found at -> [std-styles.md (core)](https://github.com/sivujetti/sivujetti/blob/master/std-styles.md), [std-styles.md (JetForms)](https://github.com/sivujetti/plugins/blob/master/JetForms/std-styles.md) and [std-styles.md (JetIcons)](https://github.com/sivujetti/plugins/blob/master/JetIcons/std-styles.md)
- Styles are now divided into two categories - "derivable" and "legacy" styles.
    - Legacy styles are the same as regular styles from the previous version.
    - Derivable styles are versatile styles from which copies are made, inheriting the original style's variables. This allows for creating multiple "derivatives" that inherit some aspects of the original style but add their own modifications. Most standard styles are of this type.
- Styles now have two separate tabs in the additional details panel for technical users - code tab and visual tab.
    - In the code tab, styles can be added to the "storage," edited, but not added to contents.
    - In the visual tab, styles can be added and removed from contents but do not manage the "storage."
    - Only the visual tab is shown to end-users.
- Pages can now be deleted in edit mode (except for the homepage).
- In color-type widgets, you can now change the color value using a hex string.
- The type of value (px, %, rem) for length-type widgets can now be changed in visual styles.
- [JetForms plugin] Added a natural language-based editing tool for contact form contents, allowing you to instruct it on what actions to take when a user submits the form, such as "send filled data by email," "save data to a database," or "display a message to the user on the page at a specific location."
- [JetForms plugin] Added the ability to browse user-submitted form data in edit mode.
- [JetForms plugin] Added captcha support and a (time-based) captcha implementation.
- [JetForms plugin] The backend now displays form submission errors for logged-in admin users, making it easier to identify errors without searching through server logs.
- [JetForms plugin] Admin users can now define the value for each option in dropdowns and radio fields separately. Values are still auto-generated for non-admin users as before.
- [JetForms plugin] Contact form contents can now define a reply-to email address.

## Changed
- Navigation in edit mode now occurs by clicking links with the Ctrl / ⌘ key held down.
- The content highlighting box (highlight-rect) is now only displayed when hovering over content, whereas previously, it remained visible as long as the content was selected in the additional details panel.

## Fixed
- An issue where the "newest first" / "oldest first" sorting order didn't work correctly for list contents and page listings.
- [JetForms plugin] Fixed an issue where the email formatter for sent emails wrongly sanitized certain characters (ä, ö).
- Various other 🐛s, including:
    - Popup forms for editing list contents now stay in place more reliably.
    - Updating util classes was broken in some cases (e.g., when clearing).

# 0.14.0 (2023-05-26)

_Translated by ChatGPT._

## Added
- Added the ability to define default styles for each content type.
    - These styles automatically apply when adding content of those types to a page, without the need to enable them separately.
- Added the ability to define headings, paragraphs, etc. in text contents as anchors (`<p id="anchor">`) in the WYSIWYG editor.
- Added the ability to define links to "Jump to section" (anchor) in the page selection widget (text contents, menus, and button links).
    - Supports external links (https://www.example.com#anchor) or internal links (/page#anchor).
- Added the ability to define "selection" type widgets in CSS code (e.g., text alignment -> left justify right).
- Added the option to "Disallow site indexing by search engines" in the editable site basic information.

# Changed
- Alt text can now be defined for images in the edit mode.
- Large radio buttons now visually match regular buttons.
- The WYSIWYG editor's toolbar is now always visible (position: static -> sticky).
- [JetForms plugin] Radio fields can now be added to pages.
- [JetForms plugin] Changed the "SMTP > Password" field to a password type.
    - The password can be revealed if desired by clicking on the eye icon.
- [JetForms plugin] Fixed an issue where form submission didn't work if the form was within unique reusable content.
- [JetForms plugin] Fixed an issue where number-type contents were not processed during form submission.
- [JetForms plugin] Moved the "Thank you for your message" element's position (from above the &lt;form&gt; element to inside the &lt;form&gt; element).
- [JetForms plugin] Added the ability to define default height for text fields (rows attribute).

# Fixed
- Fixed an issue with file uploads where confusion arose when two files with the same name were uploaded.
    - The uploaded file's name is automatically changed to file-1.jpg, etc., if file.jpg already exists.
- Fixed an issue where the WYSIWYG editor added empty paragraphs after certain elements (e.g., h5, h6).
- Several other 🐛s

# 0.13.0 (2023-03-15)

_Translated by ChatGPT._

## Added
- Edit mode now displays a confirmation dialog when navigating away from a page with unsaved changes.
- Added a separate "Files" view to the edit mode (Site > Files).
- Added the ability to upload file types other than images.
    - The functionality uses the same "algorithm" as WordPress, so all the same file types are supported (plus some common font file types: woff, ttf, otf).
- Added the ability to upload multiple files at once.
- Added the ability to upload files by dragging and dropping.
- New pages can now be automatically added to menus, in addition to the "Add Link" button, using the "Create and Add Page" button.

## Changed
- Header, Paragraph, and Rich Text contents are now consolidated as Text contents.
- Page selector widget is now used for menu content links, similar to text content links (manual typing of addresses is no longer required).
- Global styles of the site can now be edited while creating a page.
- Outermost regular contents of the content tree are now displayed as not collapsed by default (collapsed = false).
- Backend no longer renders unnecessary HTML comments for non-logged-in users.

## Fixed
- Contents can now be dragged between unique and non-unique contents.
- Eliminated notices related to PHP 8.2.
- Several other 🐛s

# 0.12.0 (2022-12-21)

_Translated by ChatGPT._

## Added
- Added visual, widget-based style editing, which allows changing styles without coding.
    - Currently, the feature supports colors and numbers (e.g., font sizes).
- Content can now be saved for reuse.
    - Saved content can be marked as unique (e.g., Footer) or duplicable (so that a new copy is created every time it's added to pages).
- Basic site information can now be edited from the edit mode menu (Settings > Edit Basic Info).
- Site pages can now be browsed from the edit mode menu (Site > Pages).
- Existing pages can now be duplicated (Site > Pages > ... menu > Duplicate or "This Page" > ... menu > Duplicate This Page).
- A page can now be tagged with a category when creating or editing the page (Content Tree > Metadata > Category > Create Category).
- List content can now be set to list only pages from a specific category.
- [JetIcons plugin] Initial version added, allowing the addition of icons from a library of around 3000 icons to pages.

## Changed
- When editing site colors, the page preview now updates while dragging the mouse, not only after the dragging ends.
- Button links no longer need to be manually typed; editing happens in a separate popup (similar to text content links).
- External links in text content can now include non-http/https links (e.g., tel:123, mailto:address, steam://game).
- The !important declaration is no longer required as frequently in CSS code for content styles, thanks to CSS layers.
- The save button now stays in the correct position.
- [JetForms plugin] Simplified editing view for contact form content.
- [JetForms plugin] Simplified message templates for contact forms.

## Fixed
- Content tree dragging functions now work more reliably.
- Content can now be duplicated within unique reusable content trees.
- The context menu no longer extends beyond the browser window.

# 0.11.0 (2022-08-15)

## Added
- A better way to add content
- Code/embed block type
- An undo button
- `$annotations` parameter to `PluginAPI->registerHttpRoute()` (Plugin developer can define ACL-rules for routes)
- Support for many-to-many properties

## Changed
- Replaced "Own Styles" and "Base styles" with "Styles"
- Image block type's default output (`<span><img>` -> `<figure><img>`)
- Button block type's default output (`<p><button|a>` -> `<button|a>`)
- Started a noStateManager -> redux -> storeon -transition
- Disabled `cli.php install-from-dir` temporarily

## Fixed
- 🐛s

# 0.10.0 (2022-05-12)

## Added
- An ability to drag blocks between block tree's branches
- `filterLimit`, and `filterAdditional.'p.url'.$startsWith` to listing blocks
- `WebPageAwareTemplate->head()`, which renders most common SEO-tags by default

## Changed
- The event type (onChange -> onInput) that refreshes styles preview in edit mode
- The UI of listing blocks

## Fixed
- An issue, where the page blew up in edit mode, if some of the blocks contained specific type of css

# 0.9.0 (2022-04-08)

## Added
- An ability to change theme's global variable values in edit app
- An ability to apply base CSS for block types in edit app
- An ability to apply CSS for individual blocks in edit app
- &lt;selectPageType&gt; -dropdown to Listing blocks
- Resizable floating dialogs (Draggabilly -> jsPanel)

## Changed
- .

## Fixed
- 🐛s

# 0.8.0 (2022-02-22)

## Added
- An ability to create new page types (from the edit app's main menu)
- tagType -property to Button blocks (`link` -> `<a href ...>`, `button` -> `<button type="button" ...>`, `submit` -> `<button type="submit" ...>`)
- `UserSite|PluginApi->getPlugin(string $name)` so plugins can publish their own APIs.
- "Exit from edit mode" and "Return to edit mode" feature
- intro.js introduction for the edit app
- An ability to automatically add pages to a menu (when creating them)
- An ability to choose sqlite or mysql when installing

## Changed
- Menu blocks' links can be deleted
- The save button's position from static to sticky

## Fixed
- 🐛s

# 0.7.0 (2021-01-14)

## Added
- Initial support for undoing stuff
- Columns block type
- Authentication

## Changed
- The icon library ([Feather](https://feathericons.com/) > [Tabler](https://tablericons.com/))
- Blocks now have a color that indicates where their data is stored

## Fixed
- 🐛s

# 0.6.0 (2021-12-01)

## Added
- An ability to globally store blocks / block trees, and use them on multiple pages
- Image block type
- Initial support for plugins

## Changed
- The image picker can now be used to upload images

## Fixed
- 🐛s

# 0.5.0 (2021-10-01)

- The edit app now shows all blocks (page's and layout's) in a single tree instead of two separate ones
- The edit app now highlights block's outline when hovered (instead of showing a small icon on top of it)
- Page meta fields are now editable
- The Save button is now able to run multiple queued operations at once when clicked

# 0.4.0 (2021-09-17)

This sprint focused on improving the overall content editing experience further, and figuring out how to implement custom page types.

- Listing and Section blocks can now be inserted to a page
- Page titles and slugs are now editable
- It's now much faster to write content by cloning previously created blocks!
- Menu blocks' links are now editable
- Sections blocks' backgrounds can now be selected from a image picker dialog
- The main "Add block" button now ignores the active block, and always adds new blocks to the root branch

# 0.3.0 (2021-08-27)

This sprint focused on adding new basic block types, and improving the overall content editing experience.

- The save button now disables itself automatically if there's invalid data on any active form
- The paragraph blocks now spawns new paragraph blocks when `Enter` is pressed (instead of adding <br>s to its own text)
- Layout blocks can now be saved
- The inspector panel now closes automatically if the block that was currently open was removed
- Heading, Button, Menu, and RichText blocks can now be inserted to a page
- Inspector panel's height and the main editor panel's width can now be adjusted
- Blocks can now be reordered by dragging with a mouse
    - Dragging between branches is not supported yet
- Block tree branches can now be collapsed / uncollapsed
- The frontend does less unnecessary work, when text is being typed to a Paragraph / Heading etc. block's input
