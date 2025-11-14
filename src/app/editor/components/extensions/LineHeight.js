import { Extension } from '@tiptap/core'

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addOptions() {
    return {
      types: ['paragraph', 'heading'],
      defaultLineHeight: '1.5',
    }
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: element => element.style.lineHeight || null,
            renderHTML: attributes => {
              if (!attributes.lineHeight) {
                return {}
              }
              return {
                style: `line-height: ${attributes.lineHeight}`,
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setLineHeight: (lineHeight) => ({ commands, state }) => {
        const { selection } = state
        const { from, to } = selection

        // Find the current node or selected nodes
        let nodeFound = false
        state.doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            nodeFound = true
            return false // Stop iteration
          }
        })

        // If no suitable node found in selection, try to find the current paragraph
        if (!nodeFound) {
          const $pos = state.doc.resolve(from)
          for (let i = $pos.depth; i > 0; i--) {
            const node = $pos.node(i)
            if (this.options.types.includes(node.type.name)) {
              const start = $pos.start(i)
              const end = $pos.end(i)
              return commands.setTextSelection({ from: start, to: end }).updateAttributes(node.type.name, { lineHeight })
            }
          }
        }

        // Apply to selected nodes
        return commands.updateAttributes('paragraph', { lineHeight })
      },
    }
  },
})