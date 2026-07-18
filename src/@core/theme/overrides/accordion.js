/**
 * Accordion chrome lives in UserThemeOptions (Ops Surface).
 * Materio bordered/skin styles intentionally stripped so deepmerge does not fight Ops.
 */
const Accordion = () => ({
  MuiAccordion: {
    defaultProps: {
      disableGutters: true,
      elevation: 0
    }
  }
})

export default Accordion
