import { Extension } from '@tiptap/core'

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      minLevel: 0,
      maxLevel: 8,
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: element => {
              const indent = element.style.paddingLeft
              return indent ? parseInt(indent) / 30 : 0
            },
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {}
              }
              return {
                style: `padding-left: ${attributes.indent * 30}px`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { from, to } = selection

        if (dispatch) {
          tr.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0
              if (currentIndent < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                })
              }
            }
          })
        }

        return true
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state
        const { from, to } = selection

        if (dispatch) {
          tr.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0
              if (currentIndent > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                })
              }
            }
          })
        }

        return true
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
    }
  },
})