// ============================================================================
// Chart TEMPLATES — the single source of truth for the three reference charts.
//
// Edit the chart configs HERE. Every surface reads from this file, so any change
// shows up everywhere on the next reload:
//   • index.html   (playground)   — default = multiLine template (via config.js)
//   • dashboard.html (Templates)  — live-renders all three, always in sync
//   • chart.html   (standalone)   — renders config.js default
//
// CHART_PARAMETERS.md documents these same configs in prose. Keep them aligned.
//
// Each template is a BUILDER function that returns a FRESH options object every
// call. Highcharts mutates the options it's handed, so builders (not shared
// object literals) prevent one render from corrupting the next.
//
// All values verified in headless Chrome against Highcharts v13. Shared design:
// system font, dotted #727272 crosshair, 12×12 dots (radius 8px, 1px #FFF ring,
// series-color fill), top-left legend, hugging tooltip card capped at 288px,
// no context menu.
// ============================================================================

(function () {
    const FONT =
        'Graphik, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

    // 12×12 dot per spec: border-radius 8px, 1px #FFF ring, fill = series color.
    function dot(color) {
        return '<span style="display:inline-block;width:12px;height:12px;' +
            'border-radius:8px;border:1px solid #FFF;box-sizing:border-box;' +
            'background:' + color + ';margin-right:6px;vertical-align:middle;"></span>';
    }

    // Measure rendered text width (canvas 2D) so we can reserve exactly the
    // right amount of space for a label column without re-rendering the chart.
    function measureTextWidth(text, cssFont) {
        const c = measureTextWidth._c ||
            (measureTextWidth._c = document.createElement('canvas'));
        const ctx = c.getContext('2d');
        ctx.font = cssFont;
        return ctx.measureText(text).width;
    }

    // Custom y-axis gridline dashes. The built-in 'ShortDash' has a fixed
    // dash/gap ratio; this stamps a 4px dash + 9px gap so dashes stay short but
    // the spacing between them is longer/airier. Call from chart.events.render.
    //
    // `solidAtY` (optional, chart-space px) exempts ONE gridline and leaves it
    // solid — used for the variance charts' zero baseline. Exempting here beats
    // overlaying a plotLine on top of the dashed line: nothing is drawn twice,
    // so there's no antialiasing seam where the dashes sit.
    function styleGridDashes(chart, pattern, solidAtY) {
        const lines = chart.container.querySelectorAll(
            '.highcharts-yaxis-grid .highcharts-grid-line'
        );
        Array.prototype.forEach.call(lines, function (el) {
            // A horizontal gridline path reads "M <x> <y> L <x> <y>"; grab the
            // first y so we can tell which line this is.
            let solid = false;
            if (typeof solidAtY === 'number') {
                const m = /M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(el.getAttribute('d') || '');
                // 1px tolerance absorbs Highcharts' crisp half-pixel offset.
                solid = !!m && Math.abs(parseFloat(m[2]) - solidAtY) <= 1;
            }
            el.setAttribute('stroke-dasharray', solid ? 'none' : (pattern || '2,2'));
        });
    }

    // ------------------------------------------------------------------------
    // Weather glyphs — geometry extracted from the supplied Figma exports in
    // "weather icon/" (Type=*.svg). All ten assets share a 20x20 viewBox and
    // identical presentation (#727272 stroke, 1.25 width, round caps/joins),
    // so those attributes are hoisted onto the wrapper <svg> below and the
    // per-path copies dropped.
    //
    // The source files each wrapped their art in <g clip-path> + a <defs>
    // clipPath. Those rects are full-bleed (0 0 20 20) so they clip nothing —
    // dropping them is lossless AND necessary, because inlining the same icon
    // on several axis ticks would otherwise duplicate the clipPath `id`
    // attributes in the DOM.
    // ------------------------------------------------------------------------
    const WEATHER_GLYPHS = {
        // sunny — clear sun with rays  (Type=Sunny.svg)
        sunny:
            '<path d="M6.27112 13.7289C5.28216 12.7399 4.72656 11.3986 4.72656 10C4.72656 8.6014 5.28216 7.26008 6.27112 6.27112C7.26008 5.28216 8.6014 4.72656 10 4.72656C11.3986 4.72656 12.7399 5.28216 13.7289 6.27112C14.7178 7.26008 15.2734 8.6014 15.2734 10C15.2734 11.3986 14.7178 12.7399 13.7289 13.7289C12.7399 14.7178 11.3986 15.2734 10 15.2734C8.6014 15.2734 7.26008 14.7178 6.27112 13.7289Z"/>' +
            '<path d="M10 2.38281V1.21094"/>' +
            '<path d="M15.3859 4.61406L16.2148 3.78516"/>' +
            '<path d="M17.6172 10H18.7891"/>' +
            '<path d="M15.3859 15.3859L16.2148 16.2148"/>' +
            '<path d="M10 17.6172V18.7891"/>' +
            '<path d="M4.61406 15.3859L3.78516 16.2148"/>' +
            '<path d="M2.38281 10H1.21094"/>' +
            '<path d="M4.61406 4.61406L3.78516 3.78516"/>',
        // cloudy — sun behind cloud  (Type=Cloudy.svg)
        cloudy:
            '<path d="M7.07031 5.3125V2.96875"/>' +
            '<path d="M3.55469 8.82812H1.21094"/>' +
            '<path d="M9.55627 6.34218L11.2133 4.68515"/>' +
            '<path d="M4.5844 6.34218L2.92737 4.68515"/>' +
            '<path d="M4.1406 10.7687C3.88419 10.3762 3.70888 9.93634 3.62501 9.47504C3.54113 9.01373 3.55038 8.54031 3.6522 8.08264C3.75403 7.62496 3.94637 7.19228 4.21792 6.81005C4.48946 6.42782 4.83472 6.10377 5.23338 5.85697C5.63203 5.61017 6.07603 5.4456 6.53923 5.37296C7.00244 5.30031 7.47549 5.32106 7.93056 5.43397C8.38563 5.54688 8.81351 5.74968 9.18903 6.03044C9.56455 6.31119 9.88012 6.66422 10.1172 7.06875"/>' +
            '<path d="M9.45078 12.9297C9.4263 12.7353 9.41403 12.5396 9.41406 12.3438C9.41518 12.0494 9.44475 11.7559 9.50234 11.4672"/>' +
            '<path d="M14.1015 17.0312C14.9914 17.0323 15.8631 16.7801 16.6149 16.304C17.3667 15.828 17.9674 15.1478 18.3469 14.343C18.7264 13.5381 18.869 12.6419 18.758 11.759C18.647 10.8762 18.287 10.0431 17.7201 9.35728C17.1532 8.67143 16.4028 8.16111 15.5566 7.88597C14.7104 7.61083 13.8033 7.58222 12.9414 7.80351C12.0796 8.02479 11.2985 8.48682 10.6895 9.13558C10.0805 9.78435 9.66872 10.5931 9.50232 11.4672C9.10599 11.2772 8.67195 11.1789 8.23243 11.1797C7.79291 11.1805 7.35922 11.2802 6.96356 11.4716C6.56789 11.663 6.22043 11.9411 5.94698 12.2852C5.67353 12.6293 5.48112 13.0305 5.38404 13.4592C5.28695 13.8879 5.28769 14.3329 5.3862 14.7612C5.48471 15.1896 5.67846 15.5902 5.95305 15.9334C6.22764 16.2766 6.57603 16.5535 6.97232 16.7435C7.36862 16.9336 7.80265 17.0319 8.24216 17.0312H14.1015Z"/>',
        // rain — sun behind cloud + 2 drops  (Type=Type4.svg)
        rain:
            '<path d="M7.48126 14.8312L4.55157 17.7609"/>' +
            '<path d="M11.5828 14.8312L8.65314 17.7609"/>' +
            '<path d="M6.93204 8.38593C6.90756 8.19158 6.89529 7.99588 6.89532 7.79999C6.89684 7.50567 6.9264 7.21215 6.98361 6.92343"/>' +
            '<path d="M11.5828 12.4875C12.4726 12.4885 13.3444 12.2363 14.0961 11.7603C14.8479 11.2842 15.4487 10.604 15.8282 9.79921C16.2077 8.99438 16.3503 8.09815 16.2393 7.21528C16.1283 6.33241 15.7683 5.49937 15.2014 4.81352C14.6345 4.12767 13.884 3.61735 13.0378 3.34221C12.1916 3.06706 11.2846 3.03846 10.4227 3.25975C9.56083 3.48103 8.77975 3.94305 8.17074 4.59182C7.56174 5.24059 7.14998 6.0493 6.98358 6.92342C6.58725 6.73343 6.15321 6.63516 5.71369 6.63593C5.27418 6.6367 4.84048 6.73648 4.44482 6.92786C4.04916 7.11924 3.7017 7.39731 3.42825 7.7414C3.1548 8.0855 2.96238 8.48678 2.8653 8.91544C2.76821 9.3441 2.76895 9.78913 2.86746 10.2175C2.96597 10.6458 3.15972 11.0464 3.43431 11.3896C3.70891 11.7328 4.05729 12.0097 4.45359 12.1998C4.84988 12.3898 5.28391 12.4882 5.72343 12.4875H11.5828Z"/>',
        // heavyRain — sun behind cloud + 4 drops  (Type=Type5.svg)
        heavyRain:
            '<path d="M8.26251 14.6359L5.33282 17.5656"/>' +
            '<path d="M15.2938 14.6359L12.3641 17.5656"/>' +
            '<path d="M11.7781 14.6359L10.0203 16.3937"/>' +
            '<path d="M4.74689 14.6359L2.98907 16.3937"/>' +
            '<path d="M7.71329 8.19062C7.68881 7.99627 7.67654 7.80057 7.67657 7.60468C7.67809 7.31035 7.70765 7.01684 7.76486 6.72812"/>' +
            '<path d="M12.3641 12.2922C13.2539 12.2932 14.1256 12.041 14.8774 11.565C15.6292 11.0889 16.2299 10.4087 16.6094 9.6039C16.9889 8.79907 17.1315 7.90284 17.0205 7.01997C16.9095 6.1371 16.5495 5.30405 15.9826 4.61821C15.4157 3.93236 14.6653 3.42204 13.8191 3.1469C12.9729 2.87175 12.0658 2.84315 11.2039 3.06443C10.3421 3.28572 9.561 3.74774 8.95199 4.39651C8.34299 5.04528 7.93123 5.85398 7.76483 6.72811C7.3685 6.53811 6.93446 6.43985 6.49494 6.44062C6.05543 6.44139 5.62173 6.54117 5.22607 6.73255C4.83041 6.92393 4.48295 7.202 4.2095 7.54609C3.93605 7.89019 3.74363 8.29147 3.64655 8.72013C3.54946 9.14879 3.5502 9.59381 3.64871 10.0222C3.74722 10.4505 3.94097 10.8511 4.21556 11.1943C4.49016 11.5375 4.83854 11.8144 5.23484 12.0045C5.63113 12.1945 6.06516 12.2929 6.50468 12.2922H12.3641Z"/>',
        // showers — full cloud + 2 drops  (Type=Type6.svg)
        showers:
            '<path d="M1.21096 11.5906C1.19983 11.0672 1.29453 10.5469 1.48938 10.061C1.68424 9.5751 1.97523 9.13355 2.34492 8.76285C2.7146 8.39214 3.15535 8.09993 3.64073 7.90373C4.12611 7.70754 4.64611 7.6114 5.16956 7.62109C5.58281 6.68145 6.25833 5.88094 7.11511 5.31558C7.9719 4.75021 8.97357 4.44397 10 4.43359C11.3894 4.45975 12.7161 5.01664 13.7079 5.98998C14.6997 6.96333 15.2814 8.27933 15.3336 9.66797C15.7597 9.58439 16.199 9.59759 16.6193 9.70659C17.0395 9.81558 17.4299 10.0176 17.7616 10.2977C18.0933 10.5778 18.3579 10.9289 18.5357 11.3249C18.7135 11.721 18.8001 12.1519 18.7891 12.5859C18.7891 15.6156 15.7321 15.568 15.7321 15.568H4.65003C3.6923 15.434 2.81575 14.9569 2.18324 14.2254C1.55072 13.4939 1.20523 12.5577 1.21096 11.5906Z"/>' +
            '<path d="M10 15.5664L11.7578 12.6367"/>' +
            '<path d="M13.5156 15.5664L15.2734 12.6367"/>',
        // thunderstorm — cloud + lightning bolt  (Type=Thunderstorm.svg)
        thunderstorm:
            '<path d="M7.38906 5.89844C7.38773 6.09425 7.39869 6.28995 7.42187 6.48438C7.39764 6.29001 7.38564 6.09432 7.38593 5.89844C7.38705 5.60409 7.41662 5.31054 7.47421 5.02188"/>' +
            '<path d="M12.7875 10.532C13.6371 10.4023 14.4346 10.0415 15.0929 9.48906C15.7513 8.93663 16.2451 8.21384 16.5204 7.39971C16.7957 6.58558 16.8418 5.71143 16.6538 4.87283C16.4658 4.03423 16.0509 3.26346 15.4544 2.64477C14.8579 2.02608 14.1028 1.58328 13.2716 1.36478C12.4404 1.14628 11.5652 1.16049 10.7415 1.40586C9.91789 1.65123 9.17756 2.11831 8.60146 2.75604C8.02536 3.39378 7.63567 4.17761 7.475 5.02187C7.07858 4.83184 6.64443 4.73357 6.20482 4.73439C5.7652 4.7352 5.33142 4.83507 4.93571 5.02658C4.54 5.21808 4.19253 5.4963 3.91912 5.84055C3.64571 6.1848 3.4534 6.58624 3.35646 7.01504C3.25953 7.44384 3.26047 7.88896 3.35922 8.31735C3.45796 8.74573 3.65197 9.14635 3.92683 9.48945C4.20169 9.83254 4.55034 10.1093 4.94685 10.2991C5.34337 10.4889 5.77757 10.587 6.21719 10.5859H7.38906"/>' +
            '<path d="M10.3187 10.5859L6.13124 14.7734C6.09032 14.8144 6.06246 14.8666 6.05118 14.9234C6.0399 14.9802 6.0457 15.039 6.06785 15.0925C6.09 15.146 6.12751 15.1918 6.17564 15.224C6.22378 15.2562 6.28037 15.2734 6.33827 15.2734H7.97499V18.7891L12.1617 14.6016C12.2026 14.5606 12.2305 14.5084 12.2418 14.4516C12.2531 14.3948 12.2473 14.336 12.2251 14.2825C12.203 14.229 12.1654 14.1832 12.1173 14.151C12.0692 14.1188 12.0126 14.1016 11.9547 14.1016H10.3187V10.5859Z"/>',
        // snow — snowflake  (Type=Type7.svg)
        snow:
            '<path d="M10 1.21094V7.07031"/>' +
            '<path d="M12.9297 2.38281L10 4.72656L7.07031 2.38281"/>' +
            '<path d="M2.38831 5.60547L7.46252 8.53516"/>' +
            '<path d="M4.86798 3.6539L5.43282 7.36328L1.93829 8.7289"/>' +
            '<path d="M2.38831 14.3945L7.46252 11.4648"/>' +
            '<path d="M1.93829 11.2711L5.43282 12.6367L4.86798 16.3461"/>' +
            '<path d="M10 18.7891V12.9297"/>' +
            '<path d="M7.07031 17.6172L10 15.2734L12.9297 17.6172"/>' +
            '<path d="M17.6117 14.3945L12.5375 11.4648"/>' +
            '<path d="M15.132 16.3461L14.5672 12.6367L18.0617 11.2711"/>' +
            '<path d="M17.6117 5.60547L12.5375 8.53516"/>' +
            '<path d="M18.0617 8.7289L14.5672 7.36328L15.132 3.6539"/>' +
            '<path d="M10 7.07031L7.46252 8.53516V11.4648L10 12.9297L12.5375 11.4648V8.53516L10 7.07031Z"/>',
        // clearNight — crescent moon + sparkles  (Type=Type8.svg)
        clearNight:
            '<path d="M14.0898 12.9297C12.8992 12.9294 11.7252 12.6501 10.662 12.1141C9.59876 11.5782 8.67598 10.8005 7.96764 9.84346C7.25931 8.88643 6.78514 7.7767 6.58317 6.60331C6.3812 5.42991 6.45706 4.22551 6.80466 3.08673C5.65088 3.61855 4.6485 4.43061 3.88887 5.44894C3.12924 6.46727 2.63649 7.6595 2.45551 8.91699C2.27454 10.1745 2.4111 11.4573 2.85275 12.6485C3.29441 13.8397 4.02711 14.9015 4.9841 15.7371C5.9411 16.5726 7.09196 17.1555 8.33185 17.4325C9.57173 17.7095 10.8612 17.6718 12.0828 17.3229C13.3044 16.9741 14.4193 16.325 15.3259 15.435C16.2325 14.545 16.902 13.4423 17.2734 12.2274C16.2758 12.6899 15.1894 12.9296 14.0898 12.9297Z"/>' +
            '<path d="M9.98828 3.55469H13.5039"/>' +
            '<path d="M11.7461 1.79688V5.3125"/>' +
            '<path d="M15.2617 7.07031H17.6055"/>' +
            '<path d="M16.4336 5.89844V8.24219"/>',
        // nightCloudy — moon behind cloud  (Type=Type10.svg)
        nightCloudy:
            '<path d="M3.19531 12.1805C2.40193 11.8608 1.71149 11.3295 1.19922 10.6445C2.09659 10.8098 3.0232 10.6893 3.84844 10.3C4.90214 9.80197 5.71485 8.90577 6.10779 7.80855C6.50073 6.71132 6.44173 5.50294 5.94375 4.44922C5.71262 3.96701 5.39485 3.53139 5.00625 3.16406C6.13766 3.17242 7.22756 3.5913 8.07336 4.34283C8.91915 5.09436 9.46331 6.12742 9.60469 7.25"/>' +
            '<path d="M9.43828 13.1094C9.41445 12.915 9.40245 12.7193 9.40234 12.5234C9.40339 12.2291 9.43295 11.9355 9.49063 11.6469"/>' +
            '<path d="M14.0898 17.2109C14.9796 17.212 15.8514 16.9598 16.6032 16.4837C17.3549 16.0077 17.9557 15.3275 18.3352 14.5227C18.7147 13.7178 18.8573 12.8216 18.7463 11.9387C18.6353 11.0559 18.2753 10.2228 17.7084 9.53697C17.1415 8.85112 16.3911 8.3408 15.5448 8.06566C14.6986 7.79051 13.7916 7.76191 12.9297 7.9832C12.0678 8.20448 11.2868 8.6665 10.6778 9.31527C10.0688 9.96404 9.657 10.7727 9.4906 11.6469C9.09427 11.4569 8.66023 11.3586 8.22071 11.3594C7.7812 11.3601 7.3475 11.4599 6.95184 11.6513C6.55617 11.8427 6.20871 12.1208 5.93526 12.4649C5.66181 12.8089 5.4694 13.2102 5.37232 13.6389C5.27523 14.0676 5.27597 14.5126 5.37448 14.9409C5.47299 15.3692 5.66674 15.7699 5.94133 16.1131C6.21593 16.4563 6.56431 16.7332 6.96061 16.9232C7.3569 17.1133 7.79093 17.2116 8.23045 17.2109H14.0898Z"/>',
        // nightRain — moon behind cloud + 2 drops  (Type=Type9.svg)
        nightRain:
            '<path d="M11.1602 15.2734L7.64453 18.7891"/>' +
            '<path d="M14.6758 15.2734L11.1602 18.7891"/>' +
            '<path d="M3.19531 10.243C2.40193 9.92331 1.71149 9.39203 1.19922 8.70703C2.09692 8.87098 3.02343 8.74939 3.84844 8.35938C4.90219 7.86119 5.71491 6.96485 6.10785 5.8675C6.50079 4.77014 6.44176 3.56165 5.94375 2.50781C5.71175 2.02688 5.39346 1.5926 5.00469 1.22656C6.1361 1.23492 7.226 1.6538 8.07179 2.40533C8.91759 3.15686 9.46175 4.18992 9.60312 5.3125"/>' +
            '<path d="M16.4336 14.6461C17.1148 14.2542 17.6865 13.6973 18.0962 13.0266C18.5059 12.3559 18.7403 11.593 18.7781 10.808C18.8158 10.023 18.6555 9.24113 18.312 8.53426C17.9685 7.8274 17.4528 7.21826 16.8123 6.76284C16.1718 6.30742 15.4271 6.02035 14.6466 5.92803C13.8661 5.8357 13.075 5.94109 12.3459 6.23451C11.6168 6.52792 10.9732 6.99993 10.4743 7.60714C9.97535 8.21434 9.63708 8.93725 9.4906 9.70938C9.09427 9.51939 8.66023 9.42112 8.22071 9.42189C7.7812 9.42266 7.3475 9.52244 6.95184 9.71382C6.55617 9.90521 6.20871 10.1833 5.93526 10.5274C5.66181 10.8715 5.4694 11.2727 5.37232 11.7014C5.27523 12.1301 5.27597 12.5751 5.37448 13.0034C5.47299 13.4318 5.66674 13.8324 5.94133 14.1756C6.21593 14.5188 6.56431 14.7957 6.96061 14.9857C7.3569 15.1758 7.79093 15.2741 8.23045 15.2734"/>' +
            '<path d="M9.43828 11.1719C9.41445 10.9775 9.40245 10.7818 9.40234 10.5859C9.40346 10.2916 9.43303 9.99804 9.49063 9.70938"/>'
    };

    // Wrap a glyph's geometry in the shared 20x20 stroke-only shell. Size is
    // overridable so the same assets can be reused at other scales.
    function weatherIcon(name, size) {
        const px = size || 20;
        return '<svg width="' + px + '" height="' + px + '" viewBox="0 0 20 20" ' +
            'fill="none" stroke="#727272" stroke-width="1.25" ' +
            'stroke-linecap="round" stroke-linejoin="round" ' +
            'style="display:block;">' + (WEATHER_GLYPHS[name] || '') + '</svg>';
    }

    // ------------------------------------------------------------------------
    // 1. Multi-line chart (Coffee / Pastries / Cold Brew / Tea)
    // ------------------------------------------------------------------------
    function multiLine() {
        return {
            chart: {
                type: 'line',
                backgroundColor: 'transparent',
                style: { fontFamily: FONT },
                // Minimal left/right spacing so the chart uses the available
                // width. NOT 0: Highcharts sizes the axis gutter as
                // labelWidth + spacing, so at 0 the outermost label lands
                // exactly on x=0 and its first pixel column is clipped by the
                // SVG viewport. 4px is the smallest value that clears it.
                spacing: [16, 4, 16, 4],
                events: {
                    // Longer gaps between the short gridline dashes.
                    render: function () { styleGridDashes(this); }
                }
            },

            title: { text: null },
            subtitle: { text: null },
            credits: { enabled: false },
            exporting: { enabled: false },

            xAxis: {
                categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                lineWidth: 0,
                tickWidth: 0,
                minPadding: 0,
                maxPadding: 0,
                labels: { style: { color: '#727272', fontSize: '14px' } },
                // Figma hover line: --color-gray-060 (#727272), 1px
                crosshair: { width: 1, color: '#727272', dashStyle: 'Dot' }
            },

            yAxis: {
                title: { text: null },
                // web-lib-sprout (Tokens)/Caption — --text-help #727272, Graphik 14px/20px, weight 400
                labels: {
                    enabled: true,
                    style: {
                        color: '#727272',
                        fontFamily: 'Graphik, ' + FONT,
                        fontSize: '14px',
                        fontWeight: '400',
                        lineHeight: '20px'
                    }
                },
                // Dotted grid line — --color-gray-020 #E5E5E5
                gridLineWidth: 1,
                gridLineColor: '#E5E5E5',
                gridLineDashStyle: 'ShortDash',
                minorGridLineWidth: 0,
                // Cap at 5 ticks/labels to keep the grid simple.
                tickAmount: 5,
                maxPadding: 0.08,
                minPadding: 0.05
            },

            legend: {
                align: 'left',
                verticalAlign: 'top',
                symbolWidth: 12,
                symbolHeight: 12,
                symbolRadius: 6,       // 12px box + radius 6 → circular dot
                squareSymbol: true,
                itemDistance: 12,
                margin: 30,
                itemStyle: { fontWeight: 'normal', color: '#5a5a5a', fontSize: '14px', cursor: 'default' },
                itemHoverStyle: { color: '#5a5a5a' },
                events: { itemClick: function (e) { e.preventDefault(); } }
            },

            tooltip: {
                shared: true,
                useHTML: true,
                // Native shell renders the surface + shadow cleanly (no hard edge).
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                borderWidth: 0,
                borderRadius: 10,
                padding: 10,
                shadow: { color: 'rgba(0, 0, 0, 0.12)', offsetX: 0, offsetY: 2, width: 6 },
                style: { color: '#5a5a5a' },
                formatter: function () {
                    const title = this.points[0].key;
                    let rows = '';
                    this.points.forEach(function (p) {
                        // Each row flexes to both ends: label (dot + name) left, value right.
                        rows +=
                            '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
                                '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
                                    dot(p.color) +
                                    '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
                                '</span>' +
                                '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">' + p.y + '</span>' +
                            '</div>';
                    });
                    // Flex layout only; the shell owns the surface + shadow.
                    // 144px min, 288px max, truncate anything wider.
                    return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
                        '<div style="font-size:14px;font-weight:700;color:#5a5a5a;white-space:nowrap;">' + title + '</div>' +
                        rows +
                    '</div>';
                }
            },

            plotOptions: {
                series: {
                    label: { enabled: false },
                    legendSymbol: 'rectangle',   // with symbolRadius:6 → circular dot
                    lineWidth: 2.5,
                    states: {
                        hover: { lineWidth: 2.5, halo: { size: 8, opacity: 0.12 } },
                        inactive: { opacity: 0.35 }
                    },
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        states: { hover: { enabled: true, radius: 6, lineWidth: 1, lineColor: '#FFF' } }
                    },
                    linecap: 'round',
                    linejoin: 'round'
                }
            },

            series: [
                { name: 'Coffee', color: '#228800', data: [9, 8.5, 7, 6, 4.5, 3, 1.5] },
                { name: 'Pastries', color: '#1495DB', data: [1.5, 2.5, 4, 5, 6.5, 8, 9.5] },
                { name: 'Cold Brew', color: '#A175DB', data: [7, 5, 3, 2, 3.5, 5.5, 7.5] },
                { name: 'Tea', color: '#CF6B9F', data: [3, 5, 7.5, 9, 7, 4.5, 2.5] }
            ]
        };
    }

    // ------------------------------------------------------------------------
    // 2. Stylized single line chart (Net Sales) — single line + gradient fill
    //    Two variants share one builder:
    //      • stylizedLine     — no y-axis (clean, label-free)
    //      • stylizedLineAxis — with a styled y-axis (Caption labels + gridlines)
    // ------------------------------------------------------------------------
    function stylizedLine(showYAxis) {
        // Y-axis config matches the multi-line chart: Caption labels
        // (--text-help #727272, Graphik 14px/20px/400) + ShortDash gridlines
        // (--color-gray-020 #E5E5E5), capped at 5 ticks.
        var yAxis = showYAxis
            ? {
                title: { text: null },
                labels: {
                    enabled: true,
                    format: '${text}',
                    style: {
                        color: '#727272',
                        fontFamily: 'Graphik, ' + FONT,
                        fontSize: '14px',
                        fontWeight: '400',
                        lineHeight: '20px'
                    }
                },
                gridLineWidth: 1,
                gridLineColor: '#E5E5E5',
                gridLineDashStyle: 'ShortDash',
                minorGridLineWidth: 0,
                tickAmount: 5,
                min: 0
            }
            : { visible: false, max: 1000 };

        return {
            chart: {
                type: 'area',
                backgroundColor: '#FFFFFF',
                // Minimal left/right spacing (see multiLine): 0 would clip the
                // outermost y-axis label against the SVG edge.
                spacing: [16, 4, 16, 4],
                style: { fontFamily: FONT },
                events: {
                    // Longer gaps between the short gridline dashes (y-axis variant).
                    render: function () { if (showYAxis) styleGridDashes(this); }
                }
            },

            title: { text: null },
            subtitle: { text: null },
            credits: { enabled: false },
            exporting: { enabled: false },

            xAxis: {
                categories: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                lineWidth: 0,
                tickWidth: 0,
                minPadding: 0,
                maxPadding: 0,
                labels: { style: { color: '#727272', fontSize: '14px' } },
                // Figma hover line: --color-gray-060 (#727272), 1px
                crosshair: { width: 1, color: '#727272', dashStyle: 'Dot' }
            },

            yAxis: yAxis,

            legend: {
                enabled: true,
                align: 'left',
                verticalAlign: 'top',
                symbolWidth: 12,
                symbolHeight: 12,
                symbolRadius: 6,             // 12px box + radius 6 → circular dot
                squareSymbol: true,
                itemDistance: 12,
                margin: 30,
                itemStyle: { fontWeight: 'normal', color: '#5a5a5a', fontSize: '14px', cursor: 'default' },
                itemHoverStyle: { color: '#5a5a5a' },
                events: { itemClick: function (e) { e.preventDefault(); } }
            },

            tooltip: {
                shared: true,
                useHTML: true,
                // Native shell renders the surface + shadow cleanly (no hard edge).
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                borderWidth: 0,
                borderRadius: 10,
                padding: 10,
                shadow: { color: 'rgba(0, 0, 0, 0.12)', offsetX: 0, offsetY: 2, width: 6 },
                style: { color: '#5a5a5a' },
                formatter: function () {
                    const p = this.points[0];
                    // Flex layout only; the shell owns the surface + shadow.
                    // Figma card: 144px min, 288px max, truncate wider.
                    return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
                        '<div style="font-size:14px;font-weight:700;color:#5a5a5a;white-space:nowrap;">' +
                            p.key +
                        '</div>' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
                            '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
                                dot(p.color) +
                                '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
                            '</span>' +
                            '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">$' + p.y + '</span>' +
                        '</div>' +
                    '</div>';
                }
            },

            plotOptions: {
                area: {
                    lineColor: '#2D8911',
                    lineWidth: 2.5,
                    legendSymbol: 'rectangle',
                    label: { enabled: false },
                    // Figma --Area-Graph-Fill: linear-gradient(0deg, rgba(242,252,238,0) -0.4%, #A7E1A3 100%)
                    // Held at 0.55 alpha to match the combo chart, so the
                    // dotted gridlines read through the fill on the y-axis
                    // variant and the two templates share one recipe.
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, 'rgba(167, 225, 163, 0.55)'],  // #A7E1A3 near the line
                            [1, 'rgba(242, 252, 238, 0.0)']    // fade to the axis
                        ]
                    },
                    linecap: 'round',
                    linejoin: 'round',
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        states: { hover: { enabled: true, radius: 6, lineWidth: 1, lineColor: '#FFF' } }
                    },
                    states: { hover: { lineWidth: 2.5, halo: { size: 8, opacity: 0.12 } } }
                }
            },

            series: [{
                name: 'Net Sales',
                color: '#2D8911',
                data: [650, 480, 220, 290, 823, 980, 550]
            }]
        };
    }

    // Named variants for the two stylized single-line flavors.
    function stylizedLineNoAxis() { return stylizedLine(false); }
    function stylizedLineAxis()   { return stylizedLine(true); }

    // ------------------------------------------------------------------------
    // 3. Bar chart (Items 1–5, pill bars) — label-forward, right-aligned values
    // ------------------------------------------------------------------------
    function bar() {
        const CATS = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
        const VALUES = [20.30, 18.40, 16.20, 11.70, 9.50];
        const maxVal = Math.max.apply(null, VALUES);
        const BAR_H = 20;        // bar thickness
        const GAP = 12;          // gap between a label and the bar ABOVE it
        const LABEL_BLOCK = 22;  // 14px label text + a few px so it sits above its own bar
        const TOP = 30;          // marginTop (room for the first label)
        const BOTTOM = 16;       // spacing below the plot
        const VALUE_GAP = 24;    // min px between the longest bar and the value text
        const SPACING_R = 16;    // right spacing (matches chart.spacing[1])
        const LABEL_FONT = 'bold 16px ' + FONT; // value-label font, for measuring
        const band = BAR_H + GAP + LABEL_BLOCK;   // 54px → verified 12px label↔prev-bar

        // Pre-measure the widest "$value" label so we can reserve a value column
        // exactly wide enough + a 24px gap from the longest bar (no reflow loops).
        const widestLabel = Math.max.apply(null, VALUES.map(function (v) {
            return measureTextWidth('$' + v.toFixed(2), LABEL_FONT);
        }));
        const MARGIN_R = Math.ceil(widestLabel) + SPACING_R + VALUE_GAP;

        return {
            chart: {
                type: 'bar',
                backgroundColor: 'transparent',
                spacing: [16, 16, 16, 16],
                marginTop: TOP,
                // Reserve the value column: widest label + 24px gap from the bars.
                marginRight: MARGIN_R,
                // Fixed height so each category row = `band` → exact 12px label gaps.
                height: CATS.length * band + TOP + BOTTOM,
                style: { fontFamily: FONT },
                events: {
                    // Draw the value labels ourselves as right-anchored SVG text.
                    // text-anchor:'end' pins every right edge to the same x, so the
                    // column is perfectly aligned and can never be clipped
                    // (independent of each label's width, stable during animation).
                    render: function () {
                        const chart = this;
                        const s = chart.series[0];
                        if (!s || !s.points) return;
                        // Clear the previous batch (render fires on every reflow).
                        (chart.__valueLabels || []).forEach(function (el) { el.destroy(); });
                        chart.__valueLabels = [];
                        const n = s.points.length;
                        const rightX = chart.chartWidth - chart.spacing[1]; // shared right edge
                        const bandH = chart.plotHeight / n;
                        s.points.forEach(function (p, i) {
                            // Vertical center of category i (reversed → Item 1 on top).
                            const cy = chart.plotTop + (i + 0.5) * bandH + 5.5; // +5.5 ≈ baseline
                            chart.__valueLabels.push(
                                chart.renderer
                                    .text('$' + p.y.toFixed(2), rightX, cy)
                                    .attr({ 'text-anchor': 'end', zIndex: 6 })
                                    .css({
                                        color: '#333333',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        fontFamily: FONT
                                    })
                                    .add()
                            );
                        });
                    }
                }
            },

            title: { text: null },
            subtitle: { text: null },
            credits: { enabled: false },
            exporting: { enabled: false },

            xAxis: {
                categories: CATS,
                reversed: true,    // 'Item 1' at the top
                lineWidth: 0,
                tickWidth: 0,
                labels: {
                    align: 'left',
                    x: 0,
                    y: -16,        // sit the label above the 20px bar
                    style: { color: '#727272', fontSize: '14px' }
                }
            },

            // Longest bar fills the plot; the value column sits 24px past it.
            yAxis: { visible: false, max: maxVal, endOnTick: false, startOnTick: false, maxPadding: 0 },

            legend: { enabled: false },
            tooltip: { enabled: false },   // no tooltip (paired with no mouse tracking)

            plotOptions: {
                bar: {
                    pointWidth: BAR_H,                              // fixed 20px bar height
                    borderRadius: { radius: '50%', where: 'all' },  // BOTH ends rounded
                    borderWidth: 0,
                    colorByPoint: true,
                    animation: true,            // default intro animation (bars grow in)
                    enableMouseTracking: false, // no hover state at all
                    states: {
                        hover: { enabled: false },
                        inactive: { enabled: false }
                    },
                    // Value labels are drawn in chart.events.render (right-anchored
                    // SVG text) so they align exactly and never clip.
                    dataLabels: { enabled: false }
                }
            },

            colors: [
                '#228800', // Item 1: Green
                '#1495DB', // Item 2: Blue
                '#A175DB', // Item 3: Purple
                '#CF6B9F', // Item 4: Pink
                '#D76A57'  // Item 5: Red
            ],

            series: [{
                name: 'Values',
                data: VALUES
            }]
        };
    }

    // ------------------------------------------------------------------------
    // 4. Combo chart (stylized area line + pill columns, dual y-axis)
    //    Pairs the stylized gradient area from #2 with the pill columns from
    //    #3. Pill columns read the LEFT axis (total sales); the area line
    //    reads the RIGHT axis (°F). Both axes span 4 ticks so their
    //    gridlines land on exactly the same pixels. Two weeks of daily data.
    // ------------------------------------------------------------------------
    function comboArea() {
        // Left (sales) and right (°F) each span 4 ticks:
        //   left  100 → 400 step 100
        //   right  70 → 100 step 10
        const L_MIN = 100, L_MAX = 400, L_STEP = 100;
        const R_MIN = 70,  R_MAX = 100, R_STEP = 10;

        // Temperature — same line color as the stylized single line chart (#2)
        // so the two templates read as one family.
        const TEMP = '#2D8911';
        // Sales pills — shared palette blue. Hover uses an explicit DARKER
        // shade (~22%) because `brightness` lightens toward white and reads
        // weakly on a mid-tone fill.
        const SALES = '#1495DB';
        const SALES_HOVER = '#0F74AB';

        // Caption label style shared by both axes (--text-help #727272).
        const captionLabel = {
            color: '#727272',
            fontFamily: 'Graphik, ' + FONT,
            fontSize: '14px',
            fontWeight: '400',
            lineHeight: '20px'
        };

        return {
            chart: {
                // Base type is area; the sales series opts into 'column'.
                type: 'area',
                backgroundColor: 'transparent',
                style: { fontFamily: FONT },
                // Minimal left/right spacing (see multiLine). This chart has
                // labels on BOTH outer edges, so 0 clipped the sales axis on
                // the left and the °F axis on the right.
                spacing: [16, 4, 16, 4],
                events: {
                    // Longer gaps between the short gridline dashes.
                    render: function () { styleGridDashes(this); }
                }
            },

            title: { text: null },
            subtitle: { text: null },
            credits: { enabled: false },
            exporting: { enabled: false },

            xAxis: {
                // Two weeks of daily data. Categories hold the FULL day name so
                // the tooltip card reads "Sunday"; the axis itself is squeezed
                // back down to a single initial by the label formatter below.
                categories: ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
                             'Thursday', 'Friday', 'Saturday',
                             'Sunday', 'Monday', 'Tuesday', 'Wednesday',
                             'Thursday', 'Friday', 'Saturday'],
                lineWidth: 0,
                tickWidth: 0,
                minPadding: 0,
                maxPadding: 0,
                labels: {
                    // Render just the initial (S, M, T, W, T, F, S) so 14 days
                    // fit without crowding.
                    formatter: function () { return String(this.value).charAt(0); },
                    style: { color: '#727272', fontSize: '14px' }
                },
                // Figma hover line: --color-gray-060 (#727272), 1px
                crosshair: { width: 1, color: '#727272', dashStyle: 'Dot' }
            },

            yAxis: [
                // [0] LEFT — total sales. Owns the dotted gridlines.
                {
                    title: { text: null },
                    labels: { enabled: true, style: captionLabel },
                    gridLineWidth: 1,
                    gridLineColor: '#E5E5E5',
                    gridLineDashStyle: 'ShortDash',
                    minorGridLineWidth: 0,
                    min: L_MIN,
                    max: L_MAX,
                    tickInterval: L_STEP,
                    startOnTick: true,
                    endOnTick: true
                },
                // [1] RIGHT — temperature. No gridlines (the left axis draws them).
                {
                    title: { text: null },
                    opposite: true,
                    labels: { enabled: true, format: '{value}°F', style: captionLabel },
                    gridLineWidth: 0,
                    minorGridLineWidth: 0,
                    min: R_MIN,
                    max: R_MAX,
                    tickInterval: R_STEP,
                    startOnTick: true,
                    endOnTick: true
                }
            ],

            legend: {
                align: 'left',
                verticalAlign: 'top',
                symbolWidth: 12,
                symbolHeight: 12,
                symbolRadius: 6,       // 12px box + radius 6 → circular dot
                squareSymbol: true,
                itemDistance: 12,
                margin: 30,
                itemStyle: { fontWeight: 'normal', color: '#5a5a5a', fontSize: '14px', cursor: 'default' },
                itemHoverStyle: { color: '#5a5a5a' },
                events: { itemClick: function (e) { e.preventDefault(); } }
            },

            tooltip: {
                shared: true,
                useHTML: true,
                // Native shell renders the surface + shadow cleanly (no hard edge).
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                borderWidth: 0,
                borderRadius: 10,
                padding: 10,
                shadow: { color: 'rgba(0, 0, 0, 0.12)', offsetX: 0, offsetY: 2, width: 6 },
                style: { color: '#5a5a5a' },
                formatter: function () {
                    const title = this.points[0].key;
                    let rows = '';
                    this.points.forEach(function (p) {
                        // Per-series unit (e.g. $) travels on series.options.custom.
                        const custom = p.series.options.custom || {};
                        const value = (custom.prefix || '') + p.y + (custom.suffix || '');
                        rows +=
                            '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
                                '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
                                    dot(p.color) +
                                    '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
                                '</span>' +
                                '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">' + value + '</span>' +
                            '</div>';
                    });
                    // Flex layout only; the shell owns the surface + shadow.
                    // 144px min, 288px max, truncate anything wider.
                    return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
                        '<div style="font-size:14px;font-weight:700;color:#5a5a5a;white-space:nowrap;">' + title + '</div>' +
                        rows +
                    '</div>';
                }
            },

            plotOptions: {
                series: {
                    label: { enabled: false },
                    legendSymbol: 'rectangle',   // with symbolRadius:6 → circular dot
                    states: { inactive: { opacity: 0.35 } }
                },
                area: {
                    lineColor: TEMP,
                    lineWidth: 2.5,
                    linecap: 'round',
                    linejoin: 'round',
                    // Identical gradient to the stylized single line (#2):
                    // #A7E1A3 at 0.55 alpha -> transparent. The alpha keeps the
                    // dotted gridlines readable through the fill; the pills
                    // render on top as solid shapes.
                    fillColor: {
                        linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                        stops: [
                            [0, 'rgba(167, 225, 163, 0.55)'],  // #A7E1A3 near the line
                            [1, 'rgba(242, 252, 238, 0.0)']    // fade to the axis
                        ]
                    },
                    states: { hover: { lineWidth: 2.5, halo: { size: 8, opacity: 0.12 } } },
                    marker: {
                        enabled: false,
                        symbol: 'circle',
                        states: { hover: { enabled: true, radius: 6, lineWidth: 1, lineColor: '#FFF' } }
                    }
                },
                column: {
                    pointWidth: 14,                                 // slim pill
                    borderRadius: { radius: '50%', where: 'all' },  // BOTH ends rounded
                    borderWidth: 0,
                    threshold: L_MIN,                               // grow from the LEFT axis floor
                    groupPadding: 0,
                    states: {
                        // `color` takes precedence over `brightness` in
                        // ColumnSeries.pointAttribs, so this fully replaces the
                        // column default (brightness: 0.2, which lightens).
                        hover: { color: SALES_HOVER }
                    }
                }
            },

            // Temperature is declared FIRST so it leads the legend. The pills
            // carry the HIGHER zIndex so they always draw in FRONT of the area,
            // rendering as solid shapes over its translucent fill.
            series: [
                {
                    name: 'Temperature',
                    type: 'area',
                    yAxis: 1,
                    zIndex: 2,
                    color: TEMP,
                    custom: { suffix: '°F' },
                    data: [
                        86.5, 85.0, 82.8, 84.3, 84.0, 82.5, 85.2,
                        86.8, 87.2, 92.0, 92.5, 99.0, 96.5, 91.5
                    ]
                },
                {
                    name: 'Total sales',
                    type: 'column',
                    yAxis: 0,
                    zIndex: 4,
                    color: SALES,
                    data: [
                        218, 190, 175, 180, 190, 200, 220,
                        215, 190, 175, 185, 130, 158, 180
                    ]
                }
            ]
        };
    }

    // ------------------------------------------------------------------------
    // 5. Variance bar chart (pill columns above/below a zero baseline)
    //    Signed percentage variance: pills grow UP from 0 for positives, DOWN
    //    for negatives. A second, linked x-axis across the top carries a
    //    per-day annotation, so the reader can correlate the dip with the
    //    weather. Two variants share one builder:
    //      • varianceBarIcons   — weather glyphs on top
    //      • varianceBarNumbers — °F readings on top
    // ------------------------------------------------------------------------
    function varianceBar(useIcons) {
        const CATS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Long form for the tooltip header. The axis stays abbreviated (it has
        // to fit seven ticks); only the card has room to spell the day out.
        const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
                      'Thursday', 'Friday', 'Saturday'];

        // Signed variance, in percent. Positive = above forecast.
        const VALUES = [4.7, 2.5, -1.5, -3.8, -7.5, -6.0, -4.7];

        // One weather glyph per category, same order as CATS. Keys index
        // WEATHER_GLYPHS (see the supplied Type=*.svg exports).
        const WEATHER = ['sunny', 'cloudy', 'cloudy',
                         'thunderstorm', 'thunderstorm', 'showers', 'showers'];

        // Matching °F readings, same order as CATS (numbers variant).
        const TEMPS = [85, 89, 92, 95, 98, 97, 92];

        // Both variants use one shared-palette blue for the pills; the sign is
        // already carried by the direction of growth and the signed label, so
        // a second color would be redundant encoding.
        const FLAT = '#1495DB';
        const FLAT_HOVER = '#0F74AB';   // explicit darker shade (see below)

        // "+4.7%" / "-1.5%" — always signed, so the direction reads at a glance.
        function signed(v) {
            return (v > 0 ? '+' : '') + v + '%';
        }

        return {
            chart: {
                type: 'column',
                backgroundColor: 'transparent',
                style: { fontFamily: FONT },
                // Minimal left/right spacing (see multiLine): 0 would clip the
                // signed y-axis labels against the SVG edge.
                spacing: [16, 4, 16, 4],
                events: {
                    // Longer gaps between the short gridline dashes — except the
                    // zero baseline, which stays SOLID so the line the pills grow
                    // out of reads as a real axis rather than another gridline.
                    render: function () {
                        const y = this.yAxis && this.yAxis[0]
                            ? this.yAxis[0].toPixels(0)
                            : undefined;
                        styleGridDashes(this, null, y);
                    }
                }
            },

            title: { text: null },
            subtitle: { text: null },
            credits: { enabled: false },
            exporting: { enabled: false },

            xAxis: [
                // [0] BOTTOM — day labels. The series plots against this one.
                {
                    categories: CATS,
                    lineWidth: 0,
                    tickWidth: 0,
                    labels: { style: { color: '#727272', fontSize: '14px' } },
                    // Figma hover line: --color-gray-060 (#727272), 1px
                    crosshair: { width: 1, color: '#727272', dashStyle: 'Dot' }
                },
                // [1] TOP — per-day annotation. `linkedTo` keeps its ticks
                // locked to axis 0, so each label always sits over its own
                // column: a weather glyph, or the day's °F reading.
                {
                    linkedTo: 0,
                    opposite: true,
                    categories: CATS,
                    lineWidth: 0,
                    tickWidth: 0,
                    labels: useIcons
                        ? {
                            useHTML: true,
                            y: -4,
                            formatter: function () { return weatherIcon(WEATHER[this.pos]); }
                        }
                        : {
                            y: -10,
                            formatter: function () { return TEMPS[this.pos] + '°F'; },
                            style: {
                                color: '#727272',
                                fontFamily: 'Graphik, ' + FONT,
                                fontSize: '14px',
                                fontWeight: '400'
                            }
                        }
                }
            ],

            yAxis: {
                title: { text: null },
                labels: {
                    enabled: true,
                    formatter: function () { return signed(this.value); },
                    style: {
                        color: '#727272',
                        fontFamily: 'Graphik, ' + FONT,
                        fontSize: '14px',
                        fontWeight: '400',
                        lineHeight: '20px'
                    }
                },
                // Dotted grid line — --color-gray-020 #E5E5E5
                gridLineWidth: 1,
                gridLineColor: '#E5E5E5',
                gridLineDashStyle: 'ShortDash',
                minorGridLineWidth: 0,
                // Symmetric range so the zero baseline sits dead center.
                min: -10,
                max: 10,
                tickInterval: 5,
                startOnTick: true,
                endOnTick: true
            },

            legend: {
                align: 'left',
                verticalAlign: 'top',
                symbolWidth: 12,
                symbolHeight: 12,
                symbolRadius: 6,       // 12px box + radius 6 → circular dot
                squareSymbol: true,
                itemDistance: 12,
                margin: 24,
                itemStyle: { fontWeight: 'normal', color: '#5a5a5a', fontSize: '14px', cursor: 'default' },
                itemHoverStyle: { color: '#5a5a5a' },
                events: { itemClick: function (e) { e.preventDefault(); } }
            },

            tooltip: {
                shared: true,
                useHTML: true,
                // Native shell renders the surface + shadow cleanly (no hard edge).
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
                borderWidth: 0,
                borderRadius: 10,
                padding: 10,
                shadow: { color: 'rgba(0, 0, 0, 0.12)', offsetX: 0, offsetY: 2, width: 6 },
                style: { color: '#5a5a5a' },
                // Hug the hovered column the way the line charts hug their
                // point. Highcharts' default anchor for a shared COLUMN tooltip
                // sits over the plot rather than beside the bar, so the card
                // ends up floating across its neighbours. This pins it to the
                // side of the crosshair, vertically centred on the bar's tip,
                // and flips to the left rather than running off the right edge.
                positioner: function (labelWidth, labelHeight, point) {
                    const chart = this.chart;
                    const GAP = 12;   // breathing room between crosshair and card
                    const EDGE = 4;   // keep the card inside the chart box

                    // Prefer the real hovered point; `point` is a synthesised
                    // anchor whose plotY can be undefined for shared tooltips.
                    const hovered = (chart.hoverPoints || [])[0];
                    const plotX = (hovered && typeof hovered.plotX === 'number')
                        ? hovered.plotX : point.plotX;
                    const plotY = (hovered && typeof hovered.plotY === 'number')
                        ? hovered.plotY : point.plotY;

                    const anchorX = chart.plotLeft + (plotX || 0);
                    let x = anchorX + GAP;
                    if (x + labelWidth > chart.chartWidth - EDGE) {
                        x = anchorX - GAP - labelWidth;   // flip to the left side
                    }
                    x = Math.max(EDGE, Math.min(x, chart.chartWidth - labelWidth - EDGE));

                    // plotY is the bar's tip (top for +, bottom for -).
                    let y = chart.plotTop + (plotY || 0) - labelHeight / 2;
                    y = Math.max(EDGE, Math.min(y, chart.chartHeight - labelHeight - EDGE));

                    return { x: x, y: y };
                },
                formatter: function () {
                    const p = this.points[0];
                    // Points are a single color now, but keep reading it off
                    // the point so the swatch always matches what was drawn.
                    const swatch = p.point && p.point.color ? p.point.color : p.color;
                    // Category index drives the day/weather/temperature lookups.
                    // Fall back to the abbreviated key if the index is missing.
                    const i = p.point && typeof p.point.index === 'number' ? p.point.index : -1;
                    const day = DAYS[i] || p.key;
                    // The card mirrors whatever the top axis uses, so the two
                    // never repeat each other: glyph on the icons variant,
                    // °F reading on the numbers variant.
                    let meta = '';
                    if (useIcons) {
                        if (WEATHER[i]) {
                            meta = weatherIcon(WEATHER[i], 16);
                        }
                    } else if (typeof TEMPS[i] === 'number') {
                        meta = '<span style="font-size:14px;font-weight:400;color:#727272;">' +
                            TEMPS[i] + '°F</span>';
                    }
                    return '<div style="display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-sizing:border-box;min-width:144px;max-width:288px;overflow:hidden;">' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
                            '<span style="font-size:14px;font-weight:700;color:#5a5a5a;overflow:hidden;text-overflow:ellipsis;">' + day + '</span>' +
                            (meta
                                ? '<span style="display:inline-flex;align-items:center;flex:none;">' + meta + '</span>'
                                : '') +
                        '</div>' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;align-self:stretch;white-space:nowrap;">' +
                            '<span style="display:inline-flex;align-items:center;min-width:0;overflow:hidden;">' +
                                dot(swatch) +
                                '<span style="font-size:14px;font-weight:400;color:#5a5a5a;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;">' + p.series.name + '</span>' +
                            '</span>' +
                            '<span style="font-size:14px;font-weight:700;color:#333333;vertical-align:middle;">' + signed(p.y) + '</span>' +
                        '</div>' +
                    '</div>';
                }
            },

            plotOptions: {
                series: {
                    label: { enabled: false },
                    legendSymbol: 'rectangle',   // with symbolRadius:6 → circular dot
                    states: { inactive: { opacity: 0.35 } }
                },
                column: {
                    pointWidth: 14,                                 // slim pill
                    borderRadius: { radius: '50%', where: 'all' },  // BOTH ends rounded
                    borderWidth: 0,
                    threshold: 0,                                   // grow from the zero line
                    groupPadding: 0,
                    states: {
                        // Now that the pills are a single color, an explicit
                        // darker shade beats `brightness` (which lightens toward
                        // white and reads weakly on a mid-tone fill). `color`
                        // takes precedence over `brightness` in pointAttribs.
                        hover: { color: FLAT_HOVER }
                    }
                }
            },

            series: [{
                name: useIcons ? 'Sales variance' : 'Variance',
                // Single color for every pill, so the legend swatch, the bars
                // and the tooltip dot all agree. No zones.
                color: FLAT,
                data: VALUES
            }]
        };
    }

    // Named variants for the two variance flavors.
    function varianceBarIcons()   { return varianceBar(true); }
    function varianceBarNumbers() { return varianceBar(false); }

    // Ordered list the dashboard iterates to render the live "Templates" row.
    window.ChartTemplates = {
        multiLine: multiLine,
        stylizedLine: stylizedLine,
        stylizedLineNoAxis: stylizedLineNoAxis,
        stylizedLineAxis: stylizedLineAxis,
        bar: bar,
        comboArea: comboArea,
        varianceBar: varianceBar,
        varianceBarIcons: varianceBarIcons,
        varianceBarNumbers: varianceBarNumbers,
        list: [
            { key: 'multiLine',          name: 'Multi-line',                    build: multiLine },
            { key: 'stylizedLineNoAxis', name: 'Stylized single line',          build: stylizedLineNoAxis },
            { key: 'stylizedLineAxis',   name: 'Stylized single line (y-axis)', build: stylizedLineAxis },
            { key: 'bar',                name: 'Bar',                           build: bar },
            { key: 'comboArea',          name: 'Combo (stylized line + columns)', build: comboArea },
            { key: 'varianceBarIcons',   name: 'Variance bar (weather icons)',  build: varianceBarIcons },
            { key: 'varianceBarNumbers', name: 'Variance bar (numbers)',        build: varianceBarNumbers }
        ]
    };
})();
