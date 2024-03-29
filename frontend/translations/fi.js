import stringBundles from '@sivujetti-string-bundles';
import validationStrings from './include-internal/validation.fi.js';

stringBundles.push({
    'Page': 'Sivu',
    'New page': 'Uusi sivu',
    'Categories': 'Kategoriat',
    'Services': 'Palvelut',
    'Services#partitive': 'Palvelua',
    'Service': 'Palvelu',
    'No results for "%s"': 'Ei tuloksia hakusanalla "%s"',
    // edit-app/src/commons/FileUploader.jsx
    'Images': 'Kuvat',
    'Files': 'Tiedostot',
    'Drop files here': 'Pudota tiedostot tähän',
    'No uploads yet.': 'Ei vielä latauksia.',
    // edit-app/src/commons/UploadButton.jsx
    'File #%s could not be uploaded because the file type is not supported.': 'Tiedostoa #%s ei voitu ladata koska tiedostotyyppiä ei tuettu.',
    'File #%s could not be uploaded because its size exceeded the maximum %sMB': 'Tiedostoa #%s ei voitu ladata koska sen koko ylitti enimmäiskoon %sMB',
    'Failed to upload file #%s': 'Tiedoston #%s lataus epäonnistui',
    'Upload files': 'Lataa tiedostoja',
    'You can also drag files here\n from your computer.': 'Voit myös raahata tähän tie-\ndostoja tietokoneeltasi.',
    // edit-app/src/left-column/block/BlockDnDSpawner.jsx
    'Start adding content': 'Aloita lisäämään sisältöä',
    'reusable content': 'uudelleenkäytettävä sisältö',
    'Filter': 'Suodata',
    'Reusables': 'Uudelleenkäytettävät',
    'Common': 'Yleiset',
    'Specialized': 'Erikoistuneet',
    'Unique reusables': 'Uniikit uudelleenkäytettävät',
    'duplicated': 'monistettu',
    // edit-app/src/left-column/block/CodeBasedStylesList|WidgetBasedStylesList.jsx.jsx
    'You can add and remove this content\'s styles in "Styles" tab': 'Voit poistaa ja lisätä tämän sisällön tyylejä "Tyylit"-tabissa',
    'This style does not have editable values.': 'Tässä tyylissä ei ole muokattavia arvoja.',
    'No own styles': 'Ei omia tyylejä',
    'No own templates': 'Ei omia templaatteja',
    'Add style': 'Lisää tyyli',
    'Select style': 'Valitse tyyli',
    'create clone': 'luo uusi',
    'create new': 'luo uusi',
    'reuse': 'uudelleenkäytä',
    'Create template': 'Luo templaatti',
    'Base template': 'Pohjatemplaatti',
    'Show parent styles': 'Näytä ulommat tyylit',
    'Show parent templates': 'Näytä ulommat templaatit',
    'Edit name': 'Muokkaa nimeä',
    'Set as default': 'Aseta oletukseksi',
    'Copy styles': 'Kopioi tyylit',
    'Paste styles': 'Liitä tyylit',
    'Edit details': 'Muokkaa tietoja',
    'Deactivate style': 'Deaktivoi tyyli',
    'Deactivate': 'Deaktivoi',
    'Delete style': 'Poista tyyli',
    'Css for the outermost %s (%s)': 'Uloimman %s (%s) css',
    'element': 'elementin',
    'wrapper-element': 'wräpperielementin',
    'Css for the inner elements': 'Sisempien elementtien css',
    'Other classes': 'Muut luokat',
    'Default': 'Oletus',
    'Style name': 'Tyylin nimi',
    // edit-app/src/left-column/block/BlockStylesTab2.jsx
    'No editable styles.': 'Ei muokattavia tyylejä.',
    // edit-app/src/left-column/block/VisualStyles.jsx
    'Restore default': 'Palauta oletus',
    // edit-app/src/left-column/block/createBlockTreeDndController.js
    'You lack permissions to edit this content.': 'Käyttöoikeutesi ei riitä muokkaamaan tätä sisältöä.',
    // edit-app/src/left-column/page/AddCategoryPanel.jsx
    'Category': 'Kategoria',
    'New category name': 'Kategorian nimi',
    'Create category': 'Luo kategoria',
    // edit-app/src/left-column/page/ManyToManyField.jsx
    'No %s found': '%s ei löytynyt',
    'category': 'kategoria',
    // edit-app/src/left-column/page/PageCreatePanel.jsx
    'Create %s': 'Luo %s',
    'Cancel create %s': 'Peruuta %s luonti',
    'Back': 'Takaisin',
    'Layout': 'Sivupohja',
    'Add to menu': 'Lisää valikkoon',
    'Title': 'Otsikko',
    'Slug': 'Url (slug)',
    'Content': 'Sisältö',
    'Page "%s" already exist.': 'Sivu "%s" on jo olemassa.',
    'Something unexpected happened.': 'Jokin meni pieleen.',
    // edit-app/src/right-column/page/PagesListView.jsx
    'Create new %s': 'Luo uusi %s',
    'Edit page': 'Muokkaa sivua',
    'Duplicate page': 'Monista sivu',
    'Delete page': 'Poista sivu',
    'Deleted page "%s".': 'Sivu "%s" poistettu.',
    'Failed to delete page.': 'Sivun poistaminen epäonnistui.',
    // edit-app/src/quill/*
    'Image': 'Kuva',
    'File': 'Tiedosto',
    'External': 'Ulkoinen',
    'website.com': 'sivusto.com',
    'Choose link type': 'Valitse linkin tyyppi',
    'Choose a link': 'Valitse linkki',
    'No link selected': 'Ei linkkiä valittuna',
    'Change': 'Vaihda',
    'Jump in page': 'Hyppää sivulla kohtaan',
    'Pick %s': 'Valitse %s',
    'a page': 'sivu',
    'Type an address': 'Kirjoita osoite',
    'Link to a page: ': 'Linkki sivuun: ',
    'Link to image/file: ': 'Linkki kuvaan/tiedostoon: ',
    'Link to an address: ': 'Linkki osoitteeseen: ',
    'Anchor': 'Ankkuri',
    // edit-app/src/left-column/block/BlockEditForm.jsx
    'Styles': 'Tyylit',
    'Styles (code)': 'Tyylit (koodi)',
    'Styles must contain at least one CSS-rule': 'Tyylit tulisi sisältää ainakin yhden CSS-säännön',
    'Only root styles may contain @imports': 'Vain juurityylit voi sisältää @importeja',
    // edit-app/src/left-column/block/BlockTree.jsx
    'Add child content': 'Lisää lapsisisältöä',
    'Duplicate': 'Monista',
    'Duplicate content': 'Monista sisältö',
    'Delete': 'Poista',
    'Delete content': 'Poista sisältö',
    'Save as reusable': 'Tallenna uudelleenkäytettäväksi',
    'Save as reusable content': 'Tallenna uudelleenkäytettäväksi sisällöksi',
    'Content tree': 'Sisältöpuu',
    // edit-app/src/left-column/panel-sections/BaseStylesSection.jsx
    'Colours and fonts': 'Sivuston värit ja fontit',
    'Visual': 'Visuaalinen',
    'Code': 'Koodi',
    // edit-app/src/left-column/panel-sections/ContentManagementSection.jsx
    'Content management': 'Sisällönhallinta',
    'page': 'sivu',
    // edit-app/src/left-column/panel-sections/OnThisPageSection.jsx
    'Duplicate this page': 'Monista tämä sivu',
    'Delete this page': 'Poista tämä sivu',
    'Show without edit mode': 'Näytä ilman muokkaustilaa',
    'On this page': 'Tällä sivulla',
    'Default content': 'Oletussisältö',
    'Content of page %s': '%s -sivun sisältö',
    'New page content': 'Uuden sivun sisältö',
    // edit-app/src/left-column/panel-sections/WebsiteSection.jsx
    'Website': 'Sivusto',
    'Website\'s settings': 'Sivuston asetukset',
    'Settings': 'Asetukset',
    'Edit info': 'Muokkaa perustietoja',
    'Updates': 'Päivitykset',
    //edit-app/src/left-column/page-type/PageTypeCreatePanel.jsx
    'page type': 'sivutyyppi',
    'Basic settings': 'Perustiedot',
    'Fields': 'Kentät',
    // _
    'Pages': 'Sivut',
    'Pages#partitive': 'Sivua',
    'Page categories': 'Sivukategoriat',
    'Page categories#partitive': 'Sivukategoriaa',
    // edit-app/src/EditApp.jsx
    'Edit mode': 'Muokkaustila',
    'Hide edit menu': 'Piilota muokkausvalikko',
    'Go to dashboard': 'Siirry dashboardiin',
    'Log out': 'Kirjaudu ulos',
    'You can add content by dragging': 'Voit lisätä sisältöä raahaamalla',
    'Cool!': 'Selvä!',
    'Did you know?': 'Tiesitkö?',
    'When you\'re in the edit mode, you still can navigate any website hyperlink by clicking on it holding Ctrl (Windows) or ⌘ (Mac) key.': 'Voit navigoida myös muokkaustilassa klikkaamalla hyperlinkkiä pitämällä Ctrl- (Windows) tai ⌘ (Mac) -nappia samalla pohjassa.',
    'Created new %s': 'Luotiin uusi %s',
    'Page title': 'Sivuotsikko',
    // edit-app/src/left-column/InspectorPanel.jsx
    'Close': 'Sulje',
    // edit-app/src/left-column/page-type/PageTypeBasicInfoConfigurationForm.jsx
    'Name (for computers)': 'Nimi (konekielinen)',
    'Name (plural)': 'Nimi (monikossa)',
    'Description': 'Kuvaus',
    'Listable': 'Listattava',
    'Default layout': 'Oletusivupohja',
    // edit-app/src/popups/reusable-branch/SaveBlockAsReusableDialog.jsx
    'This function saves this content as reusable content, which can be easily added to other pages later on.': 'Tämä toiminto tallentaa sisällön uudelleenkäytettäväksi sisällöksi, jota voidaan myöhemmin helposti lisätä myös muihin sivuihin.',
    'Name': 'Nimi',
    'e.g. Text and image, Footer': 'esim. Teksti ja kuva, Footer',
    'Type': 'Tyyppi',
    'Duplicating': 'Monistuva',
    'todo12': 'Sisällöstä luodaan aina uusi kopio, kun se lisätään sivuun.',
    'Unique': 'Uniikki',
    'todo13': 'Sisältö viittaa samaan tietoon, vaikka se olisi usealla eri sivulla (esim. "Footer").',
    // edit-app/src/popups/styles/EditUnitOrSetAsDefaultDialog.jsx
    'Specifier': 'Tarkenne',
    'todo16 %s': 'Tämä toiminto merkitsee nämä tyylit tyyleihin, jota käytetään automaattisesti uusissa, sivuun lisätyissä  %s -sisällöissä.',
    'Visible for non-admins': 'Näytä ei-admin -käyttäjille',
    'Allow non-admin users to add these\nstyles to contents in visual styles': 'Salli ei-admin -käyttäjien lisätä nämä\ntyylit sisällöille visuaalisissa tyyleissä',
    'optional': 'vapaaehtoinen',
    'Evaluates to\n`body [specifierHere] .%s`': 'Evaluoituu muotoon\n`body [tarkenneTähän] .%s`',
    'e.g. `>`, `div`, `.j-Button >`': 'esim. `>`, `div`, `.j-Button >`',
    'Cancel': 'Peruuta',
    // edit-app/src/popups/BlockTreeShowHelpPopup.jsx
    'In Sivujetti, the content of pages is presented as a tree structure: each row or branch in the tree corresponds to a section or content of the page. You can ': 'Sivujetissä sivujen sisältö esitetään tällaisena puurakenteena: yksi puun rivi tai oksa vastaa yhtä sivun osiota tai sisältöä. Voit ',
    'arrange': 'järjestellä',
    ' the different sections of the page by dragging the rows in the content tree. You can start ': ' sivun eri osioita sisältöpuun rivejä raahaamalla. Voit aloittaa ',
    'adding content': 'lisäämään sisältöä',
    ' using the': ' ',
    'button': ' -napista',
    ' on the left side of the page.': ' sivun vasemmalla reunalla.',
    'Colorless': 'Väritön',
    'Regular content, with no colored text, is ': 'Tavallinen sisältö, jonka tekstillä ei ole väriä, on ',
    'stored only to this page': 'tallennettu vain tähän sivuun',
    'Orange': 'Oranssi',
    'Unique content refers to ': 'Uniikki sisältö viittaa ',
    'separately stored data': 'erillisesti tallennettuun tietoon',
    '. When you edit unique content on one page, the information changes in all corresponding content across pages.': '. Kun muokkaat uniikkia sisältöä yhdellä sivulla, tieto vaihtuu kaikkien sivujen vastaavissa sisällöissä.',
    'Violet': 'Violetti',
    'Meta content contains ': 'Metasisältöön on tallennettu ',
    'additional data / metadata': 'lisä-, tai metatietoja',
    ', and otherwise act like ordinary content.': ', ja käyttäytyvät muilta osin kuten tavallinen sisältö.',
    // edit-app/src/left-column/SaveButton.jsx
    'You have unsaved changes, do you want to navigate away?': 'Sinulla on tallentamattomia muutoksia, haluatko poistua sivulta?',
    'Undo latest change': 'Kumoa viimeisin muutos',
    'Save changes': 'Tallenna muutokset',
    // edit-app/src/right-column/WebPageIframe.js
    'Copy': 'Kopio',
    // edit-app/src/block-types/menu/EditForm.jsx
    'Create and add page': 'Luo ja lisää sivu',
    'Add link': 'Lisää linkki',
    'Edit': 'Muokkaa',
    'Edit link': 'Muokkaa linkkiä',
    'Delete link': 'Poista linkki',
    // edit-app/src/block-types/menu/EditItemPanel.jsx
    'Link text': 'Linkin teksti',
    'Url address': 'Url-osoite',
    // edit-app/src/block-types/menu/menu.js
    'Menu': 'Valikko',
    'Home': 'Etusivu',
    'About': 'Meistä',
    // edit-app/src/block-types/button.js
    'Button': 'Nappi',
    'Link element': 'Linkkielementti',
    'Normal button': 'Nappi',
    'Submit button': 'Lähetä-nappi',
    'Link': 'Linkki',
    'Css classes': 'Css-luokat',
    'Tag type': 'Elementin tyyppi',
    'Button text': 'Napin teksti',
    // edit-app/src/block-types/code.js
    'My code ...': 'Koodia ...',
    'Waits for configuration ...': 'Odottaa konfigurointia ...',
    // edit-app/src/block-types/columns.js
    'Columns': 'Sarakkeet',
    'Num columns': 'Sarakkeita',
    'Full width': 'Täysileveä',
    // edit-app/src/block-types/heading.js
    'Heading': 'Otsikko',
    'Level': 'Taso',
    'Add content after': 'Lisää sisältöä jälkeen',
    'Heading text': 'Otsikon teksti',
    // edit-app/src/block-types/listing/AdditionalFiltersBuilder.jsx
    'which are': 'jotka on',
    'which is': 'joka on',
    'added to category': 'merkitty kategoriaan',
    '%s %s starts with': '%s %s alkaa kirjaimilla',
    'which#nominative': 'jotka',
    'which': 'joka',
    'whose': 'joiden',
    'which#genitive': 'jonka',
    'blog': 'blogi',
    'This value': 'Tämä arvo',
    'and': 'ja',
    'Delete filter': 'Poista filtteri',
    'Add filter': 'Lisää filtteri',
    // edit-app/src/block-types/listing/EditForm.jsx
    'List': 'Listaa',
    'all': 'kaikki',
    'single': 'yksi',
    'at most': 'enintään',
    'Type amount': 'Syötä lukumääärä',
    'ordered by': 'järjestäen ne',
    'newest to oldest': 'uusimmasta vanhimpaan',
    'oldest to newest': 'vanhimmasta uusimpaan',
    'randomly': 'satunnaisesti',
    'rendering %s using template': 'tulostaen %s templaatilla',
    'it': 'sen',
    'them': 'ne',
    'Add new %s': 'Lisää uusi %s',
    '%s must be a number': '%s tulisi olla numero',
    // edit-app/src/block-types/listing/listing.js
    'Listing': 'Listaus',
    // edit-app/src/block-types/image.js
    'Image file': 'Kuvatiedosto',
    'Alt text': 'Vaihtoehtoinen teksti',
    'The text that a browser displays\nif the image cannot be loaded': 'Teksti, jonka selain näyttää\njos kuvaa ei voida ladata',
    // edit-app/src/block-types/pageInfo.js
    'PageInfo': 'Metatiedot',
    'Url (slug)': 'Urli (slug)',
    'Social image': 'Some-kuva',
    'Meta description': 'Meta-selostus',
    // edit-app/src/block-types/paragraph.js
    'Paragraph': 'Tekstikappale',
    'Paragraph text': 'Tekstikappaleen teksti',
    // edit-app/src/block-types/richText.js
    'RichText': 'Rikasteteksti',
    'Rich text': 'Rikasteteksti',
    'Rich text content': 'Rikastettua tekstiä',
    // edit-app/src/block-types/section.js
    'Section': 'Osio',
    'Background#image': 'Taustakuva',
    // edit-app/src/block-types/text.js
    'Text content': 'Tekstisisältöä',
    // edit-app/src/block-widget/ImagePicker.jsx
    'Choose a picture': 'Valitse kuva',
    // edit-app/src/right-column/website/WebsiteApplyUpdatesView.jsx
    'No updates available.': 'Ei päivityksia saatavilla.',
    // edit-app/src/right-column/website/WebsiteEditBasicInfoView.jsx
    'Edit website info': 'Muokkaa sivuston tietoja',
    'These details are visible to search engines and when sharing pages on social media channels.': 'Nämä tiedot näkyvät hakukoneissa, ja esim. jaettaessa sivuja some-kanaviin.',
    'Language': 'Kieli',
    'Discourage search engines from indexing this site': 'Kiellä sivuston näkyminen hakukoneissa',
    'Saved website\'s basic info.': 'Sivuston tiedot tallennettin.',
    // ../std-styles.md
    'Text default': 'Teksti oletus',
    'Headings default': 'Otsikot oletus',
    'Background default': 'Tausta oletus',
    'Links default': 'Linkit oletus',
    'Links hover': 'Linkit hover',
    'Max width default': 'Max.leveys oletus',
    // Listing
    'Gap': 'Gäppi',
    // Menu
    'List style type': 'Listaustyyppi',
    'Items width': 'Leveys linkit',
    'Links normal': 'Linkit normaali',
    'Links transform': 'Linkit transform.',
    'Padding top': 'Täyte ylä',
    'Padding right': 'Täyte oikea',
    'Padding bottom': 'Täyte ala',
    'Padding left': 'Täyte vasen',
    // Button
    'Background normal': 'Tausta normaali',
    'Background hover': 'Tausta hover',
    'Text': 'Teksti',
    'Text hover': 'Teksti hover',
    'Border': 'Reunus',
    'Border hover': 'Reunus hover',
    'Align horizontal': 'Tasaa vaaka',
    'Min width': 'Min.leveys',
    'Radius': 'Pyöristys',
    // Code
    'Display': 'Näytä',
    // Columns
    'Align items': 'Tasaus pysty',
    // Image
    'Float': 'Tasaus',
    'Min height': 'Minimikorkeus',
    'Max height': 'Maksimikorkeus',
    'Max width': 'Maksimileveys',
    // Section
    'Align vertical': 'Tasaa pysty',
    'Background': 'Tausta',
    'Cover': 'Taustapeitto',
    'Text align': 'Teksti tasaus',
    // Text
    'Text normal': 'Teksti normaali',
    'Text headings': 'Teksti otsikot',
    'Links': 'Linkit',
    'Line height': 'Riviväli',
    'Paragraphs margin': 'Tekstikappale väli',
}, validationStrings);
