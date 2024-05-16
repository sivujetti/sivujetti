import {__} from '@sivujetti-commons-for-edit-app';

const cssSubSelector = ':root';

export default [
// :root {
//   --spectre-link-color: #2c86bb; /* --spectre-primary-color */
    {
        varName: 'baseStyleLinkColor',
        cssProp: '--spectre-link-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links',
            inputId: 'baseStyleLinkColor',
        },
    },
//   --spectre-link-color-dark: #226892; /* darken(--spectre-link-color, 10%) */
    {
        varName: 'baseStyleLinkColorDark',
        cssProp: '--spectre-link-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links darker',
            inputId: 'baseStyleLinkColorDark',
        },
    },
//   --spectre-link-color-light: #469fd4; /* lighten(--spectre-link-color, 10%) */
    {
        varName: 'baseStyleLinkColorLight',
        cssProp: '--spectre-link-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links lighter',
            inputId: 'baseStyleLinkColorLight',
        },
    },
//   --spectre-body-font-color: #303742; /* lighten(--spectre-dark-color, 5%) todo*/
    {
        varName: 'baseStyleBodyFontColor',
        cssProp: '--spectre-body-font-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Texts', // 'Body font',
            inputId: 'baseStyleBodyFontColor',
        },
    },
//   --spectre-base-font-family: "Domine", -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto;
    {
        varName: 'baseStyleBaseFont',
        cssProp: '--spectre-base-font-family',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: 'Domine', value: '"Domine"'},
                {label: __('Default'), value: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto'},
            ],
            label: 'Font',
            inputId: 'baseStyleBaseFont',
        },
    },
//   --spectre-font-size: 0.9rem;
    {
        varName: 'baseStyleFontSize',
        cssProp: '--spectre-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Font size',
            inputId: 'baseStyleFontSize',
        },
    },
//   --jet-headings-font-family: "Inter";
    {
        varName: 'baseStyleHeadingsFont',
        cssProp: '--jet-headings-font-family',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: 'Inter', value: '"Inter"'},
                {label: __('Default'), value: 'var(--spectre-base-font-family)'},
            ],
            label: 'Headings font',
            inputId: 'baseStyleHeadingsFont',
        },
    },
//   --jet-headings-font-weight: 700;
    {
        varName: 'baseStyleHeadingsFontWeight',
        cssProp: '--jet-headings-font-weight',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: '700', value: '700'},
                {label: __('Default'), value: '700'},
            ],
            label: 'Headings font weight',
            inputId: 'baseStyleHeadingsFontWeight',
        },
    },
//   --jet-headings-line-height: 2.4rem;
    {
        varName: 'baseStyleHeadingsLineHeight',
        cssProp: '--jet-headings-line-height',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Headings line height',
            inputId: 'baseStyleHeadingsLineHeight',
        },
    },
//   --jet-h1-font-size: 2.4rem;
    {
        varName: 'baseStyleHeadings1FontSize',
        cssProp: '--jet-h1-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h1 font size',
            inputId: 'baseStyleHeadings1FontSize',
        },
    },
//   --jet-h2-font-size: 1.8rem;
    {
        varName: 'baseStyleHeadings2FontSize',
        cssProp: '--jet-h2-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h2 font size',
            inputId: 'baseStyleHeadings2FontSize',
        },
    },
//   --jet-h3-font-size: 1.4rem;
    {
        varName: 'baseStyleHeadings3FontSize',
        cssProp: '--jet-h3-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h3 font size',
            inputId: 'baseStyleHeadings3FontSize',
        },
    },
//   --jet-h4-font-size: 1.2rem;
    {
        varName: 'baseStyleHeadings4FontSize',
        cssProp: '--jet-h4-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h4 font size',
            inputId: 'baseStyleHeadings4FontSize',
        },
    },
//   --jet-h5-font-size: 1rem;
    {
        varName: 'baseStyleHeadings5FontSize',
        cssProp: '--jet-h5-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h5 font size',
            inputId: 'baseStyleHeadings5FontSize',
        },
    },
//   --jet-h6-font-size: .8rem;
    {
        varName: 'baseStyleHeadings6FontSize',
        cssProp: '--jet-h6-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h6 font size',
            inputId: 'baseStyleHeadings6FontSize',
        },
    },
//   /* Buttons, button links */
//   --jet-button-font-size: .85rem;
    {
        varName: 'baseStyleButtonsFontSize',
        cssProp: '--jet-button-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Buttons font size',
            inputId: 'baseStyleButtonsFontSize',
        },
    },
//   --jet-button-color-normal: #333;
    {
        varName: 'baseStyleButtonColorNormal',
        cssProp: '--jet-button-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons text',
            inputId: 'baseStyleButtonColorNormal',
        },
    },
//   --jet-button-bg-color-normal: #f8f8f8;
    {
        varName: 'baseStyleButtonBgColorNormal',
        cssProp: '--jet-button-bg-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons background',
            inputId: 'baseStyleButtonBgColorNormal',
        },
    },
//   --jet-button-border-color-normal: #f8f8f8;
    {
        varName: 'baseStyleButtonBorderColorNormal',
        cssProp: '--jet-button-border-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons border',
            inputId: 'baseStyleButtonBorderColorNormal',
        },
    },
//   --jet-button-border-width: 1px;
    {
        varName: 'baseStyleButtonBorderWidth',
        cssProp: '--jet-button-border-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Buttons border width',
            inputId: 'baseStyleButtonBorderWidth',
        },
    },
//   /* Defaults */
//   --spectre-primary-color: #2c86bb;
    {
        varName: 'baseStylePrimaryColor',
        cssProp: '--spectre-primary-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary',
            inputId: 'baseStylePrimaryColor',
        },
    },
//   --spectre-primary-color-dark: #297daf; /* darken(--spectre-primary-color, 3%), you can use http://scg.ar-ch.org/ for this */
    {
        varName: 'baseStylePrimaryColorDark',
        cssProp: '--spectre-primary-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary darker',
            inputId: 'baseStylePrimaryColorDark',
        },
    },
//   --spectre-primary-color-light: #2f8fc7; /* lighten(--spectre-primary-color, 3%) */
    {
        varName: 'baseStylePrimaryColorLight',
        cssProp: '--spectre-primary-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary lighter',
            inputId: 'baseStylePrimaryColorLight',
        },
    },
//   --spectre-dark-color: #303742;
    {
        varName: 'baseStyleDarkColor',
        cssProp: '--spectre-dark-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Dark',
            inputId: 'baseStyleDarkColor',
        },
    },
//   --spectre-light-color: #fff;
    {
        varName: 'baseStyleLightColor',
        cssProp: '--spectre-light-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Light',
            inputId: 'baseStyleLightColor',
        },
    },
//   --spectre-secondary-color: #badbef; /* lighten(--spectre-primary-color, 38%) */
    {
        varName: 'baseStyleSecondaryColor',
        cssProp: '--spectre-secondary-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary',
            inputId: 'baseStyleSecondaryColor',
        },
    },
//   --spectre-secondary-color-dark: #aed5ec; /* darken(--spectre-secondary-color, 3%) */
    {
        varName: 'baseStyleSecondaryColorDark',
        cssProp: '--spectre-secondary-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary darker',
            inputId: 'baseStyleSecondaryColorDark',
        },
    },
//   --spectre-secondary-color-light: #c6e1f2; /* lighten(--spectre-primary-color, 3%) */
    {
        varName: 'baseStyleSecondaryColorLight',
        cssProp: '--spectre-secondary-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary lighter',
            inputId: 'baseStyleSecondaryColorLight',
        },
    },
//   --spectre-primary-shadow-color: #2c86bb33; /* rgba(0.2) */
    {
        varName: 'baseStylePrimaryShadow',
        cssProp: '--spectre-primary-shadow-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Shadow primary',
            inputId: 'baseStylePrimaryShadow',
        },
    },
//   --spectre-gray-color: #bcc3ce; /* lighten(--spectre-dark-color, 55%) */
    {
        varName: 'baseStyleGrayColor',
        cssProp: '--spectre-gray-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray',
            inputId: 'baseStyleGrayColor',
        },
    },
//   --spectre-gray-color-dark: #66748b; /* darken(--spectre-gray-color, 30%) */
    {
        varName: 'baseStyleGrayColorDark',
        cssProp: '--spectre-gray-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray darker',
            inputId: 'baseStyleGrayColorDark',
        },
    },
//   --spectre-gray-color-light: #f7f8f9; /* lighten(--spectre-gray-color, 20%) */
    {
        varName: 'baseStyleGrayColorLight',
        cssProp: '--spectre-gray-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray lighter',
            inputId: 'baseStyleGrayColorLight',
        },
    },
//   --spectre-border-color: #dadee4; /* lighten($dark-color, 65%) */
    {
        varName: 'baseStyleBorderColor',
        cssProp: '--spectre-border-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders',
            inputId: 'baseStyleBorderColor',
        },
    },
//   --spectre-border-color-dark: #bdc4ce; /* darken(--spectre-border-color, 10%) */
    {
        varName: 'baseStyleBorderColorDark',
        cssProp: '--spectre-border-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders darker',
            inputId: 'baseStyleBorderColorDark',
        },
    },
//   --spectre-border-color-light: #f2f3f5; /* lighten(--spectre-border-color, 8%) */
    {
        varName: 'baseStyleBorderColorLight',
        cssProp: '--spectre-border-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders lighter',
            inputId: 'baseStyleBorderColorLight',
        },
    },
//   --spectre-bg-color: #f7f8f9; /* lighten(--spectre-dark-color, 75%) */
    {
        varName: 'baseStyleBgColor',
        cssProp: '--spectre-bg-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background (elements)',
            inputId: 'baseStyleBgColor',
        },
    },
//   --spectre-bg-color-dark: #eef0f2; /* darken(--spectre-bg-color, 3%) */
    {
        varName: 'baseStyleBgColorDark',
        cssProp: '--spectre-bg-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background darker (elements)',
            inputId: 'baseStyleBgColorDark',
        },
    },
// }
];
