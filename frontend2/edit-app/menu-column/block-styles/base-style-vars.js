import {__} from '@sivujetti-commons-for-edit-app';

const cssSubSelector = ':root';

export default [
// :root {
//   --spectre-link-color: #2c86bb; /* --spectre-primary-color */
    {
        varName: 'bodyStyleLinkColor',
        cssProp: '--spectre-link-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links',
            inputId: 'bodyStyleLinkColor',
        },
    },
//   --spectre-link-color-dark: #226892; /* darken(--spectre-link-color, 10%) */
    {
        varName: 'bodyStyleLinkColorDark',
        cssProp: '--spectre-link-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links darker',
            inputId: 'bodyStyleLinkColorDark',
        },
    },
//   --spectre-link-color-light: #469fd4; /* lighten(--spectre-link-color, 10%) */
    {
        varName: 'bodyStyleLinkColorLight',
        cssProp: '--spectre-link-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Links lighter',
            inputId: 'bodyStyleLinkColorLight',
        },
    },
//   --spectre-body-font-color: #303742; /* lighten(--spectre-dark-color, 5%) todo*/
    {
        varName: 'bodyStyleBodyFontColor',
        cssProp: '--spectre-body-font-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Texts', // 'Body font',
            inputId: 'bodyStyleBodyFontColor',
        },
    },
//   --spectre-base-font-family: "Domine", -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto;
    {
        varName: 'bodyStyleBaseFont',
        cssProp: '--spectre-base-font-family',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: 'Domine', value: '"Domine"'},
                {label: __('Default'), value: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto'},
            ],
            label: 'Font',
            inputId: 'bodyStyleBaseFont',
        },
    },
//   --spectre-font-size: 0.9rem;
    {
        varName: 'bodyStyleFontSize',
        cssProp: '--spectre-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Font size',
            inputId: 'bodyStyleFontSize',
        },
    },
//   --jet-headings-font-family: "Inter";
    {
        varName: 'bodyStyleHeadingsFont',
        cssProp: '--jet-headings-font-family',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: 'Inter', value: '"Inter"'},
                {label: __('Default'), value: 'var(--spectre-base-font-family)'},
            ],
            label: 'Headings font',
            inputId: 'bodyStyleHeadingsFont',
        },
    },
//   --jet-headings-font-weight: 700;
    {
        varName: 'bodyStyleHeadingsFontWeight',
        cssProp: '--jet-headings-font-weight',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'option',
            options: [
                {label: '700', value: '700'},
                {label: __('Default'), value: '700'},
            ],
            label: 'Headings font weight',
            inputId: 'bodyStyleHeadingsFontWeight',
        },
    },
//   --jet-headings-line-height: 2.4rem;
    {
        varName: 'bodyStyleHeadingsLineHeight',
        cssProp: '--jet-headings-line-height',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Headings line height',
            inputId: 'bodyStyleHeadingsLineHeight',
        },
    },
//   --jet-h1-font-size: 2.4rem;
    {
        varName: 'bodyStyleHeadings1FontSize',
        cssProp: '--jet-h1-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h1 font size',
            inputId: 'bodyStyleHeadings1FontSize',
        },
    },
//   --jet-h2-font-size: 1.8rem;
    {
        varName: 'bodyStyleHeadings2FontSize',
        cssProp: '--jet-h2-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h2 font size',
            inputId: 'bodyStyleHeadings2FontSize',
        },
    },
//   --jet-h3-font-size: 1.4rem;
    {
        varName: 'bodyStyleHeadings3FontSize',
        cssProp: '--jet-h3-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h3 font size',
            inputId: 'bodyStyleHeadings3FontSize',
        },
    },
//   --jet-h4-font-size: 1.2rem;
    {
        varName: 'bodyStyleHeadings4FontSize',
        cssProp: '--jet-h4-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h4 font size',
            inputId: 'bodyStyleHeadings4FontSize',
        },
    },
//   --jet-h5-font-size: 1rem;
    {
        varName: 'bodyStyleHeadings5FontSize',
        cssProp: '--jet-h5-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h5 font size',
            inputId: 'bodyStyleHeadings5FontSize',
        },
    },
//   --jet-h6-font-size: .8rem;
    {
        varName: 'bodyStyleHeadings6FontSize',
        cssProp: '--jet-h6-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'h6 font size',
            inputId: 'bodyStyleHeadings6FontSize',
        },
    },
//   /* Buttons, button links */
//   --jet-button-font-size: .85rem;
    {
        varName: 'bodyStyleButtonsFontSize',
        cssProp: '--jet-button-font-size',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Buttons font size',
            inputId: 'bodyStyleButtonsFontSize',
        },
    },
//   --jet-button-color-normal: #333;
    {
        varName: 'bodyStyleButtonColorNormal',
        cssProp: '--jet-button-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons',
            inputId: 'bodyStyleButtonColorNormal',
        },
    },
//   --jet-button-bg-color-normal: #f8f8f8;
    {
        varName: 'bodyStyleButtonBgColorNormal',
        cssProp: '--jet-button-bg-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons background',
            inputId: 'bodyStyleButtonBgColorNormal',
        },
    },
//   --jet-button-border-color-normal: #f8f8f8;
    {
        varName: 'bodyStyleButtonBorderColorNormal',
        cssProp: '--jet-button-border-color-normal',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Buttons border',
            inputId: 'bodyStyleButtonBorderColorNormal',
        },
    },
//   --jet-button-border-width: 1px;
    {
        varName: 'bodyStyleButtonBorderWidth',
        cssProp: '--jet-button-border-width',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'length',
            label: 'Buttons border width',
            inputId: 'bodyStyleButtonBorderWidth',
        },
    },
//   /* Defaults */
//   --spectre-primary-color: #2c86bb;
    {
        varName: 'bodyStylePrimaryColor',
        cssProp: '--spectre-primary-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary',
            inputId: 'bodyStylePrimaryColor',
        },
    },
//   --spectre-primary-color-dark: #297daf; /* darken(--spectre-primary-color, 3%), you can use http://scg.ar-ch.org/ for this */
    {
        varName: 'bodyStylePrimaryColorDark',
        cssProp: '--spectre-primary-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary darker',
            inputId: 'bodyStylePrimaryColorDark',
        },
    },
//   --spectre-primary-color-light: #2f8fc7; /* lighten(--spectre-primary-color, 3%) */
    {
        varName: 'bodyStylePrimaryColorLight',
        cssProp: '--spectre-primary-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Primary lighter',
            inputId: 'bodyStylePrimaryColorLight',
        },
    },
//   --spectre-dark-color: #303742;
    {
        varName: 'bodyStyleDarkColor',
        cssProp: '--spectre-dark-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Dark',
            inputId: 'bodyStyleDarkColor',
        },
    },
//   --spectre-light-color: #fff;
    {
        varName: 'bodyStyleLightColor',
        cssProp: '--spectre-light-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Light',
            inputId: 'bodyStyleLightColor',
        },
    },
//   --spectre-secondary-color: #badbef; /* lighten(--spectre-primary-color, 38%) */
    {
        varName: 'bodyStyleSecondaryColor',
        cssProp: '--spectre-secondary-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary',
            inputId: 'bodyStyleSecondaryColor',
        },
    },
//   --spectre-secondary-color-dark: #aed5ec; /* darken(--spectre-secondary-color, 3%) */
    {
        varName: 'bodyStyleSecondaryColorDark',
        cssProp: '--spectre-secondary-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary darker',
            inputId: 'bodyStyleSecondaryColorDark',
        },
    },
//   --spectre-secondary-color-light: #c6e1f2; /* lighten(--spectre-primary-color, 3%) */
    {
        varName: 'bodyStyleSecondaryColorLight',
        cssProp: '--spectre-secondary-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Secondary lighter',
            inputId: 'bodyStyleSecondaryColorLight',
        },
    },
//   --spectre-primary-shadow-color: #2c86bb33; /* rgba(0.2) */
    {
        varName: 'bodyStylePrimaryShadow',
        cssProp: '--spectre-primary-shadow-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Shadow primary',
            inputId: 'bodyStylePrimaryShadow',
        },
    },
//   --spectre-gray-color: #bcc3ce; /* lighten(--spectre-dark-color, 55%) */
    {
        varName: 'bodyStyleGrayColor',
        cssProp: '--spectre-gray-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray',
            inputId: 'bodyStyleGrayColor',
        },
    },
//   --spectre-gray-color-dark: #66748b; /* darken(--spectre-gray-color, 30%) */
    {
        varName: 'bodyStyleGrayColorDark',
        cssProp: '--spectre-gray-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray darker',
            inputId: 'bodyStyleGrayColorDark',
        },
    },
//   --spectre-gray-color-light: #f7f8f9; /* lighten(--spectre-gray-color, 20%) */
    {
        varName: 'bodyStyleGrayColorLight',
        cssProp: '--spectre-gray-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Gray lighter',
            inputId: 'bodyStyleGrayColorLight',
        },
    },
//   --spectre-border-color: #dadee4; /* lighten($dark-color, 65%) */
    {
        varName: 'bodyStyleBorderColor',
        cssProp: '--spectre-border-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders',
            inputId: 'bodyStyleBorderColor',
        },
    },
//   --spectre-border-color-dark: #bdc4ce; /* darken(--spectre-border-color, 10%) */
    {
        varName: 'bodyStyleBorderColorDark',
        cssProp: '--spectre-border-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders darker',
            inputId: 'bodyStyleBorderColorDark',
        },
    },
//   --spectre-border-color-light: #f2f3f5; /* lighten(--spectre-border-color, 8%) */
    {
        varName: 'bodyStyleBorderColorLight',
        cssProp: '--spectre-border-color-light',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Borders lighter',
            inputId: 'bodyStyleBorderColorLight',
        },
    },
//   --spectre-bg-color: #f7f8f9; /* lighten(--spectre-dark-color, 75%) */
    {
        varName: 'bodyStyleBgColor',
        cssProp: '--spectre-bg-color',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background (elements)',
            inputId: 'bodyStyleBgColor',
        },
    },
//   --spectre-bg-color-dark: #eef0f2; /* darken(--spectre-bg-color, 3%) */
    {
        varName: 'bodyStyleBgColorDark',
        cssProp: '--spectre-bg-color-dark',
        cssSubSelector: null,
        widgetSettings: {
            valueType: 'color',
            label: 'Background darker (elements)',
            inputId: 'bodyStyleBgColorDark',
        },
    },
// }
];
