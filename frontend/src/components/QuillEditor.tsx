import { onMount, onCleanup, createEffect } from 'solid-js'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

interface QuillEditorProps {
  id?: string
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['blockquote', 'link'],
  ['clean'],
]

export default function QuillEditor(props: QuillEditorProps) {
  let containerRef: HTMLDivElement | undefined
  let quill: Quill | undefined
  let updatingFromProp = false
  let updatingFromQuill = false

  onMount(() => {
    if (!containerRef) return

    quill = new Quill(containerRef, {
      theme: 'snow',
      placeholder: props.placeholder ?? '',
      modules: {
        toolbar: toolbarOptions,
      },
    })

    // Set initial content
    if (props.value) {
      quill.clipboard.dangerouslyPasteHTML(props.value)
    }

    quill.on('text-change', () => {
      if (updatingFromProp) return
      updatingFromQuill = true
      const html = quill?.getSemanticHTML()
      props.onValueChange(html === '<p></p>' || html == null ? '' : html)
      updatingFromQuill = false
    })
  })

  // Sync external value changes into the editor
  createEffect(() => {
    const val = props.value
    if (!quill || updatingFromQuill) return
    const current = quill.getSemanticHTML()
    const normalised = current === '<p></p>' ? '' : current
    if (val !== normalised) {
      updatingFromProp = true
      const sel = quill.getSelection()
      quill.clipboard.dangerouslyPasteHTML(val ?? '')
      if (sel) quill.setSelection(sel)
      updatingFromProp = false
    }
  })

  onCleanup(() => {
    quill = undefined
  })

  return (
    <div
      class="quill-editor-wrapper"
      style={`border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden;`}
    >
      <div
        ref={containerRef}
        id={props.id}
        style={`min-height: ${props.minHeight ?? '8rem'};`}
      />
      <style>{`
        .quill-editor-wrapper .ql-toolbar {
          border: none;
          border-bottom: 1px solid var(--color-border);
          background: var(--color-bg);
          font-family: inherit;
        }
        .quill-editor-wrapper .ql-container {
          border: none;
          font-family: inherit;
          font-size: 1rem;
        }
        .quill-editor-wrapper .ql-editor {
          min-height: ${props.minHeight ?? '8rem'};
          padding: 0.5rem 0.75rem;
          color: var(--color-text);
          line-height: 1.6;
        }
        .quill-editor-wrapper .ql-editor.ql-blank::before {
          color: var(--color-text-muted);
          font-style: normal;
        }
        .quill-editor-wrapper:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgb(37 99 235 / 0.15);
        }
      `}</style>
    </div>
  )
}
