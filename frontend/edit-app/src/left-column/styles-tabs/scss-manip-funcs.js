/**
 * @param {String} scss
 * @returns {[String, String, String, String, String]} [all, large, medium, small, extraSmall]
 */
function splitToScreenSizeParts(scss) {
    /*
    <baseScss>NO_EOL
    <additionsScss>NO_EOL
    @media (max-width: 960px) {\n}\n
    @media (max-width: 840px) {\n}\n
    @media (max-width: 600px) {\n}\n
    @media (max-width: 480px) {\n}
    */
    const pcs = scss.split('@media ');
    /*
    [
        '<baseScss><additionsScss>',
        '(max-width: 960px) {\n}\n',
        '(max-width: 840px) {\n}\n',
        '(max-width: 600px) {\n}\n',
        '(max-width: 480px) {\n}',
    ]
    */
    const [
        all1,
        large1,
        medium1,
        small1,
        extraSmall1,
    ] = pcs;
    //
    const start = '(max-width: NNNpx) {\n'.length;
    const end = -'}\n'.length;
    return [
        all1,
        large1.slice(start, end),
        medium1.slice(start, end),
        small1.slice(start, end),
        extraSmall1.slice(start, end),
    ];
}

export {splitToScreenSizeParts};
