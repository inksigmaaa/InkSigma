export default function TiptapEditorStyles() {
  return (
    <style jsx global>{`
      /*
        Only reset the focus outline here. The previous rules also forced
        "border-bottom: none !important" on every button:hover/:focus — but this
        block is global + unscoped, so hovering or focusing ANY bordered button
        in the editor (Category dropdown, Thumbnail, footer actions…) dropped its
        bottom border and, with box-sizing: border-box, shifted the inner content
        by 1px. That was the "bottom border gets cut / resizes on hover" bug.
      */
      button:focus {
        outline: none !important;
      }
    `}</style>
  );
}
