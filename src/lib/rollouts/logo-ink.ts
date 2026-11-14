/**
 * The "logoInk" permission: the app's brand colour (--brand and the three tokens built on it) swapped
 * from the brighter violet to the ink of the new logo, so the buttons match it. Colours are the
 * logo's own (public/favicon.svg, src/components/layout/logo.tsx): ink #2F2A7A on the light theme,
 * the lavender #ECEAFB the mark turns into on the dark theme.
 *
 * Plain CSS handed to a <style> tag, so it costs no request and closing the permission restores the
 * stylesheet's own values. The selectors out-rank globals.css's `:root` / `.dark` blocks (which this
 * tag also follows in the document), so nothing needs !important.
 */
export const LOGO_INK_CSS = `
:root:not(.dark){--brand:#2F2A7A;--brand-foreground:#F4F3FB;--brand-muted:#E6E4F5}
html.dark{--brand:#ECEAFB;--brand-foreground:#2F2A7A;--brand-muted:#2A2668}
`.trim();
